<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import ShareUserMenu from '$lib/components/shared/ShareUserMenu.svelte';
  import ReportControl from '$lib/components/shared/ReportControl.svelte';
  import ModerationRestrictionNotice from '$lib/components/shared/ModerationRestrictionNotice.svelte';
  import SignalEngagementButtons from '$lib/components/shared/SignalEngagementButtons.svelte';
  import SurfaceTypeLabel from '$lib/components/cards/shared/SurfaceTypeLabel.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import MembershipSplitButton from '$lib/components/shared/MembershipSplitButton.svelte';
  import ProposeEditSheet from '$lib/components/shared/ProposeEditSheet.svelte';
  import AddUpdateSheet from '$lib/components/shared/AddUpdateSheet.svelte';
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import ContentMetaRow from '$lib/components/shared/ContentMetaRow.svelte';
  import DetailFoldToggles from '$lib/features/detail/DetailFoldToggles.svelte';
  import QuorumExplanation from '$lib/features/detail/QuorumExplanation.svelte';
  import {
    requestEventEdit,
    requestEventUpdate,
    shareEventWithUser,
    toggleEventMembership
  } from '$lib/services/commands/events';
  import { getMessageContacts } from '$lib/services/queries/inbox';
  import type { DetailMember, EventPageData } from '$lib/types/detail';
  import type { SignalToggleResult } from '$lib/types/feed';
  import { isImplementedScheduleLabel } from '$lib/utils/scheduleMeta';
  import { formatLocalDateTime } from '$lib/utils/time';
  import { requireViewer } from '$lib/utils/requireViewer';
  import { buildSharePrefill, buildShareUrl } from '$lib/utils/sharePrefill';
  import { invalidateEventDetail } from '$lib/utils/detailInvalidation';

  let {
    data,
    selectedPhaseId = undefined,
    signalChange = undefined,
    onMembershipChange = undefined,
    detailsOpen = $bindable(false),
    participationOpen = $bindable(false),
    votesOpen = $bindable(true),
    showVoteFold = false,
    voteCount = 0,
    showMembersPanel = false,
    onToggleMembers = undefined,
    votesRenderedInHub: _votesRenderedInHub = false
  }: {
    data: EventPageData;
    selectedPhaseId?: EventPageData['lifecycle']['currentPhaseId'];
    signalChange?: (result: SignalToggleResult) => void;
    onMembershipChange?: (next: { viewerIsMember: boolean; memberCount: number }) => void;
    detailsOpen?: boolean;
    participationOpen?: boolean;
    votesOpen?: boolean;
    showVoteFold?: boolean;
    voteCount?: number;
    showMembersPanel?: boolean;
    onToggleMembers?: () => void;
    votesRenderedInHub?: boolean;
  } = $props();

  let liveShareContacts = $state<DetailMember[]>([]);
  let draftEditTitle = $state('');
  let draftEditDescription = $state('');
  let showEditComposer = $state(false);
  let editPending = $state(false);
  let editMessage = $state('');
  let showUpdateComposer = $state(false);
  let draftUpdateBody = $state('');
  let updatePending = $state(false);
  let updateMessage = $state('');

  async function searchShareContacts(query: string): Promise<DetailMember[]> {
    try {
      const results = await getMessageContacts(query, 8);
      liveShareContacts = results.map((contact) => ({
        id: contact.id,
        username: contact.username,
        bio: contact.bio ?? '',
        profileImageUrl: contact.profileImageUrl ?? null
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
  const canProposeEdit = $derived(data.viewerCanRequestEdit && data.editRequests.length === 0);
  const canProposeUpdate = $derived(data.viewerCanRequestUpdate && data.updateRequests.length === 0);
  const latestUpdate = $derived(data.updates[0] ?? null);
  const usesPlatformVoteContext = $derived(
    Boolean(signalSummary?.usesPlatformVoteContext) ||
      data.lifecycle.voteContextLabel.toLowerCase().includes('platform')
  );
  const memberButtonLabel = $derived(data.isPrivate ? 'Members / Editors' : 'Members');
  const liveCurrentPhase = $derived(
    data.lifecycle.phases.find((phase) => phase.id === data.lifecycle.currentPhaseId) ?? null
  );
  const selectedPhase = $derived(
    data.lifecycle.phases.find((phase) => phase.id === (selectedPhaseId ?? data.lifecycle.currentPhaseId)) ??
      liveCurrentPhase
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
      void invalidateEventDetail(data.slug);
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
      void invalidateEventDetail(data.slug);
    }

    return result;
  }

  async function handleCreatePostFromEvent() {
    const params = new URLSearchParams({
      prefill: buildSharePrefill(data.title, `/events/${data.slug}`)
    });
    await goto(`/create/post?${params.toString()}`);
  }

  function toggleEditComposer() {
    showEditComposer = !showEditComposer;

    if (showEditComposer) {
      editMessage = '';
      draftEditTitle = data.title;
      draftEditDescription = data.description;
      showUpdateComposer = false;
    }
  }

  function toggleUpdateComposer() {
    showUpdateComposer = !showUpdateComposer;
    if (showUpdateComposer) {
      updateMessage = '';
      showEditComposer = false;
    }
  }

  async function submitUpdate() {
    if (!draftUpdateBody.trim()) {
      updateMessage = 'Write an update before submitting.';
      return;
    }

    updatePending = true;
    updateMessage = '';

    try {
      await requestEventUpdate(data.slug, draftUpdateBody);
      draftUpdateBody = '';
      showUpdateComposer = false;
      void invalidateEventDetail(data.slug);
    } catch {
      updateMessage = 'This update request could not be submitted. Reload and try again.';
    } finally {
      updatePending = false;
    }
  }

  async function submitEdit() {
    if (!draftEditTitle.trim() || !draftEditDescription.trim()) {
      editMessage = 'Add both a title and description before submitting.';
      return;
    }

    editPending = true;
    editMessage = '';

    try {
      await requestEventEdit(data.slug, draftEditTitle, draftEditDescription);
      showEditComposer = false;
      void invalidateEventDetail(data.slug);
    } catch {
      editMessage = 'This edit request could not be submitted. Reload and try again.';
    } finally {
      editPending = false;
    }
  }
</script>

<div class="type-row overview-type-row">
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
    <div class="header-tags">
      <TagList tags={combinedTags} maxVisible={2} />
    </div>
  </div>
</div>

<div class="heading overview-heading">
  <div class="heading-chrome">
    <DetailFoldToggles
      {detailsOpen}
      {participationOpen}
      {votesOpen}
      showVotes={showVoteFold}
      {voteCount}
      onToggleDetails={() => (detailsOpen = !detailsOpen)}
      onToggleParticipation={() => (participationOpen = !participationOpen)}
      onToggleVotes={() => (votesOpen = !votesOpen)}
    />
  </div>

  <ModerationRestrictionNotice active={data.moderationState === 'hidden' || data.report?.resolution === 'hidden'}>
    <h1>{data.title}</h1>
  </ModerationRestrictionNotice>

  {#if timeLabel || locationLabel}
    <p class="live-fact">{[timeLabel, locationLabel].filter(Boolean).join(' · ')}</p>
  {/if}

  <p class="overview-copy">{data.description}</p>

  {#if latestUpdate}
    <p class="overview-update">Update: {latestUpdate.body}</p>
  {/if}

  {#if canSignal && signalSummary}
    <div id="participation-signals" class="signal-row">
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
    </div>
  {/if}
</div>

<div class="control-row overview-actions">
    <div class="control-actions">
      <MembershipSplitButton
        joined={data.viewerIsMember}
        count={data.memberCount}
        canToggle={data.viewerCanToggleMembership}
        canOpenMembers={true}
        membersOpen={showMembersPanel}
        joinAriaLabel={data.viewerIsMember ? 'Leave event' : 'Join event'}
        membersAriaLabel={memberButtonLabel}
        onToggleJoin={handleMembershipToggle}
        onOpenMembers={() => onToggleMembers?.()}
      />

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
          copyLinkUrl={buildShareUrl(`/events/${data.slug}`)}
        />
      {/if}

      {#if canProposeEdit}
        <button
          type="button"
          class="quiet-control"
          class:open={showEditComposer}
          aria-expanded={showEditComposer}
          onclick={toggleEditComposer}
        >
          Edit
        </button>
      {/if}
      {#if canProposeUpdate}
        <button
          type="button"
          class="quiet-control"
          class:open={showUpdateComposer}
          aria-expanded={showUpdateComposer}
          onclick={toggleUpdateComposer}
        >
          + Update
        </button>
      {/if}
    </div>

    <span class="control-author">
      <ContentMetaRow authorUsername={data.createdByUsername} createdAt={data.createdAt} />
    </span>
</div>

<ProposeEditSheet
  bind:open={showEditComposer}
  bind:title={draftEditTitle}
  bind:description={draftEditDescription}
  message={editMessage}
  pending={editPending}
  sheetTitle="Propose Edit"
  submitLabel="Propose Edit"
  titlePlaceholder="Event title"
  descriptionPlaceholder="Describe the event and what members should know..."
  labelledById="event-propose-edit-sheet"
  onSubmit={submitEdit}
/>

<AddUpdateSheet
  bind:open={showUpdateComposer}
  bind:body={draftUpdateBody}
  message={updateMessage}
  pending={updatePending}
  sheetTitle="Add update"
  submitLabel="Propose update"
  placeholder="Share what changed for this event..."
  labelledById="event-add-update-sheet"
  onSubmit={submitUpdate}
/>

<OverlaySheet bind:open={detailsOpen} title="Details" labelledById="overview-details-sheet">
  <div class="details-sheet">
    <ul class="event-meta-list">
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

      {#if selectedPhase}
        <li class="meta-item">
          <strong>{selectedPhase.title}</strong>
          {#if selectedPhase.summary}
            <p class="phase-summary">{selectedPhase.summary}</p>
          {/if}
          {#if selectedPhase.mechanics.length > 0}
            <ul class="phase-mechanics">
              {#each selectedPhase.mechanics as mechanic}
                <li>{mechanic}</li>
              {/each}
            </ul>
          {/if}
          {#if selectedPhase.note}
            <span>{selectedPhase.note}</span>
          {/if}
          {#if liveCurrentPhase && selectedPhase.id !== liveCurrentPhase.id}
            <span class="phase-current-note">The event is currently in {liveCurrentPhase.title}.</span>
          {/if}
        </li>
      {/if}

      {#if canSignal && signalSummary}
        <li class="meta-item">
          <strong>Signals</strong>
          <p class="signal-intro">
            {#if !data.viewerIsMember}
              Signal whether this should be facilitated on the platform — you don't need to join to participate in this step.
            {:else}
              Signal platform interest in this event — support or oppose without starting a lifecycle vote.
            {/if}
          </p>
          <span class="signal-summary">
            Support is {displaySignalRatioPercent}% of current proposal signals.
            {#if signalSummary.usesPlatformVoteContext}
              Proposal advancement also needs {signalSummary.requiredDemandCount} support signals from {signalSummary.voteContextPopulation} weekly active users.
            {:else}
              Proposal advancement opens once support stays above 66% of active signals.
            {/if}
          </span>
        </li>
      {/if}

      {#if showQuorum}
        <li class="meta-item">
          <strong>Quorum</strong>
          <QuorumExplanation
            votesRequired={data.lifecycle.quorumVotesRequired}
            audienceSize={data.lifecycle.voteContextPopulation}
            audienceLabel={data.lifecycle.voteContextLabel}
            usesPlatform={usesPlatformVoteContext}
            entityLabel="event"
          />
        </li>
      {/if}
    </ul>
  </div>
</OverlaySheet>

<style>
  .type-row,
  .heading,
  .header-row,
  .chips,
  .control-row,
  .control-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    min-width: 0;
  }

  .type-row,
  .heading {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .heading {
    padding-bottom: 12px;
  }

  .heading-chrome {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .heading-chrome :global(.overview-folds) {
    margin-left: auto;
    flex: 0 0 auto;
  }

  .header-row {
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .chips {
    min-width: 0;
    flex: 0 1 auto;
    align-items: center;
  }

  .header-tags {
    margin-left: auto;
    min-width: 0;
    display: flex;
    justify-content: flex-end;
  }

  .meta-note {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  :global(.report-control) {
    flex: 0 0 auto;
  }

  h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.15;
    color: var(--text-main);
    overflow-wrap: anywhere;
  }

  .live-fact {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .details-sheet {
    display: grid;
    gap: 12px;
    min-width: 0;
    padding: 8px 16px 12px;
  }

  .control-row {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    margin-top: 4px;
    padding-top: 16px;
    border-top: 1px solid var(--panel-border);
  }

  .control-actions {
    flex: 1 1 auto;
    flex-wrap: wrap;
    gap: 8px;
  }

  .quiet-control {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .quiet-control.open,
  .quiet-control:hover,
  .quiet-control:focus-visible {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .control-author {
    margin-left: auto;
    min-width: 0;
  }

  .control-author :global(.content-meta-row) {
    flex-wrap: wrap;
    white-space: normal;
    justify-content: flex-end;
  }

  .signal-row {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    min-width: 0;
    margin-top: 4px;
    padding: 0;
    overflow: visible;
  }

  strong {
    font-size: 14px;
    color: var(--text-main);
  }

  .overview-copy {
    margin: 0;
    max-width: 78ch;
    color: var(--text-main);
    font-size: 15px;
    font-weight: 500;
    line-height: 1.55;
    overflow-wrap: anywhere;
  }

  .overview-update {
    margin: 0;
    max-width: 78ch;
    color: var(--text-soft);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.5;
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

  .meta-item span,
  .phase-summary,
  .phase-current-note {
    color: var(--text-soft);
    line-height: 1.45;
  }

  .phase-summary {
    margin: 0;
  }

  .phase-mechanics {
    margin: 0;
    padding-left: 18px;
    display: grid;
    gap: 6px;
  }

  #participation-signals {
    scroll-margin-top: 120px;
  }

  @media (max-width: 760px) {
    .header-row {
      align-items: start;
    }
  }
</style>
