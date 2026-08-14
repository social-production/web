<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import ShareUserMenu from '$lib/components/shared/ShareUserMenu.svelte';
  import ReportControl from '$lib/components/shared/ReportControl.svelte';
  import ModerationRestrictionNotice from '$lib/components/shared/ModerationRestrictionNotice.svelte';
  import SignalEngagementButtons from '$lib/components/shared/SignalEngagementButtons.svelte';
  import SurfaceTypeLabel from '$lib/components/cards/shared/SurfaceTypeLabel.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import { shareEventWithUser, toggleEventMembership } from '$lib/services/commands/events';
  import { getMessageContacts } from '$lib/services/queries/inbox';
  import type { DetailMember, EventPageData } from '$lib/types/detail';
  import type { SignalToggleResult } from '$lib/types/feed';
  import { isImplementedScheduleLabel } from '$lib/utils/scheduleMeta';
  import { formatLocalDateTime } from '$lib/utils/time';
  import { requireViewer } from '$lib/utils/requireViewer';
  import { buildSharePrefill } from '$lib/utils/sharePrefill';
  import { invalidateEventDetail } from '$lib/utils/detailInvalidation';

  let {
    data,
    signalChange = undefined,
    onMembershipChange = undefined
  }: {
    data: EventPageData;
    signalChange?: (result: SignalToggleResult) => void;
    onMembershipChange?: (next: { viewerIsMember: boolean; memberCount: number }) => void;
  } = $props();

  let liveShareContacts = $state<DetailMember[]>([]);

  async function searchShareContacts(query: string): Promise<DetailMember[]> {
    try {
      const results = await getMessageContacts(query, 8);
      liveShareContacts = results.map((contact) => ({
        id: contact.id,
        username: contact.username,
        bio: contact.bio ?? ''
      }));
      return liveShareContacts;
    } catch {
      liveShareContacts = [];
      return [];
    }
  }

  const combinedTags = $derived([...data.channelTags, ...data.communityTags]);
  const isOrganizerControlled = $derived(data.governance === 'organizer_controlled');
  const signalSummary = $derived(data.lifecycle.phaseOne?.signalSummary ?? null);
  const canSignal = $derived(
    !isOrganizerControlled &&
      Boolean(signalSummary) &&
      (data.lifecycle.phaseOne.viewerCanSignalDemand || data.lifecycle.phaseOne.viewerCanSignalOpposition)
  );
  const membershipButtonLabel = $derived(`${data.viewerIsMember ? 'Joined' : 'Join'} · ${data.memberCount}`);
  const timeLabel = $derived(
    data.scheduledAt
      ? formatLocalDateTime(data.scheduledAt)
      : isImplementedScheduleLabel(data.timeLabel)
        ? data.timeLabel.trim()
        : ''
  );
  const locationLabel = $derived(
    isImplementedScheduleLabel(data.locationLabel) ? data.locationLabel.trim() : ''
  );
  const showScheduledMeta = $derived(!!timeLabel || !!locationLabel);
  const proposalMetaCopy = $derived(
    isOrganizerControlled
      ? 'Organizers set the plan and schedule. Members can join and sign up for roles once activities are posted.'
      : data.isPrivate
        ? 'This private event stays proposal-first until an approved plan sets the live schedule and location.'
        : 'This event stays proposal-first until an approved plan sets the live schedule and location.'
  );
  const showQuorum = $derived(!isOrganizerControlled);
  const controlLabel = $derived(
    data.isPrivate
      ? isOrganizerControlled
        ? 'Organizer-controlled'
        : 'Collaborative'
      : null
  );
  const quorumLabel = $derived(
    data.lifecycle.quorumVotesRequired <= 0
      ? 'No votes required yet'
      : `${data.lifecycle.quorumVotesRequired} ${data.lifecycle.quorumVotesRequired === 1 ? 'vote' : 'votes'} required from ${data.lifecycle.voteContextPopulation} ${data.lifecycle.voteContextLabel}`
  );
  const displaySignalRatioPercent = $derived(
    signalSummary && signalSummary.totalCount > 0
      ? Math.round(signalSummary.signalRatioPercent)
      : 0
  );
  const initialViewerSignal = $derived(
    data.lifecycle.phaseOne.viewerHasDemandSignal
      ? 'demand'
      : data.lifecycle.phaseOne.viewerHasOppositionSignal
        ? 'opposition'
        : null
  );

  async function handleMembershipToggle() {
    if (!requireViewer($page.data.bootstrap?.viewer)) {
      return;
    }

    const wasMember = data.viewerIsMember;
    const previousCount = data.memberCount;
    onMembershipChange?.({
      viewerIsMember: !wasMember,
      memberCount: previousCount + (wasMember ? -1 : 1)
    });

    try {
      await toggleEventMembership(data.slug);
      await invalidateEventDetail(data.slug);
    } catch {
      onMembershipChange?.({
        viewerIsMember: wasMember,
        memberCount: previousCount
      });
    }
  }

  async function handleEventShare(username: string) {
    const result = await shareEventWithUser(data.slug, username);

    if (result.ok) {
      await invalidateEventDetail(data.slug);
    }

    return result;
  }

  async function handleCreatePostFromEvent() {
    const params = new URLSearchParams({
      prefill: buildSharePrefill(data.title, `/events/${data.slug}`)
    });
    await goto(`/create/post?${params.toString()}`);
  }
