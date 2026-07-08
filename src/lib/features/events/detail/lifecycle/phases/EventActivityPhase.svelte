<script lang="ts">
  import ActivityCreationWizard from '$lib/components/shared/ActivityCreationWizard.svelte';
  import CollapsibleActivityCard from '$lib/components/cards/project-detail/CollapsibleActivityCard.svelte';
  import ProjectActivityCalendarCard from '$lib/components/cards/project-detail/ProjectActivityCalendarCard.svelte';
  import type { EventPageData, EventPlan } from '$lib/types/detail';
  import { eventPlanScheduledDayIsos } from '../eventLifecycleShared';
  import type { EventActivityForm } from '../eventLifecycleShared';
  import { eventScheduleDayBounds } from '$lib/utils/eventSchedule';
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

  function scrollToActivity(activityId: string) {
    highlightedActivityId = activityId;
    if (typeof document !== 'undefined') {
      document.getElementById(`event-activity-${activityId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  $: plannedDayIsos = eventPlanScheduledDayIsos(selectedPlan);
  $: planTimingLabel = selectedPlan ? formatEventPlanSchedule(selectedPlan.schedule) : '';
  $: composerDayIso = selectedDayIso || plannedDayIsos[0] || selectedPlan?.schedule.startDate || '';
  $: activityWindowBounds = eventScheduleDayBounds(selectedPlan?.schedule ?? null, composerDayIso);
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

  <ProjectActivityCalendarCard
    activities={data.lifecycle.activity.activities}
    {plannedDayIsos}
    canCreate={data.lifecycle.activity.viewerCanCreateActivities}
    createActive={showActivityComposer}
    createAction={() => openActivityComposerForDay(selectedDayIso)}
    daySelect={(isoDay) => {
      selectedDayIso = isoDay;
      if (data.lifecycle.activity.viewerCanCreateActivities) {
        openActivityComposerForDay(isoDay);
      }
    }}
    selectedActivityId={highlightedActivityId ?? ''}
    {selectedDayIso}
    activitySelect={scrollToActivity}
  />

  <ActivityCreationWizard
    open={showActivityComposer}
    form={activityForm}
    selectablePlanPhases={data.lifecycle.activity.selectablePlanPhases}
    scheduleBounds={activityWindowBounds}
    onSubmit={submitActivity}
    onCancel={() => (showActivityComposer = false)}
  />

  <div class="surface-stack">
    {#if data.lifecycle.activity.activities.length === 0}
      <div class="empty-card">
        {plannedDayIsos.length > 0
          ? 'No activity scheduled yet. Click a marked plan day to add the first activity.'
          : 'No activity scheduled yet.'}
      </div>
    {:else}
      {#each data.lifecycle.activity.activities as activity}
        <div id={`event-activity-${activity.id}`}>
          <CollapsibleActivityCard
            activity={activity}
            highlighted={highlightedActivityId === activity.id}
            changecommitment={changeCommitment}
          />
        </div>
      {/each}
    {/if}
  </div>
</section>

<style>
  .phase-surface,
  .surface-stack,
  .info-card {
    display: grid;
    gap: 12px;
  }

  .info-card,
  .empty-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  strong {
    color: var(--text-main);
  }

  p,
  .empty-card {
    margin: 0;
    color: var(--text-soft);
  }

  .plan-timing-note {
    font-size: 12px;
    line-height: 1.5;
  }

  .plan-timing-note.subtle {
    color: var(--text-soft);
  }
</style>
