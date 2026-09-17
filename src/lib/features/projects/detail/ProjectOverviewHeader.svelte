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
  import { isPersonalServiceProject, supportsProjectDemandSignals } from '$lib/features/projects/projectMode';
  import {
    addProjectUpdate,
    requestProjectEdit,
    requestProjectUpdate,
    shareProjectWithUser,
    toggleProjectMembership,
    updateProjectDetails
  } from '$lib/services/commands/projects';
  import type { ProjectPageData } from '$lib/types/detail';
  import type { SignalToggleResult } from '$lib/types/feed';
  import { isImplementedScheduleLabel } from '$lib/utils/scheduleMeta';
  import { requireViewer } from '$lib/utils/requireViewer';
  import { buildSharePrefill, buildShareUrl } from '$lib/utils/sharePrefill';
  import { invalidateProjectDetail } from '$lib/utils/detailInvalidation';
  import { getMessageContacts } from '$lib/services/queries/inbox';
  import type { DetailMember } from '$lib/types/detail';

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
    data: ProjectPageData;
    selectedPhaseId?: ProjectPageData['lifecycle']['currentPhaseId'];
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
  const liveFact = $derived(
    implementedLocation ||
      data.lifecycle.personalService?.travelRadiusLabel ||
      (data.lifecycle.currentSubtypeLabel ? data.lifecycle.currentSubtypeLabel : '')
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
  const showMembershipButton = $derived(!isPersonalServiceProject(data.projectMode));
  const showGovernanceVotes = $derived(!isPersonalServiceProject(data.projectMode));
  const canProposeEdit = $derived(
    data.viewerCanRequestEdit && (!showGovernanceVotes || data.editRequests.length === 0)
  );
  const canProposeUpdate = $derived(
    data.viewerCanRequestUpdate && (!showGovernanceVotes || data.updateRequests.length === 0)
  );
  const updateActionLabel = $derived(isPersonalServiceProject(data.projectMode) ? 'Post update' : 'Propose update');
  const editActionLabel = $derived(isPersonalServiceProject(data.projectMode) ? 'Save details' : 'Propose Edit');
  const latestUpdate = $derived(data.updates[0] ?? null);
  const usesPlatformVoteContext = $derived(
    Boolean(data.lifecycle.usesPlatformLifecycle) ||
      Boolean(signalSummary?.usesPlatformVoteContext)
  );
  const liveCurrentPhase = $derived(
    data.lifecycle.phases.find((phase) => phase.id === data.lifecycle.currentPhaseId) ?? null
  );
  const selectedPhase = $derived(
    data.lifecycle.phases.find((phase) => phase.id === (selectedPhaseId ?? data.lifecycle.currentPhaseId)) ??
      liveCurrentPhase
  );

  let draftEditTitle = $state('');
  let draftEditDescription = $state('');
  let showEditComposer = $state(false);
  let editPending = $state(false);
  let editMessage = $state('');
  let showUpdateComposer = $state(false);
  let draftUpdateBody = $state('');
  let updatePending = $state(false);
  let updateMessage = $state('');

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
      void invalidateProjectDetail(data.slug);
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
      void invalidateProjectDetail(data.slug);
    }

    return result;
  }

  async function searchShareContacts(query: string): Promise<DetailMember[]> {
    try {
      const results = await getMessageContacts(query, 8);
      return results.map((contact) => ({
        id: contact.id,
        username: contact.username,
        bio: contact.bio ?? '',
        profileImageUrl: contact.profileImageUrl ?? null
      }));
    } catch {
      return [];
    }
  }

  async function handleCreatePostFromProject() {
    const params = new URLSearchParams({
      prefill: buildSharePrefill(data.title, `/projects/${data.slug}`)
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
      if (isPersonalServiceProject(data.projectMode)) {
        await addProjectUpdate(data.slug, 'Update', draftUpdateBody);
      } else {
        await requestProjectUpdate(data.slug, draftUpdateBody);
      }

      draftUpdateBody = '';
      showUpdateComposer = false;
      void invalidateProjectDetail(data.slug);
    } catch {
      updateMessage = isPersonalServiceProject(data.projectMode)
        ? 'This update could not be posted. Reload and try again.'
        : 'This update request could not be submitted. Reload and try again.';
    } finally {
      updatePending = false;
    }
  }

  async function submitEdit() {
    const description = draftEditDescription.trim();

    if (!draftEditTitle.trim() || !description) {
      editMessage = 'Add both a title and description before submitting.';
      return;
    }

    editPending = true;
    editMessage = '';

    try {
      if (isPersonalServiceProject(data.projectMode)) {
        await updateProjectDetails(data.slug, draftEditTitle, description);
      } else {
        await requestProjectEdit(data.slug, draftEditTitle, description);
      }

      showEditComposer = false;
      void invalidateProjectDetail(data.slug);
    } catch {
      editMessage = isPersonalServiceProject(data.projectMode)
        ? 'These project details could not be saved. Reload and try again.'
        : 'This edit request could not be submitted. Reload and try again.';
    } finally {
      editPending = false;
    }
  }
</script>

<div class="type-row overview-type-row">
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

  {#if liveFact}
    <p class="live-fact">{liveFact}</p>
  {/if}

  <p class="overview-copy">{data.description}</p>

  {#if latestUpdate}
    <p class="overview-update">Update: {latestUpdate.body}</p>
  {/if}

  {#if canSignal}
    <div id="participation-signals" class="signal-row">
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
    </div>
  {/if}
</div>

<div class="control-row overview-actions">
    <div class="control-actions">
      {#if showMembershipButton || data.viewerCanToggleMembership}
        <MembershipSplitButton
          joined={data.viewerIsMember}
          count={data.memberCount}
          canToggle={data.viewerCanToggleMembership}
          canOpenMembers={showMembershipButton}
          membersOpen={showMembersPanel}
          joinAriaLabel={data.viewerIsMember ? 'Leave project' : 'Join project'}
          membersAriaLabel={`${data.memberCount} members`}
          onToggleJoin={handleMembershipToggle}
          onOpenMembers={() => onToggleMembers?.()}
        />
      {/if}

      {#if data.viewerCanShare}
        <ShareUserMenu
          buttonLabel="Share +"
          contacts={data.shareContacts}
          menuTitle="Share project"
          placeholder="Type a username"
          submitLabel="Share"
          submitShare={handleProjectShare}
          searchContacts={searchShareContacts}
          createPost={handleCreatePostFromProject}
          createPostLabel="Create post"
          copyLinkUrl={buildShareUrl(`/projects/${data.slug}`)}
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
      <ContentMetaRow
        authorUsername={data.authorUsername}
        authorHref={`/profile/${data.authorUsername}?from=${encodeURIComponent($page.url.pathname)}`}
        createdAt={data.createdAt}
      />
    </span>
</div>

<ProposeEditSheet
  bind:open={showEditComposer}
  bind:title={draftEditTitle}
  bind:description={draftEditDescription}
  message={editMessage}
  pending={editPending}
  sheetTitle={editActionLabel}
  submitLabel={editActionLabel}
  titlePlaceholder="Project title"
  descriptionPlaceholder="Describe the project..."
  labelledById="project-propose-edit-sheet"
  onSubmit={submitEdit}
/>

<AddUpdateSheet
  bind:open={showUpdateComposer}
  bind:body={draftUpdateBody}
  message={updateMessage}
  pending={updatePending}
  sheetTitle="Add update"
  submitLabel={updateActionLabel}
  placeholder="Share what changed on this project..."
  labelledById="project-add-update-sheet"
  onSubmit={submitUpdate}
/>

<OverlaySheet bind:open={detailsOpen} title="Details" labelledById="overview-details-sheet">
  <div class="details-sheet">
    <ul class="project-meta-list">
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

      {#if data.lifecycle.currentSubtypeLabel}
        <li class="meta-item">
          <strong>Subtype</strong>
          <span>{data.lifecycle.currentSubtypeLabel}</span>
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
            <span class="phase-current-note">The project is currently in {liveCurrentPhase.title}.</span>
          {/if}
        </li>
      {/if}

      {#if canSignal}
        <li class="meta-item">
          <strong>Signals</strong>
          <p class="signal-intro">
            {#if !data.viewerIsMember}
              Signal whether this should be facilitated on the platform — you don't need to join to participate in this step.
            {:else}
              Signal platform interest in this project — support or oppose without starting a lifecycle vote.
            {/if}
          </p>
          {#if signalSummary}
            <span class="signal-summary">
              Support is {displaySignalRatioPercent}% of current proposal signals.
              {#if signalSummary.usesPlatformVoteContext}
                Proposal advancement also needs {signalSummary.requiredDemandCount} support signals from {signalSummary.voteContextPopulation} weekly active users.
              {:else}
                Proposal advancement opens once support stays above 66% of active signals.
              {/if}
            </span>
          {/if}
        </li>
      {/if}

      {#if data.lifecycle.supportsPlanning}
        <li class="meta-item">
          <strong>Quorum</strong>
          <QuorumExplanation
            votesRequired={data.lifecycle.quorumVotesRequired}
            audienceSize={data.lifecycle.voteContextPopulation}
            audienceLabel={data.lifecycle.voteContextLabel}
            usesPlatform={usesPlatformVoteContext}
            entityLabel="project"
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
  }

  .header-tags {
    margin-left: auto;
    min-width: 0;
    display: flex;
    justify-content: flex-end;
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
    overflow-wrap: anywhere;
  }

  .live-fact {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.45;
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

  :global(#participation-join),
  #participation-signals {
    scroll-margin-top: 120px;
  }

  @media (max-width: 760px) {
    .header-row {
      align-items: start;
    }
  }
</style>
