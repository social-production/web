<script lang="ts">
  import { onMount, tick } from 'svelte';
  import PlanWizardShell from '$lib/components/shared/PlanWizardShell.svelte';
  import type {
    EventPlan,
    PlanCriterionAssessment,
    PlanCriterionRating,
    ProjectApprovalVote,
    ProjectDistributionPlan,
    ProjectProductionPlan
  } from '$lib/types/detail';
  import {
    PLAN_RATING_OPTIONS,
    criterionStepIndex,
    getCriterionContext,
    ratingLabel
  } from '$lib/utils/planRubric';

  export let open = false;
  export let title = 'Assess plan';
  export let planTitle = '';
  export let plan: EventPlan | ProjectProductionPlan | ProjectDistributionPlan | null = null;
  export let criteria: PlanCriterionAssessment[] = [];
  export let reviewMode = false;
  export let canVote = false;
  export let includeOverallStep = true;
  export let initialCriterionId: string | null = null;
  export let openAtOverallStep = false;
  export let overallQuestion = 'Does this plan meet the project needs in principle?';
  export let overallActiveVote: ProjectApprovalVote | null = null;
  export let onRate: (criterionId: string, rating: PlanCriterionRating | null) => void | Promise<void> = () => {};
  export let onOverallVote: (vote: ProjectApprovalVote | null) => void | Promise<void> = () => {};
  export let onClose: () => void = () => {};

  let stepIndex = 0;
  let shell: PlanWizardShell;
  let compact = false;
  let lastScrolledStep = -1;

  function resolveInitialStep() {
    if (openAtOverallStep) {
      stepIndex = assessmentSteps.length;
      return;
    }
    if (initialCriterionId) {
      stepIndex = criterionStepIndex(initialCriterionId, criteria);
      return;
    }
    stepIndex = 0;
  }

  onMount(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const sync = () => {
      compact = media.matches;
    };
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  });

  $: assessmentSteps = criteria;
  $: totalSteps = assessmentSteps.length + (includeOverallStep ? 1 : 0);
  $: isOverallStep = includeOverallStep && stepIndex === assessmentSteps.length;
  $: currentCriterion = !isOverallStep ? assessmentSteps[stepIndex] ?? null : null;
  $: allCriteriaRated = assessmentSteps.every((entry) => entry.activeRating != null);
  $: nextLabel = isOverallStep ? (reviewMode ? 'Close' : 'Finish') : 'Next';
  $: canGoBack = stepIndex > 0;
  $: canGoNext = isOverallStep
    ? reviewMode || !canVote || overallActiveVote != null
    : reviewMode || (currentCriterion?.activeRating != null);
  $: criterionContext =
    plan && currentCriterion
      ? getCriterionContext(currentCriterion.criterionId, plan, currentCriterion.label)
      : null;
  $: overallContext = plan ? getCriterionContext('rubric:achievability', plan) : null;

  async function scrollToTop() {
    await tick();
    shell?.scrollBodyToTop();
  }

  $: if (open) {
    resolveInitialStep();
    lastScrolledStep = -1;
  }

  $: if (!open) {
    stepIndex = 0;
    lastScrolledStep = -1;
  }

  $: if (open && stepIndex !== lastScrolledStep) {
    lastScrolledStep = stepIndex;
    void scrollToTop();
  }

  function handleBack() {
    if (stepIndex > 0) {
      stepIndex -= 1;
    }
  }

  async function handleNext() {
    if (isOverallStep) {
      if (reviewMode) {
        handleClose();
        return;
      }

      if (canVote && overallActiveVote == null) {
        return;
      }

      handleClose();
      return;
    }

    if (stepIndex < totalSteps - 1) {
      stepIndex += 1;
    }
  }

  function handleClose() {
    stepIndex = 0;
    onClose();
  }

  async function selectRating(rating: PlanCriterionRating) {
    if (!currentCriterion || reviewMode || !canVote) {
      return;
    }

    const nextRating = currentCriterion.activeRating === rating ? null : rating;
    await onRate(currentCriterion.criterionId, nextRating);

    if (!reviewMode && nextRating != null && stepIndex < totalSteps - 1) {
      stepIndex += 1;
      await scrollToTop();
    }
  }

  async function selectOverall(vote: ProjectApprovalVote) {
    if (reviewMode || !canVote || !allCriteriaRated) {
      return;
    }

    const nextVote = overallActiveVote === vote ? null : vote;
    await onOverallVote(nextVote);
  }
</script>

<PlanWizardShell
  bind:this={shell}
  {open}
  title={`${title}: ${planTitle}`}
  {stepIndex}
  stepCount={totalSteps}
  {nextLabel}
  {canGoBack}
  {canGoNext}
  on:close={handleClose}
  on:back={handleBack}
  on:next={handleNext}
