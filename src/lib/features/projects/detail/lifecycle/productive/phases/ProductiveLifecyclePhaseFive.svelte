<script lang="ts">
  import { tick } from 'svelte';
  import CollapsibleActivityCard from '$lib/components/cards/project-detail/CollapsibleActivityCard.svelte';
  import ProjectActivityCalendarCard from '$lib/components/cards/project-detail/ProjectActivityCalendarCard.svelte';
  import ProjectActivityRolesEditor from '$lib/components/forms/project-detail/ProjectActivityRolesEditor.svelte';
  import ProjectActivityHistorySection from '$lib/features/projects/detail/components/ProjectActivityHistorySection.svelte';
  import ProjectSoftwareGovernancePanel from '$lib/features/projects/detail/components/ProjectSoftwareGovernancePanel.svelte';
  import ProjectActivityViewTabs from '$lib/features/projects/detail/components/ProjectActivityViewTabs.svelte';
  import type {
    ProjectActivityRoleInput,
    ProjectPageData,
    ProjectServiceHistoryCompletionChoice,
    ProjectServiceHistoryCompletionRole,
    ProjectSoftwareMergeCapabilityChangeInput,
    ProjectSoftwarePullRequestInput
    ,ProjectSoftwareRepositoryReplacementInput
  } from '$lib/types/detail';

  type ActivityForm = {
    title: string;
    scheduledAt: string;
    endsAt: string;
    locationLabel: string;
    roleRequirements: ProjectActivityRoleInput[];
    linkedPlanPhaseId: string | null;
    note: string;
  };

  type ProductiveActivityTab = 'live' | 'history';

  export let data: ProjectPageData;
  export let activityForm: ActivityForm;
  export let showComposer = false;
  export let highlightedActivityId: string | null = null;
  export let activityComposerElement: HTMLElement | null = null;
  export let activityStartInputElement: HTMLInputElement | null = null;
  export let activityEndInputElement: HTMLInputElement | null = null;
  export let openComposer: () => void | Promise<void> = () => {};
  export let openComposerForDay: (isoDay: string) => void | Promise<void> = () => {};
  export let focusActivityCard: (activityId: string) => void | Promise<void> = () => {};
  export let submitActivity: () => void | Promise<void> = () => {};
  export let changecommitment: (activityId: string, roleLabel: string | null) => void | Promise<void> = () => {};
  export let createPullRequest: (input: ProjectSoftwarePullRequestInput) => void | Promise<void> = () => {};
  export let requestMergeCapabilityChange: (
    input: ProjectSoftwareMergeCapabilityChangeInput
  ) => void | Promise<void> = () => {};
  export let requestRepositoryReplacement: (
    input: ProjectSoftwareRepositoryReplacementInput
  ) => void | Promise<void> = () => {};
  export let recordPullRequestMerge: (requestId: string, mergeId: string) => void | Promise<void> = () => {};
  export let votePullRequest: (
    requestId: string,
    vote: import('$lib/types/detail').ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  export let voteMergeCapabilityChange: (
    requestId: string,
    vote: import('$lib/types/detail').ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  export let voteRepositoryReplacement: (
    requestId: string,
    vote: import('$lib/types/detail').ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  export let toggleHistoryCompletion: (
    historyId: string,
    role: ProjectServiceHistoryCompletionRole,
    selection?: ProjectServiceHistoryCompletionChoice
  ) => void | Promise<void> = () => {};

  let activeTab: ProductiveActivityTab = 'live';
  let highlightedHistoryId: string | null = null;
  let historyHighlightResetHandle: ReturnType<typeof setTimeout> | null = null;

  function minimumParticipantsForRoles(roleRequirements: ProjectActivityRoleInput[]) {
    return roleRequirements.reduce(
      (total, role) => total + Math.max(1, Number(role.requiredCount) || 1),
      0
    );
  }

  function historyItemByActivityId(activityId: string) {
    return data.lifecycle.phaseFive.history.find((item) => item.activity.id === activityId) ?? null;
  }

  function scrollHistoryCardIntoView(historyId: string) {
    if (typeof document === 'undefined') {
      return;
    }

    document.getElementById(`history-card-${historyId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  async function focusHistoryCard(historyId: string) {
    if (historyHighlightResetHandle) {
      clearTimeout(historyHighlightResetHandle);
    }

    highlightedHistoryId = historyId;
    await tick();
    scrollHistoryCardIntoView(historyId);

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollHistoryCardIntoView(historyId);
        });
      });
    }

    historyHighlightResetHandle = setTimeout(() => {
      if (highlightedHistoryId === historyId) {
        highlightedHistoryId = null;
      }

      historyHighlightResetHandle = null;
    }, 1800);
  }

  async function openLiveComposer() {
    activeTab = 'live';
    await openComposer();
  }

  async function openLiveComposerForDay(isoDay: string) {
    activeTab = 'live';
    await openComposerForDay(isoDay);
  }

  async function toggleActivityComposer() {
    if (showComposer) {
      showComposer = false;
      return;
    }

    await openLiveComposer();
  }

  function closeComposer() {
    showComposer = false;
  }

  async function handleActivitySelection(activityId: string) {
    const historyItem = historyItemByActivityId(activityId);

    if (historyItem) {
      activeTab = 'history';
      await focusHistoryCard(historyItem.id);
      return;
    }

    activeTab = 'live';
    await focusActivityCard(activityId);
  }

  $: minimumParticipants = minimumParticipantsForRoles(activityForm.roleRequirements);
  $: calendarActivities = [
    ...data.lifecycle.phaseFive.activities,
    ...data.lifecycle.phaseFive.history
      .filter((item) => item.historyState !== 'request-only')
      .map((item) => item.activity)
  ];
  $: if (highlightedActivityId) {
    activeTab = 'live';
  }
</script>

<section class="phase-surface">
  {#if data.lifecycle.currentSubtype === 'software'}
    {#if data.lifecycle.phaseFive.softwareGovernance}
      <ProjectSoftwareGovernancePanel
        governance={data.lifecycle.phaseFive.softwareGovernance}
        createPullRequest={createPullRequest}
        requestMergeCapabilityChange={requestMergeCapabilityChange}
        requestRepositoryReplacement={requestRepositoryReplacement}
        recordMerge={recordPullRequestMerge}
        {votePullRequest}
        {voteMergeCapabilityChange}
        {voteRepositoryReplacement}
      />
    {:else}
      <div class="software-governance-placeholder">
        <h3>Software governance</h3>
        <p>Pull request tools appear here once a leading software plan is approved for this project.</p>
      </div>
    {/if}
  {/if}

  <ProjectActivityCalendarCard
    activities={calendarActivities}
    canCreate={data.lifecycle.phaseFive.viewerCanCreateActivities}
    createActive={showComposer}
    selectedDayIso={activityForm.scheduledAt}
    daySelect={openLiveComposerForDay}
    createAction={toggleActivityComposer}
    activitySelect={handleActivitySelection}
  />

  <ProjectActivityViewTabs bind:activeTab ariaLabel="Productive activity view" />

  {#if activeTab === 'live'}
    <section class="card-rail-section">
      <div class="section-head">
        <div class="section-copy">
          <h3>Activity setup</h3>
          <p>Schedule productive work blocks and track which ones have enough committed roles to activate.</p>
        </div>

        {#if data.lifecycle.phaseFive.viewerCanCreateActivities}
          <div class="section-actions">
            <button class="secondary-button" type="button" on:click={toggleActivityComposer}>
              {showComposer ? 'Hide composer' : 'New activity'}
            </button>
          </div>
        {/if}
      </div>

      {#if data.lifecycle.phaseFive.viewerCanCreateActivities && showComposer}
        <div bind:this={activityComposerElement} class="composer-card">
          <input bind:value={activityForm.title} maxlength="120" placeholder="Activity title" />
          <div class="number-grid">
            <label>
              <span class="field-inline-label">Start time</span>
              <input bind:this={activityStartInputElement} bind:value={activityForm.scheduledAt} type="datetime-local" />
            </label>
            <label>
              <span class="field-inline-label">Finish time</span>
              <input bind:this={activityEndInputElement} bind:value={activityForm.endsAt} type="datetime-local" />
            </label>
          </div>
          <input bind:value={activityForm.locationLabel} maxlength="120" placeholder="Place" />
          <select bind:value={activityForm.linkedPlanPhaseId}>
            <option value="" disabled>Choose stage</option>
            {#each data.lifecycle.phaseFive.selectablePlanPhases as stage}
              <option value={stage.id}>{stage.label}</option>
            {/each}
          </select>

          <ProjectActivityRolesEditor bind:roles={activityForm.roleRequirements} />

          <div class="count-field">
            <span class="count-field-label">
              <span class="field-inline-label">Minimum people:</span>
              <span class="count-note">Calculated from the role minimums above. Leave a role max blank if it has no cap.</span>
            </span>
            <div class="count-readout">
              <strong>{minimumParticipants}</strong>
            </div>
          </div>

          <textarea bind:value={activityForm.note} rows="3" placeholder="What should happen in this activity?"></textarea>
          <div class="composer-actions">
            <button class="secondary-button" type="button" on:click={closeComposer}>Cancel</button>
            <button class="primary-button" type="button" on:click={submitActivity}>Create activity</button>
          </div>
        </div>
      {/if}

      {#if data.lifecycle.phaseFive.activities.length === 0}
        <div class="empty-card">No activities scheduled yet.</div>
      {:else}
        <div class="card-rail">
          {#each data.lifecycle.phaseFive.activities as activity (activity.id)}
            <div id={`activity-card-${activity.id}`} class="rail-card">
              <CollapsibleActivityCard
                activity={activity}
                expanded={highlightedActivityId === activity.id}
                highlighted={highlightedActivityId === activity.id}
                changecommitment={changecommitment}
              />
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {:else}
    <div class="history-stack">
      <ProjectActivityHistorySection
        title="History"
        description="Past productive activity and completion check-in."
        items={data.lifecycle.phaseFive.history}
        emptyMessage="No activity has moved into history yet."
        {highlightedHistoryId}
        {toggleHistoryCompletion}
      />
    </div>
  {/if}
</section>

<style>
  .phase-surface,
  .card-rail-section,
  .history-stack,
  .composer-card,
  .number-grid,
  .card-rail {
    display: grid;
    gap: 12px;
  }

  .section-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: end;
  }

  .section-actions,
  .composer-actions,
  .count-field-label {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .count-field {
    display: grid;
    gap: 6px;
  }

  .section-copy h3,
  .section-copy p {
    margin: 0;
  }

  .card-rail {
    grid-template-columns: minmax(0, 1fr);
    max-height: min(34rem, 72vh);
    overflow-y: auto;
    align-items: start;
    padding-right: 2px;
  }

  .rail-card {
    min-width: 0;
  }

  .composer-card,
  .empty-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .empty-card,
  .section-copy p,
  .count-note {
    color: var(--text-soft);
  }

  h3,
  strong,
  .field-inline-label {
    color: var(--text-main);
  }

  .primary-button,
  .secondary-button {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
  }

  .primary-button {
    background: var(--brand);
    color: var(--page-bg);
  }

  .secondary-button {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    color: var(--text-soft);
  }

  .number-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .count-readout {
    width: 100%;
    min-height: 48px;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
    box-sizing: border-box;
    display: flex;
    align-items: center;
  }

  .count-readout strong {
    font-size: 18px;
    line-height: 1;
  }

  input,
  textarea,
  select {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
  }

  [id^='activity-card-'] {
    scroll-margin-top: 92px;
  }

  textarea {
    min-height: 110px;
    resize: vertical;
  }

  .field-inline-label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 700;
  }

  .software-governance-placeholder {
    display: grid;
    gap: 8px;
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .software-governance-placeholder h3,
  .software-governance-placeholder p {
    margin: 0;
  }

  .software-governance-placeholder p {
    color: var(--text-soft);
    line-height: 1.45;
  }

  @media (max-width: 760px) {
    .section-head,
    .number-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>