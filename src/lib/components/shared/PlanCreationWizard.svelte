<script lang="ts">
  import PlanWizardShell from '$lib/components/shared/PlanWizardShell.svelte';
  import LocationPicker from '$lib/components/shared/LocationPicker.svelte';
  import TimePicker from '$lib/components/shared/TimePicker.svelte';
  import DirectUsePolicyNotice from '$lib/components/shared/DirectUsePolicyNotice.svelte';
  import SoftwareLicenseNotice from '$lib/components/shared/SoftwareLicenseNotice.svelte';
  import { softwareLicenseLabelForSubtype } from '$lib/copy/softwareLicensePolicy';
  import type { PlanCreationStep, PlanCreationForm } from '$lib/utils/planRubric';
  import type { ProjectSubtype } from '$lib/types/feed';
  import type { GovernanceSignalSummary } from '$lib/types/detail';
  import { emptyLocationPickerValue, onlineLocationPickerValue, type LocationPickerValue } from '$lib/types/locationPicker';

  let locationPickerValue: LocationPickerValue = emptyLocationPickerValue();
  let distributionLocationPickerValue: LocationPickerValue = emptyLocationPickerValue();
  let pickerSeededForOpen = false;

  export let open = false;
  export let title = 'Create plan';
  export let context: 'project' | 'event' = 'project';
  export let steps: PlanCreationStep[] = [];
  export let form: PlanCreationForm;
  export let submitLabel = 'Submit plan';
  export let subtypeOptions: Array<{ value: ProjectSubtype; label: string }> = [];
  export let productionPlanLocation: { locationId: string | null; locationLabel: string } | null = null;
  export let signalSummary: GovernanceSignalSummary | null = null;
  export let signalCount: number | null = null;
  export let addPlanPhase: () => void = () => {};
  export let addMaterial: (phaseIndex: number) => void = () => {};
  export let removeMaterial: (phaseIndex: number, materialIndex: number) => void = () => {};
  export let onSubmit: () => void | Promise<void> = () => {};
  export let onCancel: () => void = () => {};

  let stepIndex = 0;

  function resolvedPickerLabel(value: LocationPickerValue) {
    if (value.mode === 'online' || value.isOnline) {
      return value.displayLabel.trim() || 'Online';
    }
    return value.displayLabel;
  }

  function seedPickersFromForm() {
    if (form.locationIsOnline || (form.locationLabel ?? '').trim().toLowerCase() === 'online') {
      locationPickerValue = onlineLocationPickerValue(form.locationLabel || 'Online');
    } else if (form.locationId || form.locationLabel) {
      locationPickerValue = {
        ...emptyLocationPickerValue('physical'),
        displayLabel: form.locationLabel ?? '',
        locationId: form.locationId ?? null
      };
    } else {
      locationPickerValue = emptyLocationPickerValue();
    }

    if (form.distributionLocationId || form.distributionLocationLabel) {
      distributionLocationPickerValue = {
        ...emptyLocationPickerValue('physical'),
        displayLabel: form.distributionLocationLabel ?? '',
        locationId: form.distributionLocationId ?? null
      };
    } else {
      distributionLocationPickerValue = emptyLocationPickerValue();
    }
  }

  $: if (open && !pickerSeededForOpen) {
    seedPickersFromForm();
    pickerSeededForOpen = true;
  }

  $: if (!open && pickerSeededForOpen) {
    pickerSeededForOpen = false;
  }

  $: if (form.projectSubtype === 'software') {
    const nextLabel = softwareLicenseLabelForSubtype(form.projectSubtype);
    if (form.licenseLabel !== nextLabel) {
      form.licenseLabel = nextLabel;
    }
  } else if (form.licenseLabel) {
    form.licenseLabel = undefined;
  }

  $: visibleSteps = steps.filter((step) => {
    if (step.type === 'schedule-date') {
      return form.scheduleMode === 'date';
    }

    if (step.type === 'schedule-range') {
      return form.scheduleMode === 'range';
    }

    return true;
  });

  $: currentStep = visibleSteps[stepIndex] ?? null;
  $: isReviewStep = currentStep?.type === 'review';
  $: nextLabel = isReviewStep ? submitLabel : 'Next';
  $: canGoBack = stepIndex > 0;
  $: canGoNext = currentStep ? validateStep(currentStep, form) : false;

  function handleLocationChange(event: CustomEvent<LocationPickerValue>) {
    locationPickerValue = event.detail;
    form = {
      ...form,
      locationLabel: resolvedPickerLabel(locationPickerValue),
      locationId: locationPickerValue.locationId,
      locationIsOnline: locationPickerValue.mode === 'online' || locationPickerValue.isOnline
    };
  }

  function handleDistributionLocationChange(event: CustomEvent<LocationPickerValue>) {
    distributionLocationPickerValue = event.detail;
    form = {
      ...form,
      distributionLocationLabel: resolvedPickerLabel(distributionLocationPickerValue),
      distributionLocationId: distributionLocationPickerValue.locationId,
      distributionLocationIsOnline:
        distributionLocationPickerValue.mode === 'online' || distributionLocationPickerValue.isOnline,
      locationLabel: resolvedPickerLabel(distributionLocationPickerValue),
      locationId: distributionLocationPickerValue.locationId,
      locationIsOnline: distributionLocationPickerValue.mode === 'online' || distributionLocationPickerValue.isOnline
    };
  }

  function applySameAsProductionLocation() {
    if (!productionPlanLocation?.locationId && !productionPlanLocation?.locationLabel) {
      return;
    }

    form = {
      ...form,
      sameAsProductionLocation: true,
      projectLocationId: productionPlanLocation.locationId,
      projectLocationLabel: productionPlanLocation.locationLabel,
      distributionLocationId: productionPlanLocation.locationId,
      distributionLocationLabel: productionPlanLocation.locationLabel,
      locationId: productionPlanLocation.locationId,
      locationLabel: productionPlanLocation.locationLabel
    };
    distributionLocationPickerValue = {
      ...emptyLocationPickerValue(),
      locationId: productionPlanLocation.locationId,
      displayLabel: productionPlanLocation.locationLabel,
      mode: 'physical'
    };
  }

  function clearSameAsProductionLocation() {
    form = {
      ...form,
      sameAsProductionLocation: false,
      distributionLocationId: null,
      distributionLocationLabel: '',
      locationId: null,
      locationLabel: ''
    };
    distributionLocationPickerValue = emptyLocationPickerValue();
  }

  function valueNote(valueId: string) {
    return form.valueConsiderationNotes?.[valueId] ?? '';
  }

  function updateValueNote(valueId: string, note: string) {
    form = {
      ...form,
      valueConsiderationNotes: {
        ...(form.valueConsiderationNotes ?? {}),
        [valueId]: note
      }
    };
  }

  function validateStep(step: PlanCreationStep, target: PlanCreationForm) {
    switch (step.type) {
      case 'title':
        return !!target.title.trim();
      case 'description':
        return !!target.description.trim();
      case 'plan-overview':
        return !!target.title.trim() && !!target.description.trim();
      case 'demand-note':
        return !!target.demandConsiderationNote.trim();
      case 'location':
        if (locationPickerValue.mode === 'online' || locationPickerValue.isOnline) {
          return true;
        }
        return Boolean(target.locationLabel?.trim() || locationPickerValue.locationId);
      case 'distribution-location':
        if (target.sameAsProductionLocation) {
          return Boolean(
            target.distributionLocationId ||
              target.distributionLocationLabel?.trim() ||
              productionPlanLocation?.locationId ||
              productionPlanLocation?.locationLabel?.trim()
          );
        }
        if (distributionLocationPickerValue.mode === 'online') {
          return true;
        }
        return Boolean(
          target.distributionLocationLabel?.trim() || distributionLocationPickerValue.locationId
        );
      case 'repository':
        return !!target.repositoryUrl?.trim();
      case 'schedule-mode':
        return !!target.scheduleMode;
      case 'schedule-date':
        return !!target.scheduledDate?.trim();
      case 'schedule-range':
        return !!target.rangeStartDate?.trim() && !!target.rangeEndDate?.trim();
      case 'schedule-time':
        return !!target.startTimeLabel?.trim() && !!target.finishTimeLabel?.trim();
      case 'subtype':
        return !!target.projectSubtype;
      case 'stage-title':
        return !!target.planPhases[step.stageIndex ?? 0]?.title.trim();
      case 'stage-details':
        return !!target.planPhases[step.stageIndex ?? 0]?.details.trim();
      case 'stage-materials':
        return true;
      case 'value-note':
      case 'request-settings':
      case 'review':
        return true;
      default:
        return true;
    }
  }

  function handleBack() {
    if (stepIndex > 0) {
      stepIndex -= 1;
    }
  }

  function flushLocationIntoForm() {
    form = {
      ...form,
      locationLabel: resolvedPickerLabel(locationPickerValue),
      locationId: locationPickerValue.locationId,
      locationIsOnline: locationPickerValue.mode === 'online' || locationPickerValue.isOnline,
      distributionLocationLabel: resolvedPickerLabel(distributionLocationPickerValue),
      distributionLocationId: distributionLocationPickerValue.locationId,
      distributionLocationIsOnline:
        distributionLocationPickerValue.mode === 'online' || distributionLocationPickerValue.isOnline
    };
    if (form.sameAsProductionLocation && productionPlanLocation) {
      form = {
        ...form,
        distributionLocationId: productionPlanLocation.locationId,
        distributionLocationLabel: productionPlanLocation.locationLabel,
        locationId: productionPlanLocation.locationId,
        locationLabel: productionPlanLocation.locationLabel
      };
    }
  }

  async function handleNext() {
    if (!currentStep) {
      return;
    }

    if (isReviewStep) {
      flushLocationIntoForm();
      await onSubmit();
      return;
    }

    if (currentStep.type === 'location' || currentStep.type === 'distribution-location') {
      flushLocationIntoForm();
    }

    if (stepIndex < visibleSteps.length - 1) {
      stepIndex += 1;
    }
  }

  function handleClose() {
    stepIndex = 0;
    onCancel();
  }

  function goToStep(stepId: string) {
    const index = visibleSteps.findIndex((step) => step.id === stepId);
    if (index >= 0) {
      stepIndex = index;
    }
  }

  function scheduleSummary() {
    if (form.scheduleMode === 'range') {
      return `${form.rangeStartDate || '—'} to ${form.rangeEndDate || '—'}`;
    }
    return form.scheduledDate || '—';
  }

  function requestSettingsSummary() {
    if (!form.requestSystemEnabled) {
      return 'Disabled';
    }
    const mode =
      form.requestMode === 'calendar'
        ? 'Calendar only'
        : form.requestMode === 'direct'
          ? 'Direct only'
          : 'Calendar and direct';
    return `${mode} · ${form.allowOffScheduleRequests ? 'Off-schedule allowed' : 'Slot-bound only'}`;
  }

  $: includesRequestSettingsStep = steps.some((step) => step.type === 'request-settings');
  $: prominentValuesFromSteps = steps
    .filter((step) => step.type === 'value-note' && step.valueId)
    .map((step) => ({ id: step.valueId as string, label: step.valueLabel ?? 'Shared value' }));

  function prominentValueNotes() {
    return prominentValuesFromSteps.map((entry) => ({
      ...entry,
      note: form.valueConsiderationNotes?.[entry.id] ?? ''
    }));
  }
  $: if (!open) {
    stepIndex = 0;
  }

  function materialsForPhase(stageIndex: number) {
    return form.planPhases[stageIndex]?.materials ?? [];
  }

  function updateMaterial(stageIndex: number, materialIndex: number, value: string) {
    const phase = form.planPhases[stageIndex];
    if (!phase) {
      return;
    }

    const materials = [...(phase.materials ?? [])];
    materials[materialIndex] = value;
    phase.materials = materials;
    form = { ...form, planPhases: [...form.planPhases] };
  }
