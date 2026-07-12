<script lang="ts">
  import ActivityCreationWizard from '$lib/components/shared/ActivityCreationWizard.svelte';
  import CollapsibleActivityCard from '$lib/components/cards/project-detail/CollapsibleActivityCard.svelte';
  import ProjectActivityCalendarCard from '$lib/components/cards/project-detail/ProjectActivityCalendarCard.svelte';
  import ActivityHistorySection from '$lib/features/projects/detail/components/ActivityHistorySection.svelte';
  import type {
    ProjectActivityItem,
    ProjectServiceHistoryCompletionChoice,
    ProjectServiceHistoryCompletionRole,
    ProjectServiceHistoryItem
  } from '$lib/types/detail';
  import type { ActivityCreationForm, ActivityScheduleBounds } from '$lib/utils/activityCreationSteps';

  type CalendarInteractionAnchor = {
    clientX: number;
    clientY: number;
  };

  export let calendarActivities: ProjectActivityItem[] = [];
  export let plannedDayIsos: string[] = [];
  export let liveActivities: ProjectActivityItem[] = [];
  export let historyItems: ProjectServiceHistoryItem[] = [];
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
  export let submitActivity: () => void | Promise<void> = () => {};
  export let closeComposer: () => void = () => {};
  export let daySelect: (isoDay: string, anchor?: CalendarInteractionAnchor) => void | Promise<void> = () => {};
  export let createAction: (anchor?: CalendarInteractionAnchor) => void | Promise<void> = () => {};
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
</script>

<section class="scheduling-panel">
  <ProjectActivityCalendarCard
    activities={calendarActivities}
    {plannedDayIsos}
    {canCreate}
    {createActive}
    {createAriaLabel}
    {selectedDayIso}
    selectedActivityId={selectedActivityId || highlightedActivityId || ''}
    {daySelect}
    {createAction}
    activitySelect={handleActivitySelection}
  />

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
      <span class="history-count">{historyItems.length}</span>
    </summary>
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
  </details>
</section>

<style>
  .scheduling-panel,
  .card-rail-section,
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

  .section-copy h3,
  .section-copy p {
    margin: 0;
  }

  .section-copy p,
  .empty-card {
    color: var(--text-soft);
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
