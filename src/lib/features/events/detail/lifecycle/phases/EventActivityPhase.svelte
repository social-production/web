<script lang="ts">
  import { tick } from 'svelte';
  import ActivitySchedulingPanel from '$lib/features/projects/detail/components/ActivitySchedulingPanel.svelte';
  import type { EventPageData, EventPlan } from '$lib/types/detail';
  import { eventPlanScheduledDayIsos } from '../eventLifecycleShared';
  import type { EventActivityForm } from '../eventLifecycleShared';
  import { eventScheduleDayBounds } from '$lib/utils/eventSchedule';
  import type {
    ProjectServiceHistoryCompletionChoice,
    ProjectServiceHistoryCompletionRole
  } from '$lib/types/detail';
  import { formatEventPlanSchedule } from '$lib/utils/time';

  export let data: EventPageData;
  export let selectedPlan: EventPlan | null = null;
  export let showActivityComposer = false;
  export let activityForm: EventActivityForm = {
    title: '',
    scheduledAt: '',
    endsAt: '',
    isOnline: false,
    locationLabel: '',
    onlineDetail: '',
    roleRequirements: [{ label: '', requiredCount: 1 }],
    linkedPlanPhaseId: null,
    note: ''
  };
  export let selectedDayIso = '';
  export let highlightedActivityId: string | null = null;
  export let openActivityComposerForDay: (isoDay?: string) => void = () => {};
  export let submitActivity: () => void | Promise<void> = () => {};
  export let changeCommitment: (
    activityId: string,
    roleLabel: string | null
  ) => void | Promise<void> = () => {};
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

  let historyOpen = false;
  let highlightedHistoryId: string | null = null;

  $: plannedDayIsos = eventPlanScheduledDayIsos(selectedPlan);
  $: planTimingLabel = selectedPlan ? formatEventPlanSchedule(selectedPlan.schedule) : '';
  $: composerDayIso = selectedDayIso || plannedDayIsos[0] || selectedPlan?.schedule.startDate || '';
  $: activityWindowBounds = eventScheduleDayBounds(selectedPlan?.schedule ?? null, composerDayIso);
  $: calendarActivities = [
    ...data.lifecycle.activity.activities,
    ...(data.lifecycle.activity.history ?? []).map((item) => item.activity)
  ];

  async function focusActivityCard(activityId: string) {
    highlightedActivityId = activityId;
    await tick();
    document.getElementById(`activity-card-${activityId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }

  async function focusHistoryCard(historyId: string) {
    highlightedHistoryId = historyId;
    await tick();
    document.getElementById(`history-card-${historyId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  async function toggleActivityComposer() {
    if (showActivityComposer) {
      showActivityComposer = false;
      return;
    }

    openActivityComposerForDay(selectedDayIso);
    showActivityComposer = true;
  }

  function closeComposer() {
    showActivityComposer = false;
  }
</script>

<section id="participation-activities" class="phase-surface">
  {#if selectedPlan}
    <div class="info-card">
      <strong>Accepted event plan</strong>
      <p>{selectedPlan.description}</p>
      <p class="plan-timing-note">
        <strong>Plan timing:</strong>
        {planTimingLabel || selectedPlan.schedule.label}
      </p>
      <p class="plan-timing-note subtle">Click a marked day to schedule activity from this plan.</p>
      <p class="plan-timing-note">Plan location: {selectedPlan.locationLabel}</p>
    </div>
  {/if}

  <ActivitySchedulingPanel
    {calendarActivities}
    {plannedDayIsos}
    liveActivities={data.lifecycle.activity.activities}
    historyItems={data.lifecycle.activity.history ?? []}
    canCreate={data.lifecycle.activity.viewerCanCreateActivities}
    showComposer={showActivityComposer}
    createActive={showActivityComposer}
    {selectedDayIso}
    {highlightedActivityId}
    {highlightedHistoryId}
    bind:historyOpen
    {activityForm}
    selectablePlanPhases={data.lifecycle.activity.selectablePlanPhases}
    scheduleBounds={activityWindowBounds}
    liveTitle="Activity"
    liveDescription="Schedule event activities and sign up for open roles."
    historyDescription="Past event activity, ratings, and completion check-in."
    emptyLiveMessage={plannedDayIsos.length > 0
      ? 'No activity scheduled yet. Click a marked plan day to add the first activity.'
      : 'No activity scheduled yet.'}
    emptyHistoryMessage="No activity has moved into history yet."
    {submitActivity}
    {closeComposer}
    daySelect={(isoDay) => {
      selectedDayIso = isoDay;
      if (data.lifecycle.activity.viewerCanCreateActivities) {
        openActivityComposerForDay(isoDay);
      }
    }}
    createAction={() => openActivityComposerForDay(selectedDayIso)}
    changecommitment={changeCommitment}
    {toggleHistoryCompletion}
    {saveActivityRating}
    onLiveActivitySelect={focusActivityCard}
    onHistoryActivitySelect={focusHistoryCard}
  />
</section>

<style>
  .phase-surface,
  .info-card {
    display: grid;
    gap: 12px;
  }

  .info-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .info-card p {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.45;
  }

  .plan-timing-note {
    font-size: 12px;
    line-height: 1.5;
  }

  .plan-timing-note.subtle {
    color: var(--text-soft);
  }
</style>
