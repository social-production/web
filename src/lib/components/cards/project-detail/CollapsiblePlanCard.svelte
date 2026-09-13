<script lang="ts">
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
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

  let sheetOpen = false;
  let assessmentOpen = false;
  let reviewMode = false;
  let initialCriterionId: string | null = null;
  let openAtOverallStep = false;
  let didAutoOpen = false;
  let Wizard: typeof import('$lib/components/shared/PlanAssessmentWizard.svelte').default | null =
    null;

  async function ensureWizard() {
    if (!Wizard) {
      Wizard = (await import('$lib/components/shared/PlanAssessmentWizard.svelte')).default;
    }
  }

  // Optimistic mirror of ratings/votes cast in the wizard so the action bar updates
  // immediately instead of waiting for the detail invalidate to land.
  let localRatings: Record<string, PlanCriterionRating | null> = {};
  let localOverallVote: 'yes' | 'no' | null | undefined = undefined;
  let lastPlanId = plan.id;

  $: if (plan.id !== lastPlanId) {
    lastPlanId = plan.id;
    localRatings = {};
    localOverallVote = undefined;
    sheetOpen = false;
  }

  $: scheduleLabel = 'schedule' in plan ? formatEventPlanSchedule(plan.schedule) : '';
  $: valueNotes = plan.valueConsiderationNotes ?? {};
  $: criteria = (plan.criterionAssessments ?? []).map((entry) =>
    Object.prototype.hasOwnProperty.call(localRatings, entry.criterionId)
      ? { ...entry, activeRating: localRatings[entry.criterionId] ?? null }
      : entry
  );
  $: effectiveOverallVote =
    localOverallVote !== undefined ? localOverallVote : plan.overallApproval.activeVote;
  $: authorValueCommentaryEntries = Object.entries(valueNotes)
    .filter(([, note]) => note?.trim())
    .map(([valueId, note]) => ({ valueId, note: note.trim() }));
  $: allCriteriaComplete = allCriteriaRated(criteria);
  $: ratedCount = criteria.filter((entry) => entry.activeRating != null).length;
  $: hasCompletedAssessment = allCriteriaComplete && effectiveOverallVote != null;
  $: pendingCriterionCount = criteria.length - ratedCount;
  $: assessedCriteria = criteria.filter((entry) => entry.ratingCount > 0);
  $: planAverageRating =
    typeof plan.averageRating === 'number' && plan.averageRating > 0
      ? plan.averageRating
      : assessedCriteria.length > 0
        ? assessedCriteria.reduce((sum, entry) => sum + entry.averageRating, 0) / assessedCriteria.length
        : null;
  $: leading = plan.isLeading || plan.leaderStatus === 'leading';
  $: compactChip = statusLabel || (leading ? 'Leading' : null);

  $: if (!autoOpenAssessment && !assessmentOpen) {
    didAutoOpen = false;
  }

  $: if (autoOpenAssessment && !didAutoOpen) {
    didAutoOpen = true;
    sheetOpen = true;
    if (!assessmentOpen) {
      openAssessmentWizard({
        criterionId: autoAssessCriterionId,
        openAtOverall: !autoAssessCriterionId && allCriteriaComplete
      });
    }
  }

  function openAssessmentWizard(
    options: { review?: boolean; criterionId?: string | null; openAtOverall?: boolean } = {}
  ) {
    reviewMode = Boolean(options.review);
    initialCriterionId = options.criterionId ?? null;
    openAtOverallStep = Boolean(options.openAtOverall);
    assessmentOpen = true;
    void ensureWizard();
  }

  function closeAssessmentWizard() {
    assessmentOpen = false;
    reviewMode = false;
    initialCriterionId = null;
    openAtOverallStep = false;
  }

  async function handleCriterionRate(criterionId: string, rating: PlanCriterionRating | null) {
    localRatings = { ...localRatings, [criterionId]: rating };
    await criterionvote(plan.id, criterionId, rating);
  }

  async function handleOverallVote(vote: 'yes' | 'no' | null) {
    localOverallVote = vote;
    await overallvote(plan.id, vote);
  }

  function handleEdit() {
    sheetOpen = false;
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

<button
  id={`vote-card-plan-${plan.id}`}
  class="surface-card plan-card"
  class:leading
  class:open={sheetOpen}
  type="button"
  on:click={() => (sheetOpen = true)}
>
  <span class="plan-header">
    <strong class="plan-title">{plan.title}</strong>
    {#if compactChip}
      <span class="phase-badge complete">{compactChip}</span>
    {/if}
  </span>
  {#if plan.description}
    <span class="plan-description collapsed-copy">{plan.description}</span>
  {/if}
  <span class="plan-footer-meta">
    <span>
      {plan.overallApproval.approvalPercent}% approved{#if planAverageRating != null}
        · Avg {planAverageRating.toFixed(1)}{/if}
    </span>
    <span>{plan.authorUsername} · {formatRelativeTime(plan.createdAt)}</span>
  </span>
</button>

<OverlaySheet bind:open={sheetOpen} title={plan.title} labelledById={`plan-sheet-${plan.id}`} wide>
  <div slot="subtitle">
    {#if compactChip}
      <p class="sheet-kicker">{compactChip}</p>
    {/if}
  </div>
  <div slot="header-actions">
    {#if canEdit}
      <button class="text-button" type="button" on:click={handleEdit}>Edit</button>
    {/if}
  </div>

  <div class="plan-sheet">
    {#if plan.description}
      <p class="plan-description">{plan.description}</p>
    {/if}

    {#if 'projectSubtypeLabel' in plan}
      <div class="meta-row">
        <span class="meta-label">Subtype</span>
        <span>{plan.projectSubtypeLabel}</span>
      </div>
    {/if}

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
        <span class="meta-label">Support response</span>
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

    <div class="assessment-bar">
      {#if canVote}
        {#if !allCriteriaComplete || effectiveOverallVote == null}
          <button
            class="primary-button"
            type="button"
            data-participation-action="assess-plan"
            on:click={() =>
              openAssessmentWizard({
                openAtOverall: allCriteriaComplete && effectiveOverallVote == null
              })}
          >
            {#if !allCriteriaComplete}
              {pendingCriterionCount > 0 ? `Assess plan (${pendingCriterionCount} left)` : 'Assess plan'}
            {:else}
              Cast final approval
            {/if}
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
        {plan.overallApproval.approvalPercent}% approved{#if planAverageRating != null}
          · Avg {planAverageRating.toFixed(1)}{/if}
      </span>
    </div>

    {#if canVote && criteria.length > 0}
      <p class="rating-progress">{ratedCount}/{criteria.length} rated</p>
    {/if}

    <p class="sheet-author">{plan.authorUsername} · {formatRelativeTime(plan.createdAt)}</p>
  </div>
</OverlaySheet>

{#if Wizard}
  <svelte:component
    this={Wizard}
    open={assessmentOpen}
    {plan}
    planTitle={plan.title}
    {criteria}
    {reviewMode}
    {canVote}
    {initialCriterionId}
    {openAtOverallStep}
    overallActiveVote={effectiveOverallVote}
    onRate={handleCriterionRate}
    onOverallVote={handleOverallVote}
    onClose={closeAssessmentWizard}
  />
{/if}

<style>
  .plan-card {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    display: grid;
    gap: 6px;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.12s ease, box-shadow 0.12s ease;
  }

  .plan-card:hover,
  .plan-card.open {
    border-color: color-mix(in srgb, var(--brand) 28%, var(--panel-border));
  }

  .plan-card.leading {
    border-color: color-mix(in srgb, var(--brand) 55%, var(--panel-border));
    box-shadow: inset 3px 0 0 var(--brand);
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
    font-weight: 800;
  }

  .plan-description,
  .approval-summary,
  .meta-row span:last-child,
  .meta-block p,
  .value-note,
  .stage-card p,
  .sheet-author,
  .rating-progress {
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.45;
  }

  .collapsed-copy {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .phase-badge {
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
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
  }

  .plan-sheet {
    display: grid;
    gap: 14px;
    padding: 8px 16px 4px;
  }

  .sheet-kicker {
    margin: 0;
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
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
  .value-note,
  .plan-sheet .plan-description,
  .sheet-author,
  .rating-progress {
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
</style>
