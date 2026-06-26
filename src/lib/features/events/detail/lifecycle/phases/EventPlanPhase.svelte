<script lang="ts">
  import CollapsiblePlanCard from '$lib/components/cards/project-detail/CollapsiblePlanCard.svelte';
  import RoundPlusButton from '$lib/components/shared/RoundPlusButton.svelte';
  import type {
    EventPageData,
    GovernanceSignalSummary,
    ProjectApprovalVote
  } from '$lib/types/detail';
  import type { EventPlanForm } from '../eventLifecycleShared';

  export let data: EventPageData;
  export let signalSummary: GovernanceSignalSummary | null = null;
  export let showPlanComposer = false;
  export let planForm: EventPlanForm = {
    title: '',
    description: '',
    demandConsiderationNote: '',
    scheduleMode: 'date',
    scheduledDate: '',
    rangeStartDate: '',
    rangeEndDate: '',
    startTimeLabel: '',
    finishTimeLabel: '',
    locationLabel: '',
    planPhases: [{ title: '', details: '' }],
    validationMessages: []
  };
  export let addPlanPhase: () => void = () => {};
  export let removePlanPhase: (index: number) => void = () => {};
  export let submitPlan: () => void | Promise<void> = () => {};
  export let targetedPlanId: string | null = null;
  export let voteOnPlanValue: (
    planId: string,
    valueId: string,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  export let voteOnPlanOverall: (
    planId: string,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};

  function statusLabel(planId: string) {
    if (planId !== data.lifecycle.phaseTwo.winningPlanId) {
      return null;
    }

    return data.lifecycle.currentPhaseId === 'event-plan' ? 'Leading above threshold' : 'Selected';
  }
</script>

<section class="phase-surface">
  {#if data.lifecycle.phaseTwo.viewerCanSubmitPlans}
    <div class="composer-toggle-row">
      <RoundPlusButton
        active={showPlanComposer}
        ariaLabel={showPlanComposer ? 'Hide event plan composer' : 'Add event plan'}
        action={() => (showPlanComposer = !showPlanComposer)}
      />
    </div>

    {#if showPlanComposer}
      <div class="composer-card">
        {#if (planForm.validationMessages?.length ?? 0) > 0}
          <div class="warning-card" role="alert">
            <strong>Plan could not be submitted</strong>
            <ul class="warning-list">
              {#each planForm.validationMessages ?? [] as message}
                <li>{message}</li>
              {/each}
            </ul>
          </div>
        {/if}

        <input bind:value={planForm.title} maxlength="120" placeholder="Plan title" />
        <textarea bind:value={planForm.description} rows="3" placeholder="Describe the overall event plan."></textarea>
        <p class="field-help">The approved plan becomes the live event title, description, schedule, and location when the event moves into activity.</p>
        <label>
          <span class="field-inline-label">Plan timing</span>
          <select bind:value={planForm.scheduleMode}>
            <option value="date">Single date</option>
            <option value="range">Date range</option>
          </select>
        </label>
        {#if planForm.scheduleMode === 'date'}
          <label>
            <span class="field-inline-label">Date</span>
            <input bind:value={planForm.scheduledDate} type="date" />
          </label>
        {:else if planForm.scheduleMode === 'range'}
          <div class="schedule-grid">
            <label>
              <span class="field-inline-label">Start date</span>
              <input bind:value={planForm.rangeStartDate} type="date" />
            </label>
            <label>
              <span class="field-inline-label">End date</span>
              <input bind:value={planForm.rangeEndDate} type="date" />
            </label>
          </div>
        {/if}
        <div class="time-grid">
          <label>
            <span class="field-inline-label">Start time</span>
            <input bind:value={planForm.startTimeLabel} type="time" />
          </label>
          <label>
            <span class="field-inline-label">Finish time</span>
            <input bind:value={planForm.finishTimeLabel} type="time" />
          </label>
        </div>
        <label>
          <span class="field-inline-label">Location</span>
          <input bind:value={planForm.locationLabel} maxlength="120" placeholder="Event location" />
        </label>
        <p class="field-help">Marked plan days become the days where activity can be scheduled from the calendar.</p>
        <div class="demand-context-card">
          <strong>Current demand signal</strong>
          <span>
            {#if signalSummary}
              {signalSummary.demandCount} demand signals are active right now.
            {:else}
              This private event uses editor approval instead of public demand signals.
            {/if}
          </span>
        </div>
        <textarea bind:value={planForm.demandConsiderationNote} rows="3" placeholder="Explain how this plan responds to the current event demand and values."></textarea>
        <div class="step-stack">
          {#each planForm.planPhases as phase, index}
            <div class="step-card">
              <div class="step-header-row">
                <strong>Stage {index + 1}</strong>
                {#if planForm.planPhases.length > 1}
                  <button class="secondary-button" type="button" on:click={() => removePlanPhase(index)}>Remove</button>
                {/if}
              </div>
              <input bind:value={phase.title} maxlength="120" placeholder="Stage title" />
              <textarea bind:value={phase.details} rows="3" placeholder="What happens in this stage?"></textarea>
            </div>
          {/each}
        </div>
        <div class="composer-actions">
          <button class="secondary-button" type="button" on:click={addPlanPhase}>Add stage</button>
        </div>
        <div class="composer-actions">
          <button class="secondary-button" type="button" on:click={() => (showPlanComposer = false)}>Cancel</button>
          <button class="primary-button" type="button" on:click={submitPlan}>Submit event plan</button>
        </div>
      </div>
    {/if}
  {/if}

  <div class="surface-stack plan-stack" class:scrollable-stack={data.lifecycle.phaseTwo.plans.length > 4}>
    {#if data.lifecycle.phaseTwo.plans.length === 0}
      <div class="empty-card">No event plans submitted yet.</div>
    {:else}
      {#each data.lifecycle.phaseTwo.plans as plan}
        <CollapsiblePlanCard
          {plan}
          expanded={plan.id === data.lifecycle.phaseTwo.winningPlanId || plan.id === targetedPlanId}
          canVote={data.lifecycle.phaseTwo.viewerCanVoteOnPlans}
          statusLabel={statusLabel(plan.id)}
          valuevote={voteOnPlanValue}
          overallvote={voteOnPlanOverall}
        />
      {/each}
    {/if}
  </div>
</section>

<style>
  .phase-surface,
  .surface-stack,
  .composer-card,
  .warning-card,
  .step-stack,
  .schedule-grid,
  .time-grid,
  .step-card,
  .demand-context-card {
    display: grid;
    gap: 12px;
  }

  .composer-card,
  .empty-card,
  .step-card,
  .demand-context-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .warning-card {
    padding: 14px 16px;
    border: 1px solid color-mix(in srgb, var(--status-yellow) 50%, var(--panel-border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--status-yellow) 14%, var(--panel-strong));
  }

  .warning-list {
    margin: 0;
    padding-left: 18px;
    color: var(--text-soft);
    display: grid;
    gap: 4px;
  }

  .composer-toggle-row,
  .step-header-row,
  .composer-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .composer-toggle-row {
    justify-content: center;
  }

  .step-header-row,
  .composer-actions {
    justify-content: space-between;
  }

  .schedule-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .time-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .scrollable-stack {
    max-height: min(34rem, 72vh);
    overflow-y: auto;
    align-content: start;
    padding-right: 4px;
  }

  strong {
    color: var(--text-main);
  }

  .empty-card,
  p {
    color: var(--text-soft);
  }

  p {
    margin: 0;
  }

  .field-help {
    font-size: 12px;
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
</style>