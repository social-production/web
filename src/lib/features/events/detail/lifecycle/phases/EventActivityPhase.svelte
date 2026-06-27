<script lang="ts">
  import CollapsibleActivityCard from '$lib/components/cards/project-detail/CollapsibleActivityCard.svelte';
  import ProjectActivityCalendarCard from '$lib/components/cards/project-detail/ProjectActivityCalendarCard.svelte';
  import ProjectActivityRolesEditor from '$lib/components/forms/project-detail/ProjectActivityRolesEditor.svelte';
  import type { EventPageData, EventPlan } from '$lib/types/detail';
  import { eventPlanScheduledDayIsos } from '../eventLifecycleShared';
  import type { EventActivityForm } from '../eventLifecycleShared';
  import { eventScheduleDayBounds } from '$lib/utils/eventSchedule';

  export let data: EventPageData;
  export let selectedPlan: EventPlan | null = null;
  export let showActivityComposer = false;
  export let activityForm: EventActivityForm = {
    title: '',
    scheduledAt: '',
    endsAt: '',
    locationLabel: '',
    roleRequirements: [{ label: '', requiredCount: 1 }],
    linkedPlanPhaseId: null,
    note: ''
  };
  export let minimumParticipants = 0;
  export let selectedDayIso = '';
  export let highlightedActivityId: string | null = null;
  export let openActivityComposerForDay: (isoDay?: string) => void = () => {};
  export let submitActivity: () => void | Promise<void> = () => {};
  export let changeCommitment: (
    activityId: string,
    roleLabel: string | null
  ) => void | Promise<void> = () => {};
  export let activityComposerElement: HTMLDivElement | null = null;

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
  $: composerDayIso = selectedDayIso || plannedDayIsos[0] || selectedPlan?.schedule.startDate || '';
  $: activityWindowBounds = eventScheduleDayBounds(selectedPlan?.schedule ?? null, composerDayIso);
</script>

<section class="phase-surface">
  {#if selectedPlan}
    <div class="info-card">
      <strong>Accepted event plan</strong>
      <p>{selectedPlan.description}</p>
      <p class="plan-timing-note">
        Plan timing: {selectedPlan.schedule.label}. Click a marked day to schedule activity from this plan.
      </p>
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

  {#if data.lifecycle.activity.viewerCanCreateActivities && showActivityComposer}
    <div bind:this={activityComposerElement} class="composer-card">
      <input bind:value={activityForm.title} maxlength="120" placeholder="Activity title" />
      <div class="number-grid">
        <label>
          <span class="field-inline-label">Start time</span>
          <input
            bind:value={activityForm.scheduledAt}
            type="datetime-local"
            min={activityWindowBounds?.startLocal ?? undefined}
            max={activityWindowBounds?.endLocal ?? undefined}
          />
        </label>
        <label>
          <span class="field-inline-label">Finish time</span>
          <input
            bind:value={activityForm.endsAt}
            type="datetime-local"
            min={activityForm.scheduledAt || activityWindowBounds?.startLocal || undefined}
            max={activityWindowBounds?.endLocal ?? undefined}
          />
        </label>
      </div>
      <input bind:value={activityForm.locationLabel} maxlength="120" placeholder="Location" />
      {#if data.lifecycle.activity.selectablePlanPhases.length > 0}
        <label>
          <span class="field-inline-label">Linked plan stage</span>
          <select bind:value={activityForm.linkedPlanPhaseId}>
            {#each data.lifecycle.activity.selectablePlanPhases as option}
              <option value={option.id}>{option.label}</option>
            {/each}
          </select>
        </label>
      {/if}
      <ProjectActivityRolesEditor bind:roles={activityForm.roleRequirements} />
      <div class="count-field">
        <span class="count-field-label">
          <span class="field-inline-label">Minimum people</span>
          <span class="count-note">This is calculated from the role minimums above.</span>
        </span>
        <div class="count-readout">
          <strong>{minimumParticipants}</strong>
        </div>
      </div>
      <textarea bind:value={activityForm.note} rows="3" placeholder="What needs to happen in this activity?"></textarea>
      <div class="composer-actions">
        <button class="secondary-button" type="button" on:click={() => (showActivityComposer = false)}>Cancel</button>
        <button class="primary-button" type="button" on:click={submitActivity}>Create activity</button>
      </div>
    </div>
  {/if}

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
  .composer-card,
  .info-card {
    display: grid;
    gap: 12px;
  }

  .info-card,
  .composer-card,
  .empty-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .number-grid,
  .count-field,
  .count-readout,
  .composer-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .number-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .count-field {
    justify-content: space-between;
    align-items: flex-start;
  }

  .count-field-label {
    display: grid;
    gap: 4px;
  }

  strong,
  .count-readout strong {
    color: var(--text-main);
  }

  p,
  .empty-card,
  .count-note,
  .field-inline-label {
    margin: 0;
    color: var(--text-soft);
  }

  .plan-timing-note {
    font-size: 12px;
    line-height: 1.5;
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
  }

  textarea {
    min-height: 110px;
    resize: vertical;
  }

  .primary-button,
  .secondary-button {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
  }

  .primary-button {
    border: 1px solid var(--brand);
    background: var(--brand);
    color: var(--page-bg);
  }

  .secondary-button {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    color: var(--text-soft);
  }

  @media (max-width: 760px) {
    .number-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>