>
  {#if isOverallStep}
    {#if overallContext}
      <div class="context-card">
        <span class="context-label">You are assessing</span>
        <strong class="context-headline">{planTitle}</strong>
        {#each overallContext.blocks.slice(0, 2) as block}
          <div class="context-block">
            <span class="context-block-label">{block.label}</span>
            <p class="context-block-value">{block.value}</p>
          </div>
        {/each}
      </div>
    {/if}

    <div class="question-block">
      <span class="criterion-kind">Final approval</span>
      <h2>{overallQuestion}</h2>
      {#if !reviewMode && !allCriteriaRated}
        <p class="helper-copy">Rate every criterion before the final approval vote.</p>
      {:else if reviewMode}
        <p class="helper-copy">Your final governance vote for this plan.</p>
      {/if}

      <div class="rating-actions overall-actions">
        <button
          class:selected={overallActiveVote === 'yes'}
          class="vote-chip"
          disabled={reviewMode || !canVote || !allCriteriaRated}
          type="button"
          on:click={() => selectOverall('yes')}
        >
          Yes
        </button>
        <button
          class:selected={overallActiveVote === 'no'}
          class="vote-chip negative"
          disabled={reviewMode || !canVote || !allCriteriaRated}
          type="button"
          on:click={() => selectOverall('no')}
        >
          No
        </button>
      </div>
    </div>
  {:else if currentCriterion}
    {#if criterionContext}
      <div class="context-card">
        <span class="context-label">You are assessing</span>
        <strong class="context-headline">{criterionContext.headline}</strong>
        {#each criterionContext.blocks as block}
          <div class="context-block">
            <span class="context-block-label">{block.label}</span>
            <p class="context-block-value">{block.value}</p>
          </div>
        {/each}
      </div>
    {/if}

    <div class="question-block">
      <span class="criterion-kind">{currentCriterion.kind === 'value' ? 'Shared value' : 'Plan criterion'}</span>
      <h2>{currentCriterion.label}</h2>

      {#if reviewMode}
        <div class="review-summary">
          <div class="review-stat">
            <span>Your rating</span>
            <strong>{ratingLabel(currentCriterion.activeRating)}</strong>
          </div>
          <div class="review-stat">
            <span>Community average</span>
            <strong>{currentCriterion.averageRating.toFixed(1)} / 5</strong>
            <span class="muted-copy">{currentCriterion.ratingCount} ratings</span>
          </div>
        </div>
      {:else}
        <p class="helper-copy">How strongly do you agree?</p>
        <div class="rating-row" role="group" aria-label="Rating scale">
          {#each PLAN_RATING_OPTIONS as option}
            <button
              class:selected={currentCriterion.activeRating === option.value}
              class="rating-chip"
              disabled={!canVote}
              title={option.label}
              type="button"
              on:click={() => selectRating(option.value)}
            >
              <span class="rating-value">{option.value}</span>
              {#if !compact}
                <span class="rating-label">{option.label}</span>
              {/if}
            </button>
          {/each}
        </div>
        {#if currentCriterion.ratingCount > 0}
          <p class="muted-copy">Community average: {currentCriterion.averageRating.toFixed(1)} / 5 ({currentCriterion.ratingCount})</p>
        {/if}
      {/if}
    </div>
  {/if}
</PlanWizardShell>

<style>
  .context-card {
    display: grid;
    gap: 8px;
    margin-bottom: 14px;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--panel-strong) 80%, var(--panel));
  }

  .context-label,
  .context-block-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-soft);
  }

  .context-headline {
    font-size: 15px;
    line-height: 1.35;
    color: var(--text-main);
  }

  .context-block {
    display: grid;
    gap: 4px;
  }

  .context-block-value {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
    color: var(--text-soft);
    white-space: pre-wrap;
  }

  .question-block {
    display: grid;
    gap: 12px;
  }

  .criterion-kind {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--brand-strong);
  }

  h2 {
    margin: 0;
    font-size: 20px;
    line-height: 1.3;
    letter-spacing: -0.02em;
  }

  .helper-copy,
  .muted-copy {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.5;
    font-size: 13px;
  }

  .rating-row {
    display: flex;
    gap: 6px;
    flex-wrap: nowrap;
  }

  .rating-chip {
    flex: 1 1 0;
    min-width: 0;
    display: grid;
    gap: 2px;
    justify-items: center;
    padding: 10px 4px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    cursor: pointer;
  }

  .rating-chip.selected {
    border-color: color-mix(in srgb, var(--brand) 55%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 55%, var(--panel));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 18%, transparent);
  }

  .rating-value {
    font-size: 16px;
    font-weight: 800;
    color: var(--text-main);
  }

  .rating-label {
    font-size: 10px;
    line-height: 1.2;
    text-align: center;
    color: var(--text-soft);
  }

  .review-summary {
    display: grid;
    gap: 10px;
  }

  .review-stat {
    display: grid;
    gap: 4px;
    padding: 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .overall-actions,
  .rating-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .vote-chip {
    min-width: 88px;
    min-height: 40px;
    padding: 8px 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    font-weight: 700;
    cursor: pointer;
  }

  .vote-chip.selected {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .vote-chip.negative.selected {
    border-color: var(--tablet-community-bg);
    background: color-mix(in srgb, var(--tablet-community-bg) 18%, var(--panel));
    color: var(--tablet-community-text);
  }

  .vote-chip:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
</style>