</script>

<div class="header-row">
  <div class="chips">
    <SurfaceTypeLabel kind="event" />
    <span class="meta-note">· {data.isPrivate ? 'Private' : 'Public'}</span>
    {#if controlLabel}
      <span class="meta-note">· {controlLabel}</span>
    {/if}
    <ReportControl
      hasActiveReport={Boolean(data.report)}
      isUnderReview={data.moderationState === 'under_review' || data.report?.resolution === 'under_review' || data.report?.resolution === 'open'}
      itemLabel="event"
      moderationState={data.moderationState}
      report={data.report}
      ownerUsername={data.createdByUsername}
      subjectId={data.id}
      targetId={data.id}
      targetType="event"
    />
  </div>

  <div class="header-actions">
    <TagList tags={combinedTags} maxVisible={null} />
  </div>
</div>

<ModerationRestrictionNotice active={data.moderationState === 'hidden' || data.report?.resolution === 'hidden'}>
  <h1>{data.title}</h1>
  <p class="overview-copy">{data.description}</p>
</ModerationRestrictionNotice>

<section class="meta-block" aria-label="Event overview details">
  <ul class="event-meta-list">
    {#if canSignal && signalSummary}
      <li class="meta-item demand-item">
        <strong>Signals</strong>
        <div id="participation-signals" class="signal-stack">
          <p class="signal-intro">
            {#if !data.viewerIsMember}
              Signal whether this should be facilitated on the platform — you don't need to join to participate in this step.
            {:else}
              Signal platform interest in this event — support or oppose without starting a lifecycle vote.
            {/if}
          </p>
          <SignalEngagementButtons
            entityKind="event"
            slug={data.slug}
            syncKey={data.id}
            supportCount={signalSummary?.demandCount ?? 0}
            opposeCount={signalSummary?.oppositionCount ?? 0}
            viewerSignal={initialViewerSignal}
            canSignalDemand={data.lifecycle.phaseOne.viewerCanSignalDemand}
            canSignalOpposition={data.lifecycle.phaseOne.viewerCanSignalOpposition}
            {signalChange}
          />
          <span class="signal-summary">
            Demand is {displaySignalRatioPercent}% of current proposal signals.
            {#if signalSummary.usesPlatformVoteContext}
              Proposal advancement also needs {signalSummary.requiredDemandCount} demand signals from {signalSummary.voteContextPopulation} weekly active users.
            {:else}
              Proposal advancement opens once demand stays above 66% of active signals.
            {/if}
          </span>
        </div>
      </li>
    {/if}

    {#if showQuorum}
      <li class="meta-item">
        <strong>Quorum</strong>
        <span>{quorumLabel}</span>
      </li>
    {/if}

    {#if timeLabel}
      <li class="meta-item">
        <strong>Time</strong>
        <span>{timeLabel}</span>
      </li>
    {/if}
    {#if locationLabel}
      <li class="meta-item">
        <strong>Location</strong>
        <span>{locationLabel}</span>
      </li>
    {/if}
    {#if !showScheduledMeta}
      <li class="meta-item">
        <strong>{isOrganizerControlled ? 'Plan' : 'Proposal'}</strong>
        <span>{proposalMetaCopy}</span>
      </li>
    {/if}
    <li class="meta-item">
      <strong>Members</strong>
      <div class="meta-button-row">
        {#if data.viewerCanToggleMembership}
          <button
            id="participation-join"
            aria-pressed={data.viewerIsMember}
            class:active-demand={data.viewerIsMember}
            class="demand-button"
            type="button"
            onclick={handleMembershipToggle}
          >
            {membershipButtonLabel}
          </button>
        {:else}
          <span>{data.memberCount}</span>
        {/if}

        {#if data.viewerCanShare}
          <ShareUserMenu
            buttonLabel={data.isPrivate ? 'Invite +' : 'Share +'}
            contacts={liveShareContacts.length > 0 ? liveShareContacts : data.shareContacts}
            menuTitle={data.isPrivate ? 'Invite to event' : 'Share event'}
            placeholder="Search people"
            submitLabel={data.isPrivate ? 'Invite' : 'Share'}
            submitShare={handleEventShare}
            searchContacts={searchShareContacts}
            createPost={data.isPrivate ? null : handleCreatePostFromEvent}
            createPostLabel="Create post"
          />
        {/if}
      </div>
    </li>
  </ul>
</section>

<style>
  .header-row,
  .chips,
  .header-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .header-row {
    justify-content: space-between;
    align-items: flex-start;
  }

  .chips {
    min-width: 0;
    flex: 1 1 auto;
    align-items: center;
  }

  .meta-note {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }

  .header-actions {
    flex: 0 1 auto;
    margin-left: auto;
    justify-content: flex-end;
  }

  .header-actions :global(.tag-list) {
    justify-content: flex-end;
  }

  :global(.report-control) {
    flex: 0 0 auto;
  }

  h1 {
    margin-top: 10px;
    font-size: 24px;
    letter-spacing: -0.02em;
    color: var(--text-main);
    overflow-wrap: anywhere;
  }

  strong {
    font-size: 14px;
    color: var(--text-main);
  }

  .overview-copy {
    margin: 8px 0 24px;
    max-width: 78ch;
    color: var(--text-soft);
    line-height: 1.55;
    overflow-wrap: anywhere;
  }

  .signal-intro {
    margin: 0 0 8px;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.45;
  }

  .signal-summary {
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.45;
  }

  .demand-button {
    justify-self: start;
    min-width: 84px;
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    font-size: 13px;
    font-weight: 700;
  }

  .demand-button.active-demand {
    border-color: var(--brand);
    color: var(--brand-strong);
  }

  .meta-block {
    padding: 18px 0 20px;
    border-top: 1px solid var(--panel-border);
    border-bottom: 1px solid var(--panel-border);
  }

  .event-meta-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 14px;
  }

  .meta-item {
    display: grid;
    gap: 6px;
    color: var(--text-soft);
    font-size: 13px;
  }

  .meta-item span {
    color: var(--text-soft);
    line-height: 1.45;
  }

  .signal-stack {
    display: grid;
    gap: 8px;
  }

  #participation-join,
  #participation-signals {
    scroll-margin-top: 120px;
  }

  .meta-button-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .demand-button:hover {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  @media (max-width: 760px) {
    .header-row {
      align-items: start;
    }
  }
</style>