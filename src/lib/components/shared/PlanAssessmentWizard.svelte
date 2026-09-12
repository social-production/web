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
  /** Optimistic ratings so the final step unlocks before invalidateAll refreshes props. */
  let localRatings: Record<string, PlanCriterionRating | null> = {};
  let localOverallVote: ProjectApprovalVote | null | undefined = undefined;
  let ratingsSeededForOpen = false;
  let sessionAllRated = false;
  let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;

  function effectiveRating(entry: PlanCriterionAssessment): PlanCriterionRating | null {
    if (Object.prototype.hasOwnProperty.call(localRatings, entry.criterionId)) {
      return localRatings[entry.criterionId] ?? null;
    }
    return entry.activeRating;
  }

  function ratingsCoverCriteria(map: Record<string, PlanCriterionRating | null>) {
    return (
      criteria.length > 0 &&
      criteria.every((entry) => {
        if (Object.prototype.hasOwnProperty.call(map, entry.criterionId)) {
          return map[entry.criterionId] != null;
        }
        return entry.activeRating != null;
      })
    );
  }

  function firstUnratedIndex() {
    const index = criteria.findIndex((entry) => effectiveRating(entry) == null);
    return index >= 0 ? index : Math.max(0, criteria.length - 1);
  }

  function resolveInitialStep() {
    if (openAtOverallStep && includeOverallStep) {
      if (criteria.length > 0 && criteria.every((entry) => effectiveRating(entry) != null)) {
        sessionAllRated = true;
      }
      stepIndex = criteria.length;
      return;
    }

    if (initialCriterionId) {
      const index = criteria.findIndex((entry) => entry.criterionId === initialCriterionId);
      if (index >= 0) {
        stepIndex = index;
        return;
      }
    }

    if (!reviewMode && canVote) {
      const unrated = firstUnratedIndex();
      if (
        criteria.length > 0 &&
        criteria.every((entry) => effectiveRating(entry) != null) &&
        includeOverallStep
      ) {
        sessionAllRated = true;
        stepIndex = criteria.length;
        return;
      }
      stepIndex = unrated;
      return;
    }

    stepIndex = 0;
  }

  function seedLocalRatings() {
    const next: Record<string, PlanCriterionRating | null> = {};
    for (const entry of criteria) {
      next[entry.criterionId] = entry.activeRating;
    }
    localRatings = next;
    localOverallVote = undefined;
    ratingsSeededForOpen = true;
  }

  function syncLocalFromProps() {
    if (!open || !ratingsSeededForOpen) {
      return;
    }

    const next = { ...localRatings };
    for (const entry of criteria) {
      if (entry.activeRating != null) {
        next[entry.criterionId] = entry.activeRating;
      } else if (!(entry.criterionId in next)) {
        next[entry.criterionId] = entry.activeRating;
      }
    }
    localRatings = next;
  }

  onMount(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const sync = () => {
      compact = media.matches;
    };
    sync();
    media.addEventListener('change', sync);
    return () => {
      media.removeEventListener('change', sync);
      if (autoAdvanceTimer) {
        clearTimeout(autoAdvanceTimer);
      }
    };
  });

  $: criteriaStepCount = criteria.length;
  $: totalSteps = Math.max(1, criteriaStepCount + (includeOverallStep ? 1 : 0));
  $: if (open && ratingsSeededForOpen) {
    const maxStep = includeOverallStep ? criteriaStepCount : Math.max(0, criteriaStepCount - 1);
    if (stepIndex > maxStep) {
      stepIndex = maxStep;
    }
  }
  $: isOverallStep = includeOverallStep && stepIndex >= criteriaStepCount && criteriaStepCount >= 0;
  $: currentCriterion = !isOverallStep ? (criteria[stepIndex] ?? null) : null;
  $: allCriteriaRated =
    criteria.length > 0 && criteria.every((entry) => effectiveRating(entry) != null);
  $: canCastOverall = canVote && (sessionAllRated || allCriteriaRated);
  $: effectiveOverallVote =
    localOverallVote !== undefined ? localOverallVote : overallActiveVote;
  $: nextLabel = isOverallStep ? (reviewMode ? 'Close' : 'Done') : 'Next';
  $: canGoBack = stepIndex > 0;
  $: canGoNext = isOverallStep
    ? true
    : reviewMode || !canVote || (currentCriterion != null && effectiveRating(currentCriterion) != null);
  $: overallContext = plan ? getCriterionContext('rubric:achievability', plan) : null;
  $: currentContext =
    currentCriterion && plan
      ? getCriterionContext(currentCriterion.criterionId, plan, currentCriterion.label)
      : null;

  async function scrollToTop() {
    await tick();
    shell?.scrollBodyToTop();
  }

  $: if (open && !ratingsSeededForOpen) {
    seedLocalRatings();
    resolveInitialStep();
    lastScrolledStep = -1;
  }

  $: if (open && ratingsSeededForOpen) {
    syncLocalFromProps();
  }

  $: if (!open) {
    stepIndex = 0;
    lastScrolledStep = -1;
    ratingsSeededForOpen = false;
    localRatings = {};
    localOverallVote = undefined;
    sessionAllRated = false;
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
  }

  let overallVoteInFlight: Promise<void> | null = null;

  $: if (open && stepIndex !== lastScrolledStep) {
    lastScrolledStep = stepIndex;
    void scrollToTop();
  }

  function handleBack() {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
    if (stepIndex > 0) {
      stepIndex -= 1;
    }
  }

  async function handleNext() {
    if (isOverallStep) {
      handleClose();
      return;
    }

    if (stepIndex < totalSteps - 1) {
      stepIndex += 1;
    }
  }

  function handleClose() {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
    stepIndex = 0;
    ratingsSeededForOpen = false;
    localRatings = {};
    localOverallVote = undefined;
    sessionAllRated = false;
    onClose();
  }

  function selectRating(entry: PlanCriterionAssessment, rating: PlanCriterionRating) {
    if (reviewMode || !canVote) {
      return;
    }

    const previous = effectiveRating(entry);
    const nextRating = previous === rating ? null : rating;
    localRatings = {
      ...localRatings,
      [entry.criterionId]: nextRating
    };
    if (ratingsCoverCriteria(localRatings)) {
      sessionAllRated = true;
    } else if (nextRating == null) {
      sessionAllRated = false;
    }
    void onRate(entry.criterionId, nextRating);

    if (nextRating == null || autoAdvanceTimer) {
      if (autoAdvanceTimer && nextRating == null) {
        clearTimeout(autoAdvanceTimer);
        autoAdvanceTimer = null;
      }
      return;
    }

    const complete = sessionAllRated;
    const nextStep = stepIndex + 1;
    autoAdvanceTimer = setTimeout(() => {
      autoAdvanceTimer = null;
      if (complete && includeOverallStep) {
        stepIndex = criteria.length;
        return;
      }
      if (nextStep < totalSteps) {
        stepIndex = nextStep;
      }
    }, 220);
  }

  async function selectOverall(vote: ProjectApprovalVote) {
    if (reviewMode || !canCastOverall) {
      return;
    }

    const nextVote = effectiveOverallVote === vote ? null : vote;
    localOverallVote = nextVote;
    overallVoteInFlight = Promise.resolve(onOverallVote(nextVote)).finally(() => {
      overallVoteInFlight = null;
    });
    await overallVoteInFlight;

    if (nextVote != null) {
      handleClose();
    }
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
  on:dismiss={handleClose}
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
      {#if !reviewMode && !canCastOverall}
        <p class="helper-copy">Rate every criterion before the final approval vote.</p>
      {:else if reviewMode}
        <p class="helper-copy">Your final governance vote for this plan.</p>
      {:else}
        <p class="helper-copy">Cast Yes or No to finish your assessment.</p>
      {/if}

      <div class="rating-actions overall-actions">
        <button
          class:selected={effectiveOverallVote === 'yes'}
          class="vote-chip"
          disabled={reviewMode || !canCastOverall}
          type="button"
          on:click={() => selectOverall('yes')}
        >
          Yes
        </button>
        <button
          class:selected={effectiveOverallVote === 'no'}
          class="vote-chip negative"
          disabled={reviewMode || !canCastOverall}
          type="button"
          on:click={() => selectOverall('no')}
        >
          No
        </button>
      </div>
    </div>
  {:else if currentCriterion}
    {@const entry = currentCriterion}
    <div class="question-block">
      <span class="criterion-kind">{entry.kind === 'value' ? 'Shared value' : 'Criterion'}</span>
      <h2>{entry.label}</h2>
      {#if !reviewMode}
        <p class="helper-copy">1 = strongly oppose, 5 = strongly support.</p>
      {/if}

      {#if currentContext && currentContext.blocks.length > 0}
        <details class="criterion-context">
          <summary>Show plan details for this criterion</summary>
          {#each currentContext.blocks as block}
            <div class="context-block">
              <span class="context-block-label">{block.label}</span>
              <p class="context-block-value">{block.value}</p>
            </div>
          {/each}
        </details>
      {/if}

      {#if reviewMode}
        <div class="review-summary">
          <div class="review-stat">
            <span>Your rating</span>
            <strong>{ratingLabel(effectiveRating(entry))}</strong>
          </div>
          <div class="review-stat">
            <span>Community average</span>
            <strong>{entry.averageRating.toFixed(1)} / 5</strong>
            <span class="muted-copy">{entry.ratingCount} ratings</span>
          </div>
        </div>
      {:else}
        <div class="rating-row" role="group" aria-label={`Rating scale for ${entry.label}`}>
          {#each PLAN_RATING_OPTIONS as option}
            <button
              class:selected={effectiveRating(entry) === option.value}
              class="rating-chip"
              disabled={!canVote}
              title={option.label}
              type="button"
              on:click={() => selectRating(entry, option.value)}
            >
              <span class="rating-value">{option.value}</span>
              {#if !compact}
                <span class="rating-label">{option.label}</span>
              {/if}
            </button>
          {/each}
        </div>
        {#if entry.ratingCount > 0}
          <p class="muted-copy">Community average: {entry.averageRating.toFixed(1)} / 5 ({entry.ratingCount})</p>
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

  .criterion-context {
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    padding: 8px 10px;
    display: grid;
    gap: 8px;
  }

  .criterion-context summary {
    cursor: pointer;
    font-size: 12px;
    font-weight: 700;
    color: var(--text-soft);
    list-style: none;
  }

  .criterion-context summary::-webkit-details-marker {
    display: none;
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
