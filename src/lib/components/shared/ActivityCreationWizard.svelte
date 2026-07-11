<script lang="ts">
  import PlanWizardShell from '$lib/components/shared/PlanWizardShell.svelte';
  import ProjectActivityRolesEditor from '$lib/components/forms/project-detail/ProjectActivityRolesEditor.svelte';
  import {
    buildActivityCreationSteps,
    composeActivityLocationLabel,
    effectiveActivityStartMin,
    activityScheduleValidationMessage,
    minimumParticipantsFromRoles,
    normalizedRoleRequirements,
    validateActivityStep,
    type ActivityCreationForm,
    type ActivityScheduleBounds
  } from '$lib/utils/activityCreationSteps';
  import { formatScheduleLabel } from '$lib/utils/time';
  import { localDateTimeInputToIso } from '$lib/utils/eventSchedule';

  export let open = false;
  export let title = 'Create activity';
  export let form: ActivityCreationForm;
  export let selectablePlanPhases: Array<{ id: string; label: string }> = [];
  export let scheduleBounds: ActivityScheduleBounds | null = null;
  export let submitLabel = 'Create activity';
  export let onSubmit: () => void | Promise<void> = () => {};
  export let onCancel: () => void = () => {};

  let stepIndex = 0;

  $: steps = buildActivityCreationSteps(selectablePlanPhases.length > 0);
  $: currentStep = steps[stepIndex] ?? null;
  $: isReviewStep = currentStep?.type === 'review';
  $: nextLabel = isReviewStep ? submitLabel : 'Next';
  $: canGoBack = stepIndex > 0;
  $: canGoNext = currentStep ? validateActivityStep(currentStep, form) : false;
  $: scheduleStartMin = effectiveActivityStartMin(form.scheduledAt, scheduleBounds);
  $: scheduleValidationMessage =
    currentStep?.type === 'schedule' ? activityScheduleValidationMessage(form) : null;
  $: minimumParticipants = minimumParticipantsFromRoles(form.roleRequirements);
  $: locationSummary = composeActivityLocationLabel(form);
  $: linkedStageLabel =
    selectablePlanPhases.find((stage) => stage.id === form.linkedPlanPhaseId)?.label ?? '—';

  function scheduleSummary() {
    if (!form.scheduledAt || !form.endsAt) {
      return '—';
    }

    try {
      const start = formatScheduleLabel(localDateTimeInputToIso(form.scheduledAt));
      const end = formatScheduleLabel(localDateTimeInputToIso(form.endsAt));
      return `${start} – ${end}`;
    } catch {
      return '—';
    }
  }

  function handleBack() {
    if (stepIndex > 0) {
      stepIndex -= 1;
    }
  }

  async function handleNext() {
    if (!currentStep) {
      return;
    }

    if (isReviewStep) {
      await onSubmit();
      return;
    }

    if (stepIndex < steps.length - 1) {
      stepIndex += 1;
    }
  }

  function handleClose() {
    stepIndex = 0;
    onCancel();
  }

  $: if (!open) {
    stepIndex = 0;
  }
</script>

<PlanWizardShell
  {open}
  {title}
  {stepIndex}
  stepCount={steps.length}
  {nextLabel}
  {canGoBack}
  {canGoNext}
  on:close={handleClose}
  on:back={handleBack}
  on:next={handleNext}
