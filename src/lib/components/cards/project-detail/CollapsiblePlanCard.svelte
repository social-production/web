<script lang="ts">
  import type { EventPlan, ProjectDistributionPlan, ProjectProductionPlan } from '$lib/types/detail';

  export let plan: ProjectProductionPlan | ProjectDistributionPlan | EventPlan;
  export let expanded = false;
  export let canVote = false;
  export let canEdit = false;
  export let showRequestSystem = false;
  export let statusLabel: string | null = null;
  export let onEdit: () => void = () => {};
  export let valuevote: (planId: string, valueId: string, vote: 'yes' | 'no' | null) => void = () => {};
  export let overallvote: (planId: string, vote: 'yes' | 'no' | null) => void = () => {};

  let open = expanded;

  $: if (expanded) {
    open = true;
  }

  function nextVote(activeVote: 'yes' | 'no' | null, vote: 'yes' | 'no') {
    return activeVote === vote ? null : vote;
  }

  function handleEdit(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    onEdit();
  }

  function normalizeExternalUrl(value: string | null | undefined) {
    const trimmed = value?.trim() ?? '';

    if (!trimmed) {
      return '';
    }

    if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)) {
      return trimmed;
    }

    return `https://${trimmed}`;
  }
</script>

<details id={`vote-card-plan-${plan.id}`} bind:open={open} class="surface-card plan-card collapsible-card" class:expanded={open}>
  <summary class="collapse-toggle">
    <span class="plan-card-copy">
      <span class="plan-header">
        <strong class="plan-title">{plan.title}</strong>
        {#if 'projectSubtypeLabel' in plan}
          <span class="subtype-badge">{plan.projectSubtypeLabel}</span>
        {/if}
        {#if statusLabel}
          <span class="phase-badge complete">{statusLabel}</span>
        {/if}
      </span>
      <span class="plan-description">{plan.description}</span>
      {#if !open}
        <span class="plan-footer-meta base-footer">
          <span>Overall approval {plan.overallApproval.approvalPercent}% yes · {plan.overallApproval.yesCount} yes / {plan.overallApproval.noCount} no</span>
          <span class="author-row">
            {#if canEdit}
              <button class="vote-chip" type="button" on:click={handleEdit}>Edit plan</button>
            {/if}
            <span>{plan.authorUsername}</span>
          </span>
        </span>
      {/if}
    </span>
  </summary>

  {#if open}
    <div class="plan-phase-stack">
      {#if 'schedule' in plan}
        <div class="event-plan-meta-stack">
          <div class="event-plan-meta-item">
            <strong>Timing</strong>
            <span>{plan.schedule.label}</span>
          </div>
          <div class="event-plan-meta-item">
            <strong>Location</strong>
            <span>{plan.locationLabel}</span>
          </div>
        </div>
      {/if}

      <div class="demand-context-card">
        <strong>Demand at submission</strong>
        <span class="plan-description">
          {#if plan.demandSignalSnapshot === null}
            Legacy plan. No demand snapshot was recorded when this plan was created.
          {:else}
            {plan.demandSignalSnapshot} demand signals were active when this plan was posted.
          {/if}
        </span>
        {#if 'schedule' in plan}
          <div class="detail-copy">
            <span class="detail-section-title">Response to demand signal</span>
            <p>{plan.demandConsiderationNote}</p>
          </div>
        {:else}
          <p>{plan.demandConsiderationNote}</p>
        {/if}
      </div>

      {#each plan.planPhases as phase}
        <div class="step-card">
          <strong>Stage: {phase.title}</strong>
          <p>{phase.details}</p>
          {#if 'materialsLabel' in phase}
            <div class="plan-footer-meta">
              {#if 'materialsLabel' in phase}
                <span>{phase.materialsLabel}</span>
              {/if}
            </div>
          {/if}
        </div>
      {/each}

      {#if 'repositoryUrl' in plan}
        <div class="detail-copy">
          <span class="detail-section-title">Official repository</span>
          {#if plan.repositoryUrl}
            <a href={normalizeExternalUrl(plan.repositoryUrl)} rel="noreferrer" target="_blank">{plan.repositoryUrl}</a>
          {:else}
            <p>No repository link provided in this plan.</p>
          {/if}
        </div>
      {/if}
      {#if showRequestSystem && 'requestSystemEnabled' in plan}
        <div class="plan-footer-meta total-cost-row">
          <span>Request system</span>
          <span>{plan.requestSystemEnabled ? 'Enabled in Phase 5' : 'Disabled'}</span>
        </div>
        {#if plan.requestSystemEnabled}
          <div class="plan-footer-meta total-cost-row">
            <span>Request mode</span>
            <span>
              {plan.requestMode === 'calendar'
                ? 'Calendar only'
                : plan.requestMode === 'direct'
                  ? 'Direct only'
                  : 'Calendar and direct'}
            </span>
          </div>
          <div class="plan-footer-meta total-cost-row">
            <span>Off-schedule requests</span>
            <span>{plan.allowOffScheduleRequests ? 'Allowed' : 'Slot-bound only'}</span>
          </div>
        {/if}
      {/if}
    </div>

    <div class="evaluation-divider">
      <strong>Demand and value criteria</strong>
      <span>The evaluation zone starts with whether the plan accounts for current demand, then moves through the shared values.</span>
    </div>

    <div class="assessment-stack">
      {#each plan.valueAssessments as assessment}
        <div class="assessment-row">
          <div class="assessment-copy">
            <strong>{assessment.valueLabel}</strong>
            <span class="assessment-votes">{assessment.yesCount} yes · {assessment.noCount} no</span>
            <span class="assessment-approval">{assessment.approvalPercent}% yes</span>
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
      <span class="author-row">
        {#if canEdit}
          <button class="vote-chip" type="button" on:click={handleEdit}>Edit plan</button>
        {/if}
        <span>{plan.authorUsername}</span>
      </span>
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
  .assessment-copy,
  .event-plan-meta-stack,
  .detail-copy {
    display: grid;
    gap: 12px;
  }

  .plan-description {
    color: var(--text-soft);
    line-height: 1.45;
  }

  .event-plan-meta-item {
    display: grid;
    gap: 4px;
    color: var(--text-soft);
    line-height: 1.45;
  }

  .event-plan-meta-item strong,
  .detail-section-title {
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.02em;
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
  .demand-context-card,
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
    font-size: 17px;
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

  .assessment-votes,
  .assessment-approval {
    color: var(--text-soft);
    font-size: 12px;
  }

  .overall-actions {
    justify-content: flex-end;
    width: 100%;
  }

  .expanded-footer {
    margin-top: 2px;
  }

  .author-row {
    display: inline-flex;
    align-items: center;
    gap: 8px;
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

  .subtype-badge {
    padding: 6px 10px;
    border: 1px solid color-mix(in srgb, var(--brand) 32%, var(--panel-border));
    border-radius: 999px;
    background: color-mix(in srgb, var(--brand-soft) 65%, var(--panel));
    color: var(--brand-strong);
    font-size: 11px;
    font-weight: 700;
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