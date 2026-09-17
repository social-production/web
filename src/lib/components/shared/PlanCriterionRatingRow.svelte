<script lang="ts">
  import type { PlanCriterionAssessment, PlanCriterionRating } from '$lib/types/detail';
  import { PLAN_RATING_OPTIONS, ratingLabel } from '$lib/utils/planRubric';

  export let criterion: PlanCriterionAssessment;
  export let selected: PlanCriterionRating | null = null;
  export let canVote = false;
  export let onSelect: (rating: PlanCriterionRating | null) => void = () => {};
</script>

<div class="criterion-row">
  <div class="criterion-copy">
    <span class="criterion-kind">{criterion.kind === 'value' ? 'Shared value' : 'Criterion'}</span>
    <strong>{criterion.label}</strong>
    <span class="criterion-meta">
      Your rating: {ratingLabel(selected)}
      {#if criterion.ratingCount > 0}
        · Avg {criterion.averageRating.toFixed(1)}/5 ({criterion.ratingCount})
      {/if}
    </span>
  </div>

  <div class="rating-row" role="group" aria-label={`Rating scale for ${criterion.label}`}>
    {#each PLAN_RATING_OPTIONS as option}
      <button
        class:selected={selected === option.value}
        class="rating-chip"
        disabled={!canVote}
        title={option.label}
        type="button"
        on:click={() => onSelect(selected === option.value ? null : option.value)}
      >
        <span class="rating-value">{option.value}</span>
        <span class="rating-label">{option.label}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .criterion-row {
    display: grid;
    gap: 8px;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--panel-strong) 82%, var(--panel));
  }

  .criterion-copy {
    display: grid;
    gap: 2px;
  }

  .criterion-kind {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--brand-strong);
  }

  strong {
    color: var(--text-main);
    font-size: 14px;
    line-height: 1.35;
  }

  .criterion-meta {
    color: var(--text-soft);
    font-size: 12px;
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
    padding: 8px 4px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    cursor: pointer;
  }

  .rating-chip:disabled {
    cursor: default;
    opacity: 0.72;
  }

  .rating-chip.selected {
    border-color: color-mix(in srgb, var(--brand) 55%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 55%, var(--panel));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 18%, transparent);
  }

  .rating-value {
    font-size: 15px;
    font-weight: 800;
    color: var(--text-main);
  }

  .rating-label {
    font-size: 9px;
    line-height: 1.2;
    text-align: center;
    color: var(--text-soft);
  }

  @media (max-width: 760px) {
    .rating-chip {
      padding: 8px 2px;
    }

    .rating-label {
      display: none;
    }
  }
</style>