</script>

<PlanWizardShell
  {open}
  {title}
  {stepIndex}
  stepCount={visibleSteps.length}
  {nextLabel}
  {canGoBack}
  {canGoNext}
  on:close={handleClose}
  on:back={handleBack}
  on:next={handleNext}
>
  {#if stepIndex === 0}
    <div class="policy-notice-wrap">
      <DirectUsePolicyNotice variant="plan" {context} />
    </div>
  {/if}

  {#if (form.validationMessages?.length ?? 0) > 0 && isReviewStep}
    <div class="warning-card" role="alert">
      <strong>Plan could not be submitted</strong>
      <ul class="warning-list">
        {#each form.validationMessages ?? [] as message}
          <li>{message}</li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if currentStep}
    <div class="question-block">
      <h2>{currentStep.question}</h2>
      {#if currentStep.helper}
        <p class="helper-copy">{currentStep.helper}</p>
      {/if}

      {#if currentStep.type === 'title'}
        <input bind:value={form.title} maxlength="120" placeholder="Plan title" />
      {:else if currentStep.type === 'plan-overview'}
        <div class="overview-stack">
          <label>
            <span class="field-inline-label">Title</span>
            <input bind:value={form.title} maxlength="120" placeholder="Plan title" />
          </label>
          <label>
            <span class="field-inline-label">Description</span>
            <textarea bind:value={form.description} rows="5" placeholder="Describe the plan"></textarea>
          </label>
        </div>
      {:else if currentStep.type === 'description'}
        <textarea bind:value={form.description} rows="5" placeholder="Describe the plan"></textarea>
      {:else if currentStep.type === 'demand-note'}
        {#if signalSummary || signalCount != null}
          <div class="signal-card" aria-label="Current demand signals">
            <span class="signal-label">Current demand signals</span>
            {#if signalSummary}
              <strong>
                {signalSummary.demandCount} demand · {signalSummary.oppositionCount} opposition
                ({signalSummary.totalCount} total)
              </strong>
              <p class="helper-copy">
                Support share: {Math.round(signalSummary.signalRatioPercent)}%
                {#if signalSummary.usesPlatformVoteContext}
                  · sized from {signalSummary.voteContextPopulation} {signalSummary.voteContextLabel.toLowerCase()}
                {/if}
              </p>
            {:else}
              <strong>{signalCount} demand signals are active right now.</strong>
            {/if}
          </div>
        {/if}
        <textarea bind:value={form.demandConsiderationNote} rows="5" placeholder="Explain how this plan responds to demand"></textarea>
      {:else if currentStep.type === 'value-note' && currentStep.valueId}
        <textarea
          rows="4"
          value={valueNote(currentStep.valueId)}
          on:input={(event) => updateValueNote(currentStep.valueId ?? '', (event.currentTarget as HTMLTextAreaElement).value)}
          placeholder="Optional explanation for this value"
        ></textarea>
      {:else if currentStep.type === 'schedule-mode'}
        <select bind:value={form.scheduleMode}>
          <option value="date">Single date</option>
          <option value="range">Date range</option>
        </select>
      {:else if currentStep.type === 'schedule-date'}
        <input bind:value={form.scheduledDate} type="date" />
      {:else if currentStep.type === 'schedule-range'}
        <div class="field-grid">
          <label>
            <span>Start date</span>
            <input bind:value={form.rangeStartDate} type="date" />
          </label>
          <label>
            <span>End date</span>
            <input bind:value={form.rangeEndDate} type="date" />
          </label>
        </div>
      {:else if currentStep.type === 'schedule-time'}
        <div class="field-grid">
          <label>
            <span>Start time</span>
            <TimePicker bind:value={form.startTimeLabel} />
          </label>
          <label>
            <span>Finish time</span>
            <TimePicker bind:value={form.finishTimeLabel} />
          </label>
        </div>
      {:else if currentStep.type === 'location'}
        <div class="location-step">
          <LocationPicker
            bind:value={locationPickerValue}
            modes={['physical', 'online']}
            portaled
            elevated
            on:change={handleLocationChange}
          />
        </div>
      {:else if currentStep.type === 'distribution-location'}
        <div class="settings-stack location-step">
          {#if productionPlanLocation?.locationId || productionPlanLocation?.locationLabel}
            <label class="checkbox-row">
              <input
                checked={form.sameAsProductionLocation ?? false}
                type="checkbox"
                on:change={(event) => {
                  if ((event.currentTarget as HTMLInputElement).checked) {
                    applySameAsProductionLocation();
                  } else {
                    clearSameAsProductionLocation();
                  }
                }}
              />
              <span>Same as production plan location ({productionPlanLocation.locationLabel || 'selected plan'})</span>
            </label>
          {/if}
          {#if !form.sameAsProductionLocation}
            <LocationPicker
              bind:value={distributionLocationPickerValue}
              modes={['physical', 'online']}
              portaled
              elevated
              on:change={handleDistributionLocationChange}
            />
          {/if}
        </div>
      {:else if currentStep.type === 'subtype'}
        <select bind:value={form.projectSubtype}>
          {#each subtypeOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      {:else if currentStep.type === 'repository'}
        <SoftwareLicenseNotice />
        <input bind:value={form.repositoryUrl} placeholder="https://github.com/org/repo" />
      {:else if currentStep.type === 'request-settings'}
        <div class="settings-stack">
          <label class="checkbox-row">
            <input bind:checked={form.requestSystemEnabled} type="checkbox" />
            <span>Enable request system</span>
          </label>
          <label>
            <span>Request mode</span>
            <select bind:value={form.requestMode} disabled={!form.requestSystemEnabled}>
              <option value="calendar">Calendar</option>
              <option value="direct">Direct</option>
              <option value="both">Calendar and direct</option>
            </select>
          </label>
          <label class="checkbox-row">
            <input bind:checked={form.allowOffScheduleRequests} disabled={!form.requestSystemEnabled} type="checkbox" />
            <span>Allow off-schedule requests</span>
          </label>
        </div>
      {:else if currentStep.type === 'stage-title' && currentStep.stageIndex != null}
        <input bind:value={form.planPhases[currentStep.stageIndex].title} maxlength="120" placeholder="Stage title" />
      {:else if currentStep.type === 'stage-details' && currentStep.stageIndex != null}
        <textarea bind:value={form.planPhases[currentStep.stageIndex].details} rows="5" placeholder="Stage details"></textarea>
      {:else if currentStep.type === 'stage-materials' && currentStep.stageIndex != null}
        <div class="materials-stack">
          {#each materialsForPhase(currentStep.stageIndex) as material, materialIndex}
            <div class="material-row">
              <input
                value={material}
                placeholder="Material or resource"
                on:input={(event) =>
                  updateMaterial(currentStep.stageIndex ?? 0, materialIndex, (event.currentTarget as HTMLInputElement).value)}
              />
              <button class="secondary-button" type="button" on:click={() => removeMaterial(currentStep.stageIndex ?? 0, materialIndex)}>Remove</button>
            </div>
          {/each}
          <button class="secondary-button" type="button" on:click={() => addMaterial(currentStep.stageIndex ?? 0)}>Add material</button>
        </div>
      {:else if currentStep.type === 'review'}
        <div class="review-stack">
          <div class="review-row">
            <div class="review-copy">
              <strong>Title & description</strong>
              <span><strong>{form.title}</strong> — {form.description}</span>
            </div>
            <button class="text-button" type="button" on:click={() => goToStep('plan-overview')}>Edit</button>
          </div>
          {#if form.locationLabel}
            <div class="review-row">
              <div class="review-copy">
                <strong>Location</strong>
                <span>{form.locationLabel}</span>
              </div>
              <button class="text-button" type="button" on:click={() => goToStep('location')}>Edit</button>
            </div>
          {/if}
          {#if form.distributionLocationLabel || form.sameAsProductionLocation}
            <div class="review-row">
              <div class="review-copy">
                <strong>Distribution location</strong>
                <span>
                  {form.sameAsProductionLocation
                    ? `Same as production (${form.distributionLocationLabel || productionPlanLocation?.locationLabel || 'selected plan'})`
                    : form.distributionLocationLabel}
                </span>
              </div>
              <button class="text-button" type="button" on:click={() => goToStep('distribution-location')}>Edit</button>
            </div>
          {/if}
          {#if form.scheduleMode}
            <div class="review-row">
              <div class="review-copy">
                <strong>Schedule</strong>
                <span>{scheduleSummary()} · {form.startTimeLabel || '—'} – {form.finishTimeLabel || '—'}</span>
              </div>
              <button class="text-button" type="button" on:click={() => goToStep('schedule-mode')}>Edit</button>
            </div>
          {/if}
          {#if form.repositoryUrl}
            <div class="review-row">
              <div class="review-copy">
                <strong>Repository</strong>
                <span>{form.repositoryUrl}</span>
              </div>
              <button class="text-button" type="button" on:click={() => goToStep('repository')}>Edit</button>
            </div>
          {/if}
          {#if form.licenseLabel}
            <div class="review-row">
              <div class="review-copy">
                <strong>License</strong>
                <span>{form.licenseLabel}</span>
              </div>
              <button class="text-button" type="button" on:click={() => goToStep('repository')}>Edit</button>
            </div>
          {/if}
          {#if includesRequestSettingsStep}
            <div class="review-row">
              <div class="review-copy">
                <strong>Request settings</strong>
                <span>{requestSettingsSummary()}</span>
              </div>
              <button class="text-button" type="button" on:click={() => goToStep('request-settings')}>Edit</button>
            </div>
          {/if}
          <div class="review-row">
            <div class="review-copy">
              <strong>Demand response</strong>
              <span>{form.demandConsiderationNote}</span>
            </div>
            <button class="text-button" type="button" on:click={() => goToStep('demand-note')}>Edit</button>
          </div>
          {#each prominentValueNotes() as entry}
            <div class="review-row">
              <div class="review-copy">
                <strong>Value: {entry.label}</strong>
                <span>{entry.note || 'No note added'}</span>
              </div>
              <button class="text-button" type="button" on:click={() => goToStep(`value-note-${entry.id}`)}>Edit</button>
            </div>
          {/each}
          {#each form.planPhases as phase, index}
            <div class="review-stage">
              <div class="review-row">
                <div class="review-copy">
                  <strong>Stage {index + 1}: {phase.title || 'Untitled'}</strong>
                  <span>{phase.details || 'No details yet'}</span>
                  {#if phase.materials?.length}
                    <span class="materials-copy">{phase.materials.filter(Boolean).join(', ')}</span>
                  {/if}
                </div>
                <button class="text-button" type="button" on:click={() => goToStep(`stage-${index}-title`)}>Edit</button>
              </div>
            </div>
          {/each}
          <button class="secondary-button" type="button" on:click={addPlanPhase}>Add another stage</button>
        </div>
      {/if}
    </div>
  {/if}
</PlanWizardShell>

<style>
  .policy-notice-wrap {
    margin-bottom: 36px;
  }

  .question-block {
    display: grid;
    gap: 14px;
  }

  .location-step {
    display: grid;
    gap: 12px;
    min-height: 0;
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

  .signal-card {
    display: grid;
    gap: 6px;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--brand-soft) 40%, var(--panel-strong));
  }

  .signal-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--brand-strong);
  }

  .signal-card strong {
    color: var(--text-main);
    font-size: 15px;
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
  .settings-stack,
  .materials-stack,
  .overview-stack,
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

  .material-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
  }

  .review-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--panel-border);
  }

  .review-copy {
    display: grid;
    gap: 4px;
    min-width: 0;
    flex: 1;
  }

  .review-copy span,
  .materials-copy {
    color: var(--text-soft);
    line-height: 1.45;
    white-space: pre-wrap;
  }

  .materials-copy {
    font-size: 12px;
  }

  .review-stage {
    display: grid;
    gap: 0;
  }

  .text-button {
    border: none;
    background: transparent;
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
  }

  .warning-card {
    margin-bottom: 14px;
    padding: 12px;
    border: 1px solid color-mix(in srgb, var(--warning, #d97706) 35%, var(--panel-border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--warning, #d97706) 10%, var(--panel));
  }

  .warning-list {
    margin: 8px 0 0;
    padding-left: 18px;
  }

  .secondary-button {
    justify-self: start;
    min-height: 36px;
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-main);
    font-weight: 700;
    cursor: pointer;
  }

  @media (max-width: 760px) {
    .field-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