>
  {#if currentStep}
    <div class="question-block">
      <h2>{currentStep.question}</h2>
      {#if currentStep.helper}
        <p class="helper-copy">{currentStep.helper}</p>
      {/if}

      {#if currentStep.type === 'title'}
        <input bind:value={form.title} maxlength="120" placeholder="Activity title" />
      {:else if currentStep.type === 'schedule'}
        <div class="field-grid">
          <label>
            <span>Start time</span>
            <input
              bind:value={form.scheduledAt}
              type="datetime-local"
              min={scheduleStartMin ?? scheduleBounds?.startLocal ?? undefined}
              max={scheduleBounds?.endLocal ?? undefined}
            />
          </label>
          <label>
            <span>Finish time</span>
            <input
              bind:value={form.endsAt}
              type="datetime-local"
              min={form.scheduledAt || scheduleStartMin || scheduleBounds?.startLocal || undefined}
              max={scheduleBounds?.endLocal ?? undefined}
            />
          </label>
        </div>
        {#if scheduleValidationMessage}
          <p class="validation-copy">{scheduleValidationMessage}</p>
        {/if}
      {:else if currentStep.type === 'location'}
        <div class="location-stack">
          <label class="checkbox-row">
            <input bind:checked={form.isOnline} type="checkbox" />
            <span>This activity is online</span>
          </label>
          {#if form.isOnline}
            <label>
              <span>Room or link name (optional)</span>
              <input
                bind:value={form.onlineDetail}
                maxlength="120"
                placeholder="e.g. Zoom, Discord, or meeting room name"
              />
            </label>
          {:else}
            <label>
              <span>Place name</span>
              <input bind:value={form.locationLabel} maxlength="120" placeholder="Where will this happen?" />
            </label>
          {/if}
        </div>
      {:else if currentStep.type === 'plan-stage'}
        <select bind:value={form.linkedPlanPhaseId}>
          <option value="" disabled>Choose stage</option>
          {#each selectablePlanPhases as stage}
            <option value={stage.id}>{stage.label}</option>
          {/each}
        </select>
      {:else if currentStep.type === 'roles'}
        <ProjectActivityRolesEditor bind:roles={form.roleRequirements} />
        <div class="count-readout">
          <span>Minimum people needed:</span>
          <strong>{minimumParticipants}</strong>
        </div>
      {:else if currentStep.type === 'note'}
        <textarea
          bind:value={form.note}
          rows="5"
          placeholder="What should happen in this activity?"
        ></textarea>
      {:else if currentStep.type === 'review'}
        <div class="review-stack">
          <div class="review-row">
            <span>Title</span>
            <strong>{form.title || '—'}</strong>
          </div>
          <div class="review-row">
            <span>Schedule</span>
            <strong>{scheduleSummary()}</strong>
          </div>
          <div class="review-row">
            <span>Location</span>
            <strong>{locationSummary || '—'}</strong>
          </div>
          {#if selectablePlanPhases.length > 0}
            <div class="review-row">
              <span>Linked stage</span>
              <strong>{linkedStageLabel}</strong>
            </div>
          {/if}
          <div class="review-row">
            <span>Roles</span>
            <strong>
              {normalizedRoleRequirements(form.roleRequirements)
                .map((role) => `${role.label} (${role.requiredCount}${role.maximumCount ? `–${role.maximumCount}` : '+'})`)
                .join(', ') || '—'}
            </strong>
          </div>
          <div class="review-row">
            <span>Note</span>
            <strong>{form.note || '—'}</strong>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</PlanWizardShell>

<style>
  .question-block {
    display: grid;
    gap: 16px;
  }

  h2 {
    margin: 0;
    font-size: 22px;
    line-height: 1.3;
    letter-spacing: -0.02em;
  }

  .helper-copy {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.5;
  }

  .validation-copy {
    margin: 0;
    color: var(--status-red-strong, #b42318);
    font-size: 12px;
    line-height: 1.45;
  }

  input,
  textarea,
  select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-main);
    font: inherit;
  }

  .field-grid,
  .location-stack,
  .review-stack {
    display: grid;
    gap: 12px;
  }

  .field-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  label {
    display: grid;
    gap: 6px;
    font-size: 13px;
    color: var(--text-soft);
  }

  .checkbox-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .checkbox-row input {
    width: auto;
  }

  .count-readout {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-soft);
    font-size: 13px;
  }

  .count-readout strong {
    color: var(--text-main);
  }

  .review-row {
    display: grid;
    gap: 4px;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .review-row span {
    font-size: 12px;
    color: var(--text-soft);
  }

  .review-row strong {
    color: var(--text-main);
    font-weight: 600;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  @media (max-width: 760px) {
    .field-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
