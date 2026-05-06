<script lang="ts">
  import type { ProjectDistributionPlan, ProjectProductionPlan } from '$lib/types/detail';

  export let plan: ProjectProductionPlan | ProjectDistributionPlan;
  export let expanded = false;
  export let canVote = false;
  export let showRequestSystem = false;
  export let statusLabel: string | null = null;
  export let valuevote: (planId: string, valueId: string, vote: 'yes' | 'no' | null) => void = () => {};
  export let overallvote: (planId: string, vote: 'yes' | 'no' | null) => void = () => {};

  let open = expanded;

  function nextVote(activeVote: 'yes' | 'no' | null, vote: 'yes' | 'no') {
    return activeVote === vote ? null : vote;
  }
</script>

<details bind:open={open} class="surface-card plan-card collapsible-card" class:expanded={open}>
  <summary class="collapse-toggle">
    <span class="plan-card-copy">
      <span class="plan-header">
        <strong class="plan-title">{plan.title}</strong>
        {#if statusLabel}
          <span class="phase-badge complete">{statusLabel}</span>
        {/if}
      </span>
      <span class="plan-description">{plan.description}</span>
      {#if !open}
        <span class="plan-footer-meta base-footer">
          <span>Overall approval {plan.overallApproval.approvalPercent}% yes · {plan.overallApproval.yesCount} yes / {plan.overallApproval.noCount} no</span>
          <span>{plan.authorUsername}</span>
        </span>
      {/if}
    </span>
  </summary>

  {#if open}
    <div class="plan-phase-stack">
      {#each plan.planPhases as phase}
        <div class="step-card">
          <strong>Stage: {phase.title}</strong>
          <p>{phase.details}</p>
          <div class="plan-footer-meta">
            <span>{phase.materialsLabel}</span>
            <span>{phase.costLabel}</span>
          </div>
        </div>
      {/each}
      <div class="plan-footer-meta total-cost-row">
        <span>Total cost</span>
        <span>{plan.totalCostLabel}</span>
      </div>
      {#if showRequestSystem && 'requestSystemEnabled' in plan}
        <div class="plan-footer-meta total-cost-row">
          <span>Request system</span>
          <span>{plan.requestSystemEnabled ? 'Enabled in Phase 5' : 'Disabled'}</span>
        </div>
      {/if}
    </div>

    <div class="evaluation-divider">
      <strong>Value criteria</strong>
      <span>The evaluation zone starts here, after the plan itself and its total cost.</span>
    </div>

    <div class="assessment-stack">
      {#each plan.valueAssessments as assessment}
        <div class="assessment-row">
          <div class="assessment-copy">
            <strong>{assessment.valueLabel}</strong>
            <span>{assessment.approvalPercent}% yes · {assessment.yesCount} yes / {assessment.noCount} no</span>
          </div>
          <div class="assessment-actions">
            <button
              class:selected={assessment.activeVote === 'yes'}
              class="vote-chip"
              disabled={!canVote}
              type="button"
              on:click={() => valuevote(plan.id, assessment.valueId, nextVote(assessment.activeVote, 'yes'))}
            >
              Yes
            </button>
            <button
              class:selected={assessment.activeVote === 'no'}
              class="vote-chip negative"
              disabled={!canVote}
              type="button"
              on:click={() => valuevote(plan.id, assessment.valueId, nextVote(assessment.activeVote, 'no'))}
            >
              No
            </button>
          </div>
        </div>
      {/each}
    </div>

    <div class="overall-actions-row">
      <div class="binary-row overall-actions">
        <button
          class:selected={plan.overallApproval.activeVote === 'yes'}
          class="vote-chip"
          disabled={!canVote}
          type="button"
          on:click={() => overallvote(plan.id, nextVote(plan.overallApproval.activeVote, 'yes'))}
        >
          Approve
        </button>
        <button
          class:selected={plan.overallApproval.activeVote === 'no'}
          class="vote-chip negative"
          disabled={!canVote}
          type="button"
          on:click={() => overallvote(plan.id, nextVote(plan.overallApproval.activeVote, 'no'))}
        >
          Reject
        </button>
      </div>
    </div>

    <div class="plan-footer-meta base-footer expanded-footer">
      <span>Overall approval {plan.overallApproval.approvalPercent}% yes · {plan.overallApproval.yesCount} yes / {plan.overallApproval.noCount} no</span>
      <span>{plan.authorUsername}</span>
    </div>
  {/if}
</details>

<style>
  .plan-card {
    padding: 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    display: grid;
    gap: 12px;
    transition: border-color 0.12s ease, box-shadow 0.12s ease;
  }

  .plan-card:hover,
  .plan-card.expanded {
    border-color: color-mix(in srgb, var(--brand) 40%, var(--panel-border));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 25%, transparent);
  }

  .collapse-toggle {
    width: 100%;
    list-style: none;
    padding: 0;
    border: 0;
    background: transparent;
    text-align: left;
    cursor: pointer;
  }

  .collapse-toggle::-webkit-details-marker {
    display: none;
  }

  .plan-card-copy,
  .plan-phase-stack,
  .assessment-copy {
    display: grid;
    gap: 12px;
  }

  .plan-description {
    color: var(--text-soft);
    line-height: 1.45;
  }

  .plan-title {
    color: var(--text-main);
  }

  .plan-header,
  .plan-footer-meta,
  .binary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .plan-footer-meta {
    font-size: 12px;
    color: var(--text-soft);
  }

  .base-footer {
    padding-top: 8px;
    border-top: 1px solid var(--panel-border);
  }

  .total-cost-row {
    padding-top: 8px;
    border-top: 1px solid var(--panel-border);
  }

  .evaluation-divider,
  .step-card,
  .assessment-row,
  .overall-actions-row {
    display: grid;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid var(--panel-border);
  }

  .evaluation-divider {
    margin-top: 4px;
    padding-top: 14px;
    gap: 4px;
  }

  .evaluation-divider strong {
    color: var(--text-main);
    font-size: 13px;
    letter-spacing: 0.02em;
  }

  .evaluation-divider span {
    color: var(--text-soft);
    font-size: 12px;
  }

  .assessment-actions {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .overall-actions {
    justify-content: flex-end;
    width: 100%;
  }

  .expanded-footer {
    margin-top: 2px;
  }

  .phase-badge {
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel);
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
    width: fit-content;
    justify-self: end;
  }

  .phase-badge.complete {
    border-color: color-mix(in srgb, var(--brand) 40%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 75%, var(--panel));
    color: var(--brand-strong);
  }

  .vote-chip {
    padding: 7px 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
  }

  .vote-chip.selected {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .vote-chip.negative.selected {
    border-color: var(--tablet-community-bg);
    background: color-mix(in srgb, var(--tablet-community-bg) 16%, var(--panel));
    color: var(--tablet-community-text);
  }
</style>