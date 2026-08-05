<script lang="ts">
  import ActivityCreationWizard from '$lib/components/shared/ActivityCreationWizard.svelte';
  import CollapsibleActivityCard from '$lib/components/cards/project-detail/CollapsibleActivityCard.svelte';
  import ProjectActivityCalendarCard from '$lib/components/cards/project-detail/ProjectActivityCalendarCard.svelte';
  import DecisionHistoryCard from '$lib/components/shared/DecisionHistoryCard.svelte';
  import ActivityHistorySection from '$lib/features/projects/detail/components/ActivityHistorySection.svelte';
  import type {
    DecisionHistoryEntry,
    ProjectActivityItem,
    ProjectApprovalVote,
    ProjectServiceHistoryCompletionChoice,
    ProjectServiceHistoryCompletionRole,
    ProjectServiceHistoryItem
  } from '$lib/types/detail';
  import type { ActivityCreationForm, ActivityScheduleBounds } from '$lib/utils/activityCreationSteps';

  type CalendarInteractionAnchor = {
    clientX: number;
    clientY: number;
  };

  type UnifiedHistoryEntry =
    | { kind: 'activity'; at: string; item: ProjectServiceHistoryItem }
    | { kind: 'governance'; at: string; item: DecisionHistoryEntry };

  export let calendarActivities: ProjectActivityItem[] = [];
  export let plannedDayIsos: string[] = [];
  export let liveActivities: ProjectActivityItem[] = [];
  export let historyItems: ProjectServiceHistoryItem[] = [];
  export let governanceHistory: DecisionHistoryEntry[] = [];
  export let canCreate = false;
  export let showComposer = false;
  export let createActive = false;
  export let createAriaLabel = 'Add activity';
  export let selectedDayIso = '';
  export let selectedActivityId = '';
  export let highlightedActivityId: string | null = null;
  export let highlightedHistoryId: string | null = null;
  export let historyOpen = false;
  export let liveTitle = 'Activity setup';
  export let liveDescription = 'Schedule work blocks and track which ones have enough committed roles.';
  export let historyDescription = 'Past activity, ratings, and completion check-in.';
  export let emptyLiveMessage = 'No activities scheduled yet.';
  export let emptyHistoryMessage = 'No activity has moved into history yet.';
  export let activityForm: ActivityCreationForm;
  export let selectablePlanPhases: Array<{ id: string; label: string }> = [];
  export let scheduleBounds: ActivityScheduleBounds | null = null;
  export let locationQuickPicks: import('$lib/types/locationPicker').LocationQuickPick[] = [];
  export let submitActivity: () => void | Promise<void> = () => {};
  export let closeComposer: () => void = () => {};
  export let daySelect: (isoDay: string, anchor?: CalendarInteractionAnchor) => void | Promise<void> = () => {};
  export let createAction: (anchor?: CalendarInteractionAnchor) => void | Promise<void> = () => {};
  export let canSubmitPullRequest = false;
  export let openPullRequestWizard: () => void = () => {};
  export let changecommitment: (activityId: string, roleLabel: string | null) => void | Promise<void> = () => {};
  export let toggleHistoryCompletion: (
    historyId: string,
    role: ProjectServiceHistoryCompletionRole,
    selection?: ProjectServiceHistoryCompletionChoice
  ) => void | Promise<void> = () => {};
  export let saveActivityRating: (
    activityId: string,
    rating: number,
    comment: string | null
  ) => void | Promise<void> = () => {};
  export let deleteActivityRating: (activityId: string) => void | Promise<void> = () => {};
  export let onGovernanceVote: (
    entry: DecisionHistoryEntry,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};

  async function handleActivitySelection(activityId: string, anchor?: CalendarInteractionAnchor) {
    const historyItem = historyItems.find((item) => item.activity.id === activityId);

    if (historyItem) {
      historyOpen = true;
      onHistoryActivitySelect?.(historyItem.id);
      return;
    }

    onLiveActivitySelect?.(activityId, anchor);
  }

  export let onLiveActivitySelect: (
    activityId: string,
    anchor?: CalendarInteractionAnchor
  ) => void | Promise<void> = () => {};
  export let onHistoryActivitySelect: (historyId: string) => void | Promise<void> = () => {};

  let showSoftwareActionPicker = false;

  function handleCreateAction(anchor?: CalendarInteractionAnchor) {
    if (canSubmitPullRequest) {
      showSoftwareActionPicker = !showSoftwareActionPicker;
      return;
    }

    createAction(anchor);
  }

  function chooseProposeActivity() {
    showSoftwareActionPicker = false;
    createAction();
  }

  function chooseSubmitPullRequest() {
    showSoftwareActionPicker = false;
    openPullRequestWizard();
  }

  $: if (!canSubmitPullRequest || showComposer) {
    showSoftwareActionPicker = false;
  }

  function activityTimestamp(item: ProjectServiceHistoryItem) {
    return item.activity.endAt || item.activity.scheduledAt || item.activity.startAt || '';
  }

  $: unifiedHistory = (
    [
      ...historyItems.map(
        (item): UnifiedHistoryEntry => ({
          kind: 'activity',
          at: activityTimestamp(item),
          item
        })
      ),
      ...governanceHistory.map(
        (item): UnifiedHistoryEntry => ({
          kind: 'governance',
          at: item.createdAt,
          item
        })
      )
    ] as UnifiedHistoryEntry[]
  ).sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime());

  $: historyCount = unifiedHistory.length;
  $: hasUnifiedHistory = historyCount > 0;
