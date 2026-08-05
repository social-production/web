<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import ShareUserMenu from '$lib/components/shared/ShareUserMenu.svelte';
  import ReportControl from '$lib/components/shared/ReportControl.svelte';
  import ModerationRestrictionNotice from '$lib/components/shared/ModerationRestrictionNotice.svelte';
  import SignalEngagementButtons from '$lib/components/shared/SignalEngagementButtons.svelte';
  import SurfaceTypeLabel from '$lib/components/cards/shared/SurfaceTypeLabel.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import { supportsProjectDemandSignals } from '$lib/features/projects/projectMode';
  import { shareProjectWithUser, toggleProjectMembership } from '$lib/services/commands/projects';
  import type { ProjectPageData } from '$lib/types/detail';
  import type { SignalToggleResult } from '$lib/types/feed';
  import { isImplementedScheduleLabel } from '$lib/utils/scheduleMeta';
  import { requireViewer } from '$lib/utils/requireViewer';
  import { buildSharePrefill } from '$lib/utils/sharePrefill';

  let {
    data,
    signalChange = undefined,
    onMembershipChange = undefined
  }: {
    data: ProjectPageData;
    signalChange?: (result: SignalToggleResult) => void;
    onMembershipChange?: (next: { viewerIsMember: boolean; memberCount: number }) => void;
  } = $props();

  const combinedTags = $derived([...data.channelTags, ...data.communityTags]);
  const signalSummary = $derived(data.lifecycle.phaseOne?.signalSummary ?? null);
  const canSignal = $derived(
    supportsProjectDemandSignals(data.projectMode) &&
      (data.lifecycle.phaseOne.viewerCanSignalDemand || data.lifecycle.phaseOne.viewerCanSignalOpposition)
  );
  const implementedLocation = $derived(
    isImplementedScheduleLabel(data.locationLabel) ? data.locationLabel.trim() : ''
  );
  const showProposalLocationCopy = $derived(
    supportsProjectDemandSignals(data.projectMode) &&
      data.lifecycle.currentPhaseId === 'phase-1' &&
      !implementedLocation
  );
  const membershipMetaLabel = 'Members';
  const membershipButtonLabel = $derived(`${data.viewerIsMember ? 'Joined' : 'Join'} · ${data.memberCount}`);
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
      await toggleProjectMembership(data.slug);
      await invalidateAll();
    } catch {
      onMembershipChange?.({
        viewerIsMember: wasMember,
        memberCount: previousCount
      });
    }
  }

  async function handleProjectShare(username: string) {
    const result = await shareProjectWithUser(data.slug, username);

    if (result.ok) {
      await invalidateAll();
    }

    return result;
  }

  async function handleCreatePostFromProject() {
    const params = new URLSearchParams({
      prefill: buildSharePrefill(data.title, `/projects/${data.slug}`)
    });
    await goto(`/create/post?${params.toString()}`);
  }
</script>

<div class="header-row">
  <div class="chips">
    <SurfaceTypeLabel kind="project" projectMode={data.projectMode} />
    <ReportControl
      hasActiveReport={Boolean(data.report)}
      isUnderReview={data.moderationState === 'under_review' || data.report?.resolution === 'under_review' || data.report?.resolution === 'open'}
      itemLabel="project"
      moderationState={data.moderationState}
      report={data.report}
      ownerUsername={data.authorUsername}
      subjectId={data.id}
      targetId={data.id}
      targetType="project"
    />
  </div>

  <div class="header-actions">
    <TagList tags={combinedTags} />
  </div>
</div>

<ModerationRestrictionNotice active={data.moderationState === 'hidden' || data.report?.resolution === 'hidden'}>
  <h1>{data.title}</h1>
  <p class="overview-copy">{data.description}</p>
</ModerationRestrictionNotice>

<section class="meta-block" aria-label="Project overview details">
  <ul class="project-meta-list">
    {#if canSignal}
      <li class="meta-item demand-item">
        <strong>Signals</strong>
        <div id="participation-signals" class="signal-stack">
          <p class="signal-intro">
            {#if !data.viewerIsMember}
              Signal whether this should be facilitated on the platform — you don't need to join to participate in this step.
            {:else}
              Signal platform interest in this project — support or oppose without starting a lifecycle vote.
            {/if}
          </p>
          <SignalEngagementButtons
            entityKind="project"
            slug={data.slug}
            syncKey={data.id}
            supportCount={signalSummary?.demandCount ?? data.signalCount ?? 0}
            opposeCount={signalSummary?.oppositionCount ?? 0}
            viewerSignal={initialViewerSignal}
            canSignalDemand={data.lifecycle.phaseOne.viewerCanSignalDemand}
            canSignalOpposition={data.lifecycle.phaseOne.viewerCanSignalOpposition}
            {signalChange}
          />
          {#if signalSummary}
            <span class="signal-summary">
              Demand is {displaySignalRatioPercent}% of current proposal signals.
              {#if signalSummary.usesPlatformVoteContext}
                Proposal advancement also needs {signalSummary.requiredDemandCount} demand signals from {signalSummary.voteContextPopulation} weekly active users.
              {:else}
                Proposal advancement opens once demand stays above 66% of active signals.
              {/if}
            </span>
          {/if}
        </div>
      </li>
    {/if}

    {#if data.lifecycle.supportsPlanning}
      <li class="meta-item">
        <strong>Quorum</strong>
        <span>{quorumLabel}</span>
      </li>
    {/if}

    {#if data.lifecycle.currentSubtypeLabel}
      <li class="meta-item">
        <strong>Subtype</strong>
        <span>{data.lifecycle.currentSubtypeLabel}</span>
      </li>
    {/if}

    {#if implementedLocation}
      <li class="meta-item">
        <strong>Location</strong>
        <span>{implementedLocation}</span>
      </li>
    {:else if showProposalLocationCopy}
      <li class="meta-item">
        <strong>Proposal</strong>
        <span>This project stays proposal-first until an approved plan sets the live location.</span>
      </li>
    {/if}

    {#if data.lifecycle.personalService?.travelRadiusLabel}
      <li class="meta-item">
        <strong>Travel Radius</strong>
        <span>{data.lifecycle.personalService.travelRadiusLabel}</span>
      </li>
    {/if}

    <li class="meta-item">
      <strong>{membershipMetaLabel}</strong>
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
            buttonLabel="Share +"
            contacts={data.shareContacts}
            menuTitle="Share project"
            placeholder="Type a username"
            submitLabel="Share"
            submitShare={handleProjectShare}
            createPost={handleCreatePostFromProject}
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

  .meta-block {
    padding: 18px 0 20px;
    border-top: 1px solid var(--panel-border);
    border-bottom: 1px solid var(--panel-border);
  }

  .project-meta-list {
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
    transition: border-color 0.16s ease, background-color 0.16s ease, color 0.16s ease;
  }

  .demand-button:hover {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .demand-button.active-demand {
    border-color: var(--brand);
    color: var(--brand-strong);
  }

  @media (max-width: 760px) {
    .header-row {
      align-items: start;
    }
  }
</style>
