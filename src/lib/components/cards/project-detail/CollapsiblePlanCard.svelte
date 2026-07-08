<script lang="ts">
  import PlanAssessmentWizard from '$lib/components/shared/PlanAssessmentWizard.svelte';
  import type {
    EventPlan,
    PlanCriterionRating,
    ProjectDistributionPlan,
    ProjectProductionPlan
  } from '$lib/types/detail';
  import { allCriteriaRated } from '$lib/utils/planRubric';
  import { formatEventPlanSchedule, formatRelativeTime } from '$lib/utils/time';

  export let plan: ProjectProductionPlan | ProjectDistributionPlan | EventPlan;
  export let expanded = false;
  export let canVote = false;
  export let canEdit = false;
  export let showRequestSystem = false;
  export let statusLabel: string | null = null;
  export let autoOpenAssessment = false;
  export let autoAssessCriterionId: string | null = null;
  export let onEdit: () => void = () => {};
  export let overallvote: (planId: string, vote: 'yes' | 'no' | null) => void = () => {};
  export let criterionvote: (
    planId: string,
    criterionId: string,
    rating: PlanCriterionRating | null
  ) => void | Promise<void> = () => {};

  let open = expanded;
  let assessmentOpen = false;
  let reviewMode = false;
  let initialCriterionId: string | null = null;
  let openAtOverallStep = false;
  let didAutoOpen = false;

  $: if (expanded) {
    open = true;
  }

  $: scheduleLabel = 'schedule' in plan ? formatEventPlanSchedule(plan.schedule) : '';
  $: valueNotes = plan.valueConsiderationNotes ?? {};
  $: criteria = plan.criterionAssessments ?? [];
  $: authorValueCommentaryEntries = Object.entries(valueNotes)
    .filter(([, note]) => note?.trim())
    .map(([valueId, note]) => ({ valueId, note: note.trim() }));
  $: allCriteriaComplete = allCriteriaRated(criteria);
  $: ratedCount = criteria.filter((entry) => entry.activeRating != null).length;
  $: hasCompletedAssessment = allCriteriaComplete && plan.overallApproval.activeVote != null;
  $: pendingCriterionCount = criteria.length - ratedCount;

  $: if (!autoOpenAssessment) {
    didAutoOpen = false;
  }

  $: if (autoOpenAssessment && open && !didAutoOpen) {
    didAutoOpen = true;
    openAssessmentWizard({ criterionId: autoAssessCriterionId });
  }

  function openAssessmentWizard(
    options: { review?: boolean; criterionId?: string | null; openAtOverall?: boolean } = {}
  ) {
    reviewMode = Boolean(options.review);
    initialCriterionId = options.criterionId ?? null;
    openAtOverallStep = Boolean(options.openAtOverall);
    assessmentOpen = true;
  }

  function closeAssessmentWizard() {
    assessmentOpen = false;
    reviewMode = false;
    initialCriterionId = null;
    openAtOverallStep = false;
  }

  async function handleCriterionRate(criterionId: string, rating: PlanCriterionRating | null) {
    await criterionvote(plan.id, criterionId, rating);
  }

  async function handleOverallVote(vote: 'yes' | 'no' | null) {
    await overallvote(plan.id, vote);
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
        {#if canVote && criteria.length > 0}
          <span class="rating-progress">{ratedCount}/{criteria.length} rated</span>
        {/if}
      </span>
      <span class="plan-description">{plan.description}</span>
      {#if scheduleLabel}
        <span class="plan-schedule-preview">{scheduleLabel}</span>
      {/if}
      {#if !open}
        <span class="plan-footer-meta base-footer">
          <span>{plan.overallApproval.approvalPercent}% approved</span>
          <span class="author-row">
            {#if canEdit}
              <button class="text-button" type="button" on:click={handleEdit}>Edit</button>
            {/if}
            <span>{plan.authorUsername} · {formatRelativeTime(plan.createdAt)}</span>
          </span>
        </span>
      {/if}
    </span>
  </summary>

  {#if open}
    <div class="plan-body">
      {#if 'schedule' in plan}
        <div class="meta-row">
          <span class="meta-label">Timing</span>
          <span>{scheduleLabel || plan.schedule.label}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Location</span>
          <span>{plan.locationLabel}</span>
        </div>
      {/if}

      {#if plan.demandConsiderationNote?.trim()}
        <div class="meta-block">
          <span class="meta-label">Demand response</span>
          <p>{plan.demandConsiderationNote}</p>
        </div>
      {/if}

      {#if authorValueCommentaryEntries.length > 0}
        <div class="meta-block">
          <span class="meta-label">Author notes on values</span>
          {#each authorValueCommentaryEntries as entry (entry.valueId)}
            <p class="value-note">{entry.note}</p>
          {/each}
        </div>
      {/if}

      <div class="stage-timeline">
        {#each plan.planPhases as phase, index}
          <article class="stage-card">
            <span class="stage-index">Stage {index + 1}</span>
            <strong>{phase.title}</strong>
            <p>{phase.details}</p>
            {#if 'materialsLabel' in phase && phase.materialsLabel}
              <span class="stage-materials">{phase.materialsLabel}</span>
            {/if}
          </article>
        {/each}
      </div>

      {#if 'repositoryUrl' in plan && plan.repositoryUrl}
        <div class="meta-row">
          <span class="meta-label">Repository</span>
          <a href={normalizeExternalUrl(plan.repositoryUrl)} rel="noreferrer" target="_blank">{plan.repositoryUrl}</a>
        </div>
      {/if}

      {#if showRequestSystem && 'requestSystemEnabled' in plan && plan.requestSystemEnabled}
        <div class="meta-row">
          <span class="meta-label">Requests</span>
          <span>
            {plan.requestMode === 'calendar'
              ? 'Calendar only'
              : plan.requestMode === 'direct'
                ? 'Direct only'
                : 'Calendar and direct'}
            · {plan.allowOffScheduleRequests ? 'Off-schedule allowed' : 'Slot-bound only'}
          </span>
        </div>
      {/if}
    </div>

    <div class="assessment-bar">
      {#if canVote}
        {#if !allCriteriaComplete}
          <button class="primary-button" type="button" data-participation-action="assess-plan" on:click={() => openAssessmentWizard()}>
            {pendingCriterionCount > 0 ? `Assess plan (${pendingCriterionCount} left)` : 'Finish approval'}
          </button>
        {:else if plan.overallApproval.activeVote == null}
          <button
            class="primary-button"
            type="button"
            on:click={() => openAssessmentWizard({ openAtOverall: true })}
          >
            Cast final approval
          </button>
        {:else}
          <button class="secondary-button" type="button" on:click={() => openAssessmentWizard({ review: false })}>
            Change ratings
          </button>
          <button class="secondary-button" type="button" on:click={() => openAssessmentWizard({ review: true })}>
            Review ratings
          </button>
        {/if}
      {:else if hasCompletedAssessment}
        <button class="secondary-button" type="button" on:click={() => openAssessmentWizard({ review: true })}>
          Review ratings
        </button>
      {/if}
      <span class="approval-summary">
        {plan.overallApproval.approvalPercent}% approved
      </span>
    </div>

    <PlanAssessmentWizard
      open={assessmentOpen}
      {plan}
      planTitle={plan.title}
      {criteria}
      {reviewMode}
      {canVote}
      {initialCriterionId}
      {openAtOverallStep}
      overallActiveVote={plan.overallApproval.activeVote}
      onRate={handleCriterionRate}
      onOverallVote={handleOverallVote}
      onClose={closeAssessmentWizard}
    />

    <div class="plan-footer-meta">
      {#if canEdit}
        <button class="text-button" type="button" on:click={handleEdit}>Edit plan</button>
      {/if}
      <span>{plan.authorUsername} · {formatRelativeTime(plan.createdAt)}</span>
    </div>
  {/if}
</details>

<style>
  .plan-card {
    padding: 12px 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    display: grid;
    gap: 10px;
    transition: border-color 0.12s ease;
  }

  .plan-card:hover,
  .plan-card.expanded {
    border-color: color-mix(in srgb, var(--brand) 35%, var(--panel-border));
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
  .plan-body {
    display: grid;
    gap: 10px;
  }

  .plan-header {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .plan-title {
    color: var(--text-main);
    font-size: 15px;
  }

  .plan-description,
  .plan-schedule-preview,
  .approval-summary,
  .meta-row span:last-child,
  .meta-block p,
  .value-note,
  .stage-card p {
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.45;
  }

  .plan-schedule-preview {
    font-size: 12px;
  }

  .rating-progress {
    padding: 4px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--brand-soft) 60%, var(--panel));
    color: var(--brand-strong);
    font-size: 11px;
    font-weight: 700;
  }

  .subtype-badge,
  .phase-badge {
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
  }

  .subtype-badge {
    border: 1px solid color-mix(in srgb, var(--brand) 32%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 65%, var(--panel));
    color: var(--brand-strong);
  }

  .phase-badge.complete {
    border: 1px solid color-mix(in srgb, var(--brand) 40%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 75%, var(--panel));
    color: var(--brand-strong);
  }

  .plan-footer-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 12px;
    color: var(--text-soft);
    padding-top: 8px;
    border-top: 1px solid var(--panel-border);
  }

  .base-footer {
    margin-top: 4px;
  }

  .meta-row,
  .meta-block {
    display: grid;
    gap: 4px;
  }

  .meta-label,
  .stage-index {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--text-soft);
  }

  .meta-block p,
  .value-note {
    margin: 0;
  }

  .stage-timeline {
    display: grid;
    gap: 8px;
  }

  .stage-card {
    display: grid;
    gap: 4px;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .stage-card strong {
    color: var(--text-main);
    font-size: 14px;
  }

  .stage-materials {
    font-size: 12px;
    color: var(--text-soft);
  }

  .assessment-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding-top: 10px;
    border-top: 1px solid var(--panel-border);
  }

  .primary-button,
  .secondary-button {
    min-height: 34px;
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }

  .primary-button {
    border: 1px solid color-mix(in srgb, var(--brand) 55%, var(--panel-border));
    background: var(--brand);
    color: var(--brand-contrast, #fff);
  }

  .secondary-button {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    color: var(--text-main);
  }

  .text-button {
    border: none;
    background: transparent;
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    padding: 0;
  }

  .author-row {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
</style>