</script>

<section class="scheduling-panel">
  <ProjectActivityCalendarCard
    activities={calendarActivities}
    {plannedDayIsos}
    {canCreate}
    createActive={createActive || showSoftwareActionPicker}
    {createAriaLabel}
    {selectedDayIso}
    selectedActivityId={selectedActivityId || highlightedActivityId || ''}
    {daySelect}
    createAction={handleCreateAction}
    activitySelect={handleActivitySelection}
  />

  {#if showSoftwareActionPicker}
    <div class="software-action-picker" role="group" aria-label="Choose next software action">
      <div class="software-action-copy">
        <h3>What do you want to propose?</h3>
        <p>
          Use an activity for coordinated work sessions. Use a pull request when the change itself needs
          software governance approval.
        </p>
      </div>
      <div class="software-action-grid">
        <button class="action-choice" type="button" on:click={chooseProposeActivity}>
          <strong>Propose activity</strong>
          <span>Schedule a work block people can sign up for.</span>
        </button>
        <button class="action-choice" type="button" on:click={chooseSubmitPullRequest}>
          <strong>Submit pull request</strong>
          <span>Open the existing software governance wizard for PR approval.</span>
        </button>
      </div>
    </div>
  {/if}

  <slot name="before-live" />

  <section class="card-rail-section live-section">
    <div class="section-head">
      <div class="section-copy">
        <h3>{liveTitle}</h3>
        <p>{liveDescription}</p>
      </div>
    </div>

    <slot name="live-prefix" />

    {#if canCreate && showComposer}
      <ActivityCreationWizard
        open={showComposer}
        form={activityForm}
        {selectablePlanPhases}
        {scheduleBounds}
        {locationQuickPicks}
        onSubmit={submitActivity}
        onCancel={closeComposer}
      />
    {/if}

    {#if liveActivities.length === 0}
      <div class="empty-card">{emptyLiveMessage}</div>
    {:else}
      <div class="card-rail">
        {#each liveActivities as activity (activity.id)}
          <div id={`activity-card-${activity.id}`} class="rail-card">
            <CollapsibleActivityCard
              activity={activity}
              expanded={highlightedActivityId === activity.id}
              highlighted={highlightedActivityId === activity.id}
              {changecommitment}
            />
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <details class="history-section" bind:open={historyOpen}>
    <summary class="history-summary">
      <span>History</span>
      <span class="history-count">{historyCount}</span>
    </summary>
    {#if !hasUnifiedHistory}
      <div class="empty-card">{emptyHistoryMessage}</div>
    {:else if governanceHistory.length === 0}
      <ActivityHistorySection
        hideHeader={true}
        title="History"
        description={historyDescription}
        items={historyItems}
        emptyMessage={emptyHistoryMessage}
        {highlightedHistoryId}
        {toggleHistoryCompletion}
        {saveActivityRating}
        {deleteActivityRating}
      />
    {:else}
      <div class="unified-history">
        <p class="unified-copy">{historyDescription}</p>
        {#each unifiedHistory as entry (entry.kind === 'activity' ? entry.item.id : `gov-${entry.item.id}`)}
          {#if entry.kind === 'activity'}
            <ActivityHistorySection
              hideHeader={true}
              title=""
              description=""
              items={[entry.item]}
              emptyMessage=""
              {highlightedHistoryId}
              {toggleHistoryCompletion}
              {saveActivityRating}
              {deleteActivityRating}
            />
          {:else}
            <DecisionHistoryCard
              entry={entry.item}
              highlighted={highlightedHistoryId === entry.item.id}
              onVote={onGovernanceVote}
            />
          {/if}
        {/each}
      </div>
    {/if}
  </details>
</section>

<style>
  .scheduling-panel,
  .card-rail-section,
  .card-rail,
  .unified-history,
  .software-action-picker,
  .software-action-grid {
    display: grid;
    gap: 12px;
  }

  .software-action-picker {
    padding: 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .software-action-copy h3,
  .software-action-copy p {
    margin: 0;
  }

  .software-action-copy p {
    margin-top: 6px;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.45;
  }

  .software-action-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .action-choice {
    display: grid;
    gap: 6px;
    text-align: left;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
    cursor: pointer;
    font: inherit;
  }

  .action-choice strong {
    font-size: 14px;
  }

  .action-choice span {
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.4;
  }

  @media (max-width: 760px) {
    .software-action-grid {
      grid-template-columns: 1fr;
    }
  }

  .section-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: end;
  }

  .section-copy h3,
  .section-copy p {
    margin: 0;
  }

  .section-copy p,
  .empty-card,
  .unified-copy {
    color: var(--text-soft);
  }

  .unified-copy {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
  }

  .card-rail {
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
  }

  .rail-card,
  .history-section {
    min-width: 0;
  }

  .empty-card {
    padding: 12px 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    font-size: 12px;
    font-weight: 700;
  }

  .history-section {
    border-top: 1px solid var(--panel-border);
    padding-top: 12px;
  }

  .history-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    cursor: pointer;
    list-style: none;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-main);
  }

  .history-summary::-webkit-details-marker {
    display: none;
  }

  .history-count {
    padding: 4px 8px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
  }

  [id^='activity-card-'] {
    scroll-margin-top: 92px;
  }
</style>
