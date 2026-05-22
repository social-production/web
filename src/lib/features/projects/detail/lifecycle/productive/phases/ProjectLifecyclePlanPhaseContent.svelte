<script lang="ts">
  import CollapsiblePlanCard from '$lib/components/cards/project-detail/CollapsiblePlanCard.svelte';
  import RoundPlusButton from '$lib/components/shared/RoundPlusButton.svelte';
  import {
    isCollectiveServiceProject,
    projectSubtypeOptions
  } from '$lib/features/projects/projectMode';
  import type { ProjectApprovalVote, ProjectPageData } from '$lib/types/detail';
  import type { ProjectSubtype } from '$lib/types/feed';

  type DraftPlanPhase = {
    title: string;
    details: string;
    materials: string[];
  };

  type DraftPlanForm = {
    title: string;
    description: string;
    projectSubtype?: ProjectSubtype;
    repositoryUrl?: string;
    demandConsiderationNote: string;
    planPhases: DraftPlanPhase[];
    requestSystemEnabled?: boolean;
    requestMode?: 'calendar' | 'direct' | 'both';
    allowOffScheduleRequests?: boolean;
    validationMessages?: string[];
  };

  export let data: ProjectPageData;
  export let phaseId: 'phase-2' | 'phase-3' = 'phase-2';
  export let form: DraftPlanForm;
  export let showComposer = false;
  export let submitLabel = 'Submit plan';
  export let addPlanPhase: () => void = () => {};
  export let removePlanPhase: (index: number) => void = () => {};
  export let submitPlan: () => void | Promise<void> = () => {};
  export let editingPlanId: string | null = null;
  export let startEditingPlan: (planId: string) => void | Promise<void> = () => {};
  export let cancelEditingPlan: () => void | Promise<void> = () => {};
  export let isExpandedPlan: (planId: string) => boolean = () => false;
  export let valuevote: (planId: string, valueId: string, vote: ProjectApprovalVote | null) => void = () => {};
  export let overallvote: (planId: string, vote: ProjectApprovalVote | null) => void = () => {};

  $: isPhaseTwo = phaseId === 'phase-2';
  $: collectiveService = isCollectiveServiceProject(data.projectMode);
  $: plans = isPhaseTwo ? data.lifecycle.phaseTwo.plans : data.lifecycle.phaseThree.plans;
  $: canSubmitPlans = isPhaseTwo
    ? data.lifecycle.phaseTwo.viewerCanSubmitPlans
    : data.lifecycle.phaseThree.viewerCanSubmitPlans;
  $: canVoteOnPlans = isPhaseTwo
    ? data.lifecycle.phaseTwo.viewerCanVoteOnPlans
    : data.lifecycle.phaseThree.viewerCanVoteOnPlans;
  $: winningPlanId = isPhaseTwo
    ? data.lifecycle.phaseTwo.winningPlanId
    : data.lifecycle.phaseThree.winningPlanId;
  $: subtypeOptions = projectSubtypeOptions(data.projectMode);
  $: selectedSubtype = form.projectSubtype ?? data.lifecycle.currentSubtype ?? 'standard';

  function emptyCopy() {
    if (isPhaseTwo) {
      return `No ${collectiveService ? 'operations' : 'production'} plans submitted yet.`;
    }

    return `No ${collectiveService ? 'access' : 'distribution'} plans submitted yet.`;
  }

  function descriptionPlaceholder() {
    if (isPhaseTwo) {
      return collectiveService ? 'Describe the overall operating plan.' : 'Describe the overall production plan.';
    }

    return collectiveService ? 'Describe the overall access plan.' : 'Describe the overall distribution plan.';
  }

  function demandPlaceholder() {
    return 'Explain whether this plan meets the current demand signal. If it does not, explain the gap and why.';
  }

  function statusLabel(planId: string) {
    if (planId !== winningPlanId) {
      return null;
    }

    return data.lifecycle.currentPhaseId === phaseId ? 'Leading above threshold' : 'Selected';
  }

  function toggleComposer() {
    if (showComposer && editingPlanId) {
      cancelEditingPlan();
      return;
    }

    showComposer = !showComposer;
  }

  function addMaterial(index: number) {
    const target = form.planPhases[index];

    if (!target) {
      return;
    }

    target.materials = [...target.materials, ''];
    form = { ...form };
  }

  function removeMaterial(phaseIndex: number, materialIndex: number) {
    const target = form.planPhases[phaseIndex];

    if (!target) {
      return;
    }

    target.materials = target.materials.filter((_, index) => index !== materialIndex);
    form = { ...form };
  }
</script>

