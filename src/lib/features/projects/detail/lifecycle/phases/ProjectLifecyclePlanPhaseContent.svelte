<script lang="ts">
  import CollapsiblePlanCard from '$lib/components/cards/project-detail/CollapsiblePlanCard.svelte';
  import RoundPlusButton from '$lib/components/shared/RoundPlusButton.svelte';
  import { isCollectiveServiceProject } from '$lib/features/projects/projectMode';
  import type { ProjectApprovalVote, ProjectPageData } from '$lib/types/detail';

  type DraftPlanPhase = {
    title: string;
    details: string;
    materialsLabel: string;
    costLabel: string;
  };

  type DraftPlanForm = {
    title: string;
    description: string;
    totalCostLabel: string;
    planPhases: DraftPlanPhase[];
    requestSystemEnabled?: boolean;
  };

  export let data: ProjectPageData;
  export let phaseId: 'phase-2' | 'phase-3' = 'phase-2';
  export let form: DraftPlanForm;
  export let showComposer = false;
  export let submitLabel = 'Submit plan';
  export let addPlanPhase: () => void = () => {};
  export let removePlanPhase: (index: number) => void = () => {};
  export let submitPlan: () => void | Promise<void> = () => {};
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

  function statusLabel(planId: string) {
    if (planId !== winningPlanId) {
      return null;
    }

    return data.lifecycle.currentPhaseId === phaseId ? 'Leading above threshold' : 'Selected';
  }
</script>

<section class="phase-surface">
  {#if canSubmitPlans}
    <div class="composer-toggle-row">
      <RoundPlusButton active={showComposer} ariaLabel="Add plan" action={() => (showComposer = !showComposer)} />
    </div>

    {#if showComposer}
      <div class="composer-card">
        <input bind:value={form.title} maxlength="120" placeholder="Plan title" />
        <textarea bind:value={form.description} rows="3" placeholder={descriptionPlaceholder()}></textarea>
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
              <input bind:value={phase.materialsLabel} maxlength="140" placeholder="Material or resource" />
              <input bind:value={phase.costLabel} maxlength="80" placeholder="Stage cost" readonly class="blocked-field" />
            </div>
          {/each}
        </div>
        <input bind:value={form.totalCostLabel} maxlength="80" placeholder="Total cost" readonly class="blocked-field" />
        {#if !isPhaseTwo && collectiveService}
          <label class="checkbox-row">
            <input bind:checked={form.requestSystemEnabled} type="checkbox" />
            <span>Allow users to request the service in Phase 5</span>
          </label>
        {/if}
        <div class="composer-actions">
          <button class="secondary-button" type="button" on:click={addPlanPhase}>Add stage</button>
        </div>
        <div class="composer-actions">
          <button class="secondary-button" type="button" on:click={() => (showComposer = false)}>Cancel</button>
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
          canVote={canVoteOnPlans}
          expanded={isExpandedPlan(plan.id)}
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
  .step-stack,
  .step-card {
    display: grid;
    gap: 12px;
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
  .empty-card,
  .step-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
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

  .blocked-field {
    color: var(--text-soft);
    cursor: not-allowed;
  }

  .checkbox-row input {
    width: auto;
    padding: 0;
  }

  .checkbox-row span,
  strong {
    color: var(--text-main);
  }
</style>