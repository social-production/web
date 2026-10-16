<script lang="ts">
  import ActivityCreationWizard from '$lib/components/shared/ActivityCreationWizard.svelte';
  import ActivityAgendaList from '$lib/components/cards/project-detail/ActivityAgendaList.svelte';
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
  import {
    declineProjectActivityRoleSuggestion,
    suggestProjectActivityRole
  } from '$lib/services/commands/projects';
  import {
    declineEventActivityRoleSuggestion,
    suggestEventActivityRole
  } from '$lib/services/commands/events';
  import { invalidateEventDetail, invalidateProjectDetail } from '$lib/utils/detailInvalidation';

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
  export let createButtonLabel = 'Add activity';
  export let selectedDayIso = '';
  export let selectedActivityId = '';
  export let highlightedActivityId: string | null = null;
  export let highlightedHistoryId: string | null = null;
  export let historyOpen = false;
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
  export let showExtraDock = false;
  export let changecommitment: (activityId: string, roleLabel: string | null) => void | Promise<void> = () => {};
  export let viewerCanSuggest = false;
  export let entityKind: 'project' | 'event' = 'project';
  export let entitySlug = '';
  export let onSuggestRole: (activityId: string, roleId: string, userId: string) => void | Promise<void> = async (
    activityId,
    roleId,
    userId
  ) => {
    if (!entitySlug) {
      return;
    }
    if (entityKind === 'event') {
      await suggestEventActivityRole(entitySlug, activityId, roleId, userId);
      await invalidateEventDetail(entitySlug);
    } else {
      await suggestProjectActivityRole(entitySlug, activityId, roleId, userId);
      await invalidateProjectDetail(entitySlug);
    }
  };
  export let onDeclineRoleSuggestion: (activityId: string, roleId: string) => void | Promise<void> = async (
    activityId,
    roleId
  ) => {
    if (!entitySlug) {
      return;
    }
    if (entityKind === 'event') {
      await declineEventActivityRoleSuggestion(entitySlug, activityId, roleId);
      await invalidateEventDetail(entitySlug);
    } else {
      await declineProjectActivityRoleSuggestion(entitySlug, activityId, roleId);
      await invalidateProjectDetail(entitySlug);
    }
  };
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

  // Add activity and Pull request are separate buttons; creating from the calendar always starts an activity.
  function handleCreateAction(anchor?: CalendarInteractionAnchor) {
    createAction(anchor);
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
    {showExtraDock}
    {createActive}
    {createAriaLabel}
    {createButtonLabel}
    {selectedDayIso}
    selectedActivityId={selectedActivityId || highlightedActivityId || ''}
    {daySelect}
    createAction={handleCreateAction}
    activitySelect={handleActivitySelection}
  >
    <svelte:fragment slot="extra">
      <slot name="dock-extra" />
    </svelte:fragment>
  </ProjectActivityCalendarCard>

  

  <slot name="before-live" />

  <section class="card-rail-section live-section">
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
      <ActivityAgendaList
        activities={liveActivities}
        {highlightedActivityId}
        {changecommitment}
        {viewerCanSuggest}
        {onSuggestRole}
        {onDeclineRoleSuggestion}
      />
    {/if}
  </section>

  {#if historyCount > 0}
  <details class="history-section" bind:open={historyOpen}>
    <summary class="history-summary">
      <span>Past activity</span>
      <svg class="history-chevron" aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
        <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
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
  {/if}
</section>

<style>
  .scheduling-panel,
  .card-rail-section,
  .unified-history {
    display: grid;
    gap: 12px;
  }

  .history-section {
    min-width: 0;
    border-top: 1px solid var(--panel-border);
    padding-top: 12px;
  }

  .empty-card {
    padding: 12px 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .history-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 4px 0;
    cursor: pointer;
    list-style: none;
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .history-summary::-webkit-details-marker {
    display: none;
  }

  .history-chevron {
    transition: transform 0.15s ease;
  }

  .history-section[open] .history-chevron {
    transform: rotate(180deg);
  }

  .history-section[open] > :global(:not(summary)) {
    margin-top: 8px;
  }

  .scheduling-panel :global([id^='activity-card-']) {
    scroll-margin-top: 92px;
  }
</style>