<section class="phase-surface">
  {#if canSubmitPlans}
    <div class="composer-toggle-row">
      <RoundPlusButton
        active={showComposer}
        ariaLabel={editingPlanId ? 'Edit plan' : 'Add plan'}
        action={toggleComposer}
      />
    </div>

    {#if showComposer}
      <div class="composer-card">
        <div class="step-header-row">
          <strong>{editingPlanId ? 'Editing plan' : 'New plan'}</strong>
        </div>

        {#if (form.validationMessages?.length ?? 0) > 0}
          <div class="warning-card" role="alert">
            <strong>Plan could not be submitted</strong>
            <ul class="warning-list">
              {#each form.validationMessages ?? [] as message}
                <li>{message}</li>
              {/each}
            </ul>
          </div>
        {/if}

        <input bind:value={form.title} maxlength="120" placeholder="Plan title" />
        <textarea bind:value={form.description} rows="3" placeholder={descriptionPlaceholder()}></textarea>
        {#if isPhaseTwo}
          <label>
            <span class="field-inline-label">Subtype</span>
            <select bind:value={form.projectSubtype}>
              {#each subtypeOptions as option}
                <option disabled={option.disabled} value={option.value}>{option.label}</option>
              {/each}
            </select>
          </label>
          {#if selectedSubtype === 'software'}
            <input bind:value={form.repositoryUrl} maxlength="240" placeholder="Official repository URL" />
          {/if}
        {/if}
        <div class="demand-context-card">
          <strong>Current demand signal</strong>
          <span>{data.signalCount} demand signals are active right now.</span>
          <span>State whether this plan actually meets that demand and, if not, why it still falls short.</span>
        </div>
        <textarea bind:value={form.demandConsiderationNote} rows="3" placeholder={demandPlaceholder()}></textarea>
        <div class="step-stack">
          {#each form.planPhases as phase, index}
            <div class="step-card">
              <div class="step-header-row">
                <strong>Stage {index + 1}</strong>
                {#if form.planPhases.length > 1}
                  <button class="secondary-button" type="button" on:click={() => removePlanPhase(index)}>
                    Remove
                  </button>
                {/if}
              </div>
              <input bind:value={phase.title} maxlength="120" placeholder="Stage title" />
              <textarea bind:value={phase.details} rows="2" placeholder="Stage description"></textarea>
              <div class="materials-stack">
                {#if phase.materials.length === 0}
                  <span class="material-empty-copy">No materials added yet.</span>
                {/if}
                {#each phase.materials as _, materialIndex}
                  <div class="material-row">
                    <input
                      bind:value={phase.materials[materialIndex]}
                      maxlength="140"
                      placeholder={`Material ${materialIndex + 1}`}
                    />
                    <button
                      class="secondary-button"
                      type="button"
                      on:click={() => removeMaterial(index, materialIndex)}
                    >
                      Remove
                    </button>
                  </div>
                {/each}
                <button class="secondary-button" type="button" on:click={() => addMaterial(index)}>
                  Add material
                </button>
              </div>
            </div>
          {/each}
        </div>
        {#if !isPhaseTwo && collectiveService}
          <label class="checkbox-row">
            <input bind:checked={form.requestSystemEnabled} type="checkbox" />
            <span>Allow users to request the service in Phase 5</span>
          </label>
          {#if form.requestSystemEnabled}
            <label>
              <span class="field-inline-label">Request mode</span>
              <select bind:value={form.requestMode}>
                <option value="calendar">Scheduled slots only</option>
                <option value="direct">Message requests only</option>
                <option value="both">Scheduled slots and message requests</option>
              </select>
            </label>
            <label class="checkbox-row">
              <input bind:checked={form.allowOffScheduleRequests} type="checkbox" />
              <span>Allow message requests when no slot is listed</span>
            </label>
          {/if}
        {/if}
        <div class="composer-actions">
          <button class="secondary-button" type="button" on:click={addPlanPhase}>Add stage</button>
        </div>
        <div class="composer-actions">
          <button
            class="secondary-button"
            type="button"
            on:click={() => {
              if (editingPlanId) {
                cancelEditingPlan();
              } else {
                showComposer = false;
              }
            }}
          >
            Cancel
          </button>
          <button class="primary-button" type="button" on:click={submitPlan}>{submitLabel}</button>
        </div>
      </div>
    {/if}
  {/if}

  <div class="surface-stack">
    {#if plans.length === 0}
      <div class="empty-card">{emptyCopy()}</div>
    {:else}
      {#each plans as plan}
        <CollapsiblePlanCard
          canEdit={isPhaseTwo && 'viewerCanEdit' in plan && !!plan.viewerCanEdit}
          canVote={canVoteOnPlans}
          expanded={isExpandedPlan(plan.id)}
          onEdit={() => startEditingPlan(plan.id)}
          showRequestSystem={!isPhaseTwo && collectiveService}
          {plan}
          statusLabel={statusLabel(plan.id)}
          {valuevote}
          {overallvote}
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
  .demand-context-card,
  .materials-stack,
  .step-stack,
  .step-card {
    display: grid;
    gap: 12px;
  }

  .material-row {
    display: grid;
    gap: 8px;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }

  .material-empty-copy {
    color: var(--text-soft);
    font-size: 12px;
  }

  .composer-toggle-row,
  .composer-actions,
  .step-header-row,
  .checkbox-row {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .composer-toggle-row {
    justify-content: center;
  }

  .step-header-row {
    justify-content: space-between;
  }

  .composer-card,
  .demand-context-card,
  .empty-card,
  .step-card {
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

  .empty-card {
    color: var(--text-soft);
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

  .checkbox-row input {
    width: auto;
    padding: 0;
  }

  .checkbox-row span,
  .demand-context-card span,
  .field-inline-label,
  strong {
    color: var(--text-main);
  }

  .field-inline-label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 700;
  }
</style>