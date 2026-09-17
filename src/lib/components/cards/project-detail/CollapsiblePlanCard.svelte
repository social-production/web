<script lang="ts">
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import PlanCriterionRatingRow from '$lib/components/shared/PlanCriterionRatingRow.svelte';
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
  let previouslyExpanded = false;
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

  let localRatings: Record<string, PlanCriterionRating | null> = {};
  let localOverallVote: 'yes' | 'no' | null | undefined = undefined;
  let lastPlanId = plan.id;

  $: if (plan.id !== lastPlanId) {
    lastPlanId = plan.id;
    localRatings = {};
    localOverallVote = undefined;
    sheetOpen = false;
    previouslyExpanded = false;
  }

  $: if (expanded && !previouslyExpanded) {
    sheetOpen = true;
  }
  $: previouslyExpanded = expanded;

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
  $: assessedCriteria = criteria.filter((entry) => entry.ratingCount > 0);
  $: planAverageRating =
    typeof plan.averageRating === 'number' && plan.averageRating > 0
      ? plan.averageRating
      : assessedCriteria.length > 0
        ? assessedCriteria.reduce((sum, entry) => sum + entry.averageRating, 0) / assessedCriteria.length
        : null;
  $: leading = plan.isLeading || plan.leaderStatus === 'leading';
  $: tied = plan.leaderStatus === 'tied';
  $: compactChip = statusLabel || (leading ? 'Leading' : tied ? 'Tied' : null);
  $: needsAssessment = canVote && criteria.some((entry) => entry.activeRating == null);
  $: needsOverallVote = canVote && allCriteriaComplete && effectiveOverallVote == null;
  $: actionChip = needsAssessment ? 'Assess' : needsOverallVote ? 'Vote' : null;
  $: hasAnyVotes =
    plan.overallApproval.totalVotes > 0 ||
    (plan.criterionAssessments ?? []).some((entry) => entry.ratingCount > 0) ||
    (plan.valueAssessments ?? []).some((entry) => entry.totalVotes > 0);
  $: allowEdit = canEdit && !hasAnyVotes;
  $: outputSummary = 'outputSummary' in plan ? plan.outputSummary?.trim() ?? '' : '';
  $: materialsSummary = 'materialsSummary' in plan ? plan.materialsSummary?.trim() ?? '' : '';
  $: totalCostLabel = 'totalCostLabel' in plan ? plan.totalCostLabel?.trim() ?? '' : '';
  $: acquisitionsSummary =
    'acquisitionsSummary' in plan ? plan.acquisitionsSummary?.trim() ?? '' : '';

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

  function handleSheetOverallVote(vote: 'yes' | 'no') {
    void handleOverallVote(effectiveOverallVote === vote ? null : vote);
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
  class:tied
  class:open={sheetOpen}
  class:needs-action={Boolean(actionChip)}
  type="button"
  data-participation-action={actionChip ? 'assess-plan' : undefined}
  on:click={() => (sheetOpen = true)}
>
  <span class="plan-header">
    <strong class="plan-title">{plan.title}</strong>
    <span class="plan-chips">
      {#if actionChip}
        <span class="assess-chip">{actionChip}</span>
      {/if}
      {#if compactChip}
        <span class="phase-badge" class:complete={leading} class:tied-badge={tied}>{compactChip}</span>
      {/if}
    </span>
  </span>
  {#if plan.description}
    <span class="plan-lede collapsed-copy">{plan.description}</span>
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
    <p class="sheet-author">{plan.authorUsername} · {formatRelativeTime(plan.createdAt)}</p>
  </div>
  <div slot="header-actions">
    {#if allowEdit}
      <button class="text-button" type="button" on:click={handleEdit}>Edit</button>
    {/if}
  </div>

  <div class="plan-sheet">
    {#if plan.description}
      <section class="plan-section">
        <h3>Overview</h3>
        <p class="plan-body">{plan.description}</p>
      </section>
    {/if}

    {#if 'projectSubtypeLabel' in plan || 'schedule' in plan || ('repositoryUrl' in plan && plan.repositoryUrl) || (showRequestSystem && 'requestSystemEnabled' in plan && plan.requestSystemEnabled) || outputSummary || materialsSummary || totalCostLabel || acquisitionsSummary}
      <section class="plan-section">
        <h3>Details</h3>
        <dl class="plan-facts">
          {#if 'projectSubtypeLabel' in plan}
            <div class="fact">
              <dt>Subtype</dt>
              <dd>{plan.projectSubtypeLabel}</dd>
            </div>
          {/if}

          {#if 'schedule' in plan}
            <div class="fact">
              <dt>Timing</dt>
              <dd>{scheduleLabel || plan.schedule.label}</dd>
            </div>
            <div class="fact">
              <dt>Location</dt>
              <dd>{plan.locationLabel}</dd>
            </div>
          {/if}

          {#if 'locationLabel' in plan && !('schedule' in plan) && plan.locationLabel}
            <div class="fact">
              <dt>Location</dt>
              <dd>{plan.locationLabel}</dd>
            </div>
          {/if}

          {#if 'repositoryUrl' in plan && plan.repositoryUrl}
            <div class="fact">
              <dt>Repository</dt>
              <dd>
                <a href={normalizeExternalUrl(plan.repositoryUrl)} rel="noreferrer" target="_blank">{plan.repositoryUrl}</a>
              </dd>
            </div>
          {/if}

          {#if showRequestSystem && 'requestSystemEnabled' in plan && plan.requestSystemEnabled}
            <div class="fact">
              <dt>Requests</dt>
              <dd>
                {plan.requestMode === 'calendar'
                  ? 'Calendar only'
                  : plan.requestMode === 'direct'
                    ? 'Direct only'
                    : 'Calendar and direct'}
                · {plan.allowOffScheduleRequests ? 'Off-schedule allowed' : 'Slot-bound only'}
              </dd>
            </div>
          {/if}

          {#if outputSummary}
            <div class="fact">
              <dt>Output</dt>
              <dd>{outputSummary}</dd>
            </div>
          {/if}

          {#if materialsSummary}
            <div class="fact">
              <dt>Materials</dt>
              <dd>{materialsSummary}</dd>
            </div>
          {/if}

          {#if totalCostLabel}
            <div class="fact">
              <dt>Resources</dt>
              <dd>{totalCostLabel}</dd>
            </div>
          {/if}

          {#if acquisitionsSummary}
            <div class="fact">
              <dt>Acquisitions</dt>
              <dd>{acquisitionsSummary}</dd>
            </div>
          {/if}
        </dl>
      </section>
    {/if}

    {#if plan.demandConsiderationNote?.trim() || authorValueCommentaryEntries.length > 0}
      <section class="plan-section">
        <h3>Notes</h3>
        {#if plan.demandConsiderationNote?.trim()}
          <article class="note-card">
            <span class="note-label">Support response</span>
            <p>{plan.demandConsiderationNote}</p>
          </article>
        {/if}
        {#each authorValueCommentaryEntries as entry (entry.valueId)}
          <article class="note-card">
            <span class="note-label">Values</span>
            <p>{entry.note}</p>
          </article>
        {/each}
      </section>
    {/if}

    {#if plan.planPhases.length > 0}
      <section class="plan-section">
        <h3>Stages</h3>
        <ol class="stage-list">
          {#each plan.planPhases as phase, index}
            <li class="stage-item">
              <span class="stage-num">{index + 1}</span>
              <div class="stage-copy">
                <strong>{phase.title}</strong>
                {#if phase.details}
                  <p>{phase.details}</p>
                {/if}
                {#if 'materialsLabel' in phase && phase.materialsLabel}
                  <span class="stage-meta">Materials · {phase.materialsLabel}</span>
                {/if}
                {#if 'costLabel' in phase && phase.costLabel}
                  <span class="stage-meta">Cost · {phase.costLabel}</span>
                {/if}
              </div>
            </li>
          {/each}
        </ol>
      </section>
    {/if}

    <section class="assess-panel" data-participation-action="assess-plan">
      <div class="assess-heading">
        <h3>Assess</h3>
        <span class="approval-summary">
          {plan.overallApproval.approvalPercent}% approved{#if planAverageRating != null}
            · Avg {planAverageRating.toFixed(1)}{/if}
        </span>
      </div>
      <p class="assess-helper">1 strongly oppose · 5 strongly support. Community averages stay visible while you rate.</p>

      {#if criteria.length > 0}
        <div class="criterion-stack">
          {#each criteria as entry (entry.criterionId)}
            <PlanCriterionRatingRow
              criterion={entry}
              selected={entry.activeRating}
              {canVote}
              onSelect={(rating) => handleCriterionRate(entry.criterionId, rating)}
            />
          {/each}
        </div>
        {#if canVote}
          <p class="rating-progress">{ratedCount}/{criteria.length} rated</p>
        {/if}
      {/if}

      <div class="overall-row">
        <div class="criterion-copy">
          <span class="meta-label">Final approval</span>
          <strong>Does this plan meet the need?</strong>
        </div>
        <div class="overall-actions">
          <button
            class:selected={effectiveOverallVote === 'yes'}
            class="vote-chip"
            disabled={!canVote || !allCriteriaComplete}
            type="button"
            on:click={() => handleSheetOverallVote('yes')}
          >
            Yes
          </button>
          <button
            class:selected={effectiveOverallVote === 'no'}
            class="vote-chip negative"
            disabled={!canVote || !allCriteriaComplete}
            type="button"
            on:click={() => handleSheetOverallVote('no')}
          >
            No
          </button>
        </div>
        {#if canVote && !allCriteriaComplete}
          <p class="rating-progress">Rate every criterion before the final vote.</p>
        {/if}
      </div>
    </section>
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
    padding: 10px 12px;
    border: 1px solid transparent;
    border-radius: 0;
    background: color-mix(in srgb, var(--panel) 55%, var(--panel-strong));
    display: grid;
    gap: 4px;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.12s ease, box-shadow 0.12s ease;
  }

  .plan-card:hover,
  .plan-card.open {
    background: color-mix(in srgb, var(--brand-soft) 22%, var(--panel-strong));
  }

  .plan-card.tied {
    background: color-mix(in srgb, var(--accent-warm, #e8b86d) 16%, var(--panel-strong));
  }

  .plan-card.leading {
    background: color-mix(in srgb, var(--brand-soft) 48%, var(--panel-strong));
    box-shadow: inset 3px 0 0 var(--brand);
  }

  .plan-card.needs-action {
    border-color: color-mix(in srgb, var(--brand) 28%, transparent);
  }

  .plan-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }

  .plan-title {
    color: var(--text-main);
    font-size: 14px;
    font-weight: 800;
    line-height: 1.3;
    min-width: 0;
  }

  .plan-chips {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
    margin-left: auto;
  }

  .plan-lede,
  .approval-summary,
  .sheet-author,
  .rating-progress,
  .assess-helper,
  .note-card p,
  .stage-copy p,
  .stage-meta,
  .fact dd {
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

  .phase-badge,
  .assess-chip {
    flex: 0 0 auto;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    border: 1px solid color-mix(in srgb, var(--brand) 40%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 75%, var(--panel));
    color: var(--brand-strong);
  }

  .assess-chip {
    background: var(--brand);
    border-color: var(--brand);
    color: var(--page-bg, #fff);
  }

  .phase-badge.tied-badge {
    border-color: color-mix(in srgb, var(--accent-warm, #e8b86d) 50%, var(--panel-border));
    background: color-mix(in srgb, var(--accent-warm, #e8b86d) 22%, var(--panel));
    color: var(--accent-warm-strong, var(--text-main));
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
    gap: 22px;
    padding: 16px 20px 20px;
  }

  .sheet-kicker,
  .sheet-author {
    margin: 0;
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .sheet-author {
    font-weight: 600;
  }

  .plan-section {
    display: grid;
    gap: 10px;
  }

  .plan-section h3 {
    margin: 0;
    color: var(--text-main);
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .plan-body {
    margin: 0;
    color: var(--text-main);
    font-size: 15px;
    font-weight: 500;
    line-height: 1.6;
  }

  .plan-facts {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 2px 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--panel-strong) 70%, var(--panel));
  }

  .fact {
    display: grid;
    gap: 3px;
    padding: 12px 0;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 80%, transparent);
  }

  .fact:last-child {
    border-bottom: 0;
  }

  .fact dt,
  .note-label,
  .meta-label {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-soft);
  }

  .fact dd {
    margin: 0;
    color: var(--text-main);
    font-size: 14px;
    font-weight: 600;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .note-card {
    display: grid;
    gap: 6px;
    padding: 12px 14px;
    border-left: 3px solid color-mix(in srgb, var(--brand) 45%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 18%, var(--panel-strong));
  }

  .note-card p,
  .stage-copy p,
  .rating-progress,
  .assess-helper {
    margin: 0;
  }

  .stage-list {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .stage-item {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr);
    gap: 12px;
    align-items: start;
    padding: 0 0 16px;
  }

  .stage-item:last-child {
    padding-bottom: 0;
  }

  .stage-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--brand-soft) 70%, var(--panel));
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 800;
  }

  .stage-copy {
    display: grid;
    gap: 6px;
    min-width: 0;
    padding-bottom: 16px;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 80%, transparent);
  }

  .stage-item:last-child .stage-copy {
    padding-bottom: 0;
    border-bottom: 0;
  }

  .stage-copy strong {
    color: var(--text-main);
    font-size: 16px;
    font-weight: 800;
    line-height: 1.3;
  }

  .stage-copy p {
    color: var(--text-main);
    font-size: 14px;
    line-height: 1.55;
  }

  .stage-meta {
    font-size: 12px;
    font-weight: 600;
  }

  .assess-panel {
    display: grid;
    gap: 12px;
    padding: 12px;
    border: 1px solid color-mix(in srgb, var(--brand) 28%, var(--panel-border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--brand-soft) 22%, var(--panel-strong));
  }

  .assess-heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  .assess-heading h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 800;
    color: var(--text-main);
  }

  .criterion-stack {
    display: grid;
    gap: 8px;
  }

  .overall-row {
    display: grid;
    gap: 8px;
  }

  .criterion-copy {
    display: grid;
    gap: 2px;
  }

  .overall-row strong {
    color: var(--text-main);
    font-size: 14px;
  }

  .overall-actions {
    display: flex;
    gap: 8px;
  }

  .vote-chip {
    min-height: 36px;
    min-width: 72px;
    padding: 6px 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-main);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }

  .vote-chip.selected {
    border-color: color-mix(in srgb, var(--brand) 55%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 55%, var(--panel));
    color: var(--brand-strong);
  }

  .vote-chip.negative.selected {
    border-color: color-mix(in srgb, var(--tablet-community-bg, #b42318) 45%, var(--panel-border));
    color: var(--tablet-community-text, var(--text-main));
  }

  .vote-chip:disabled {
    cursor: not-allowed;
    opacity: 0.6;
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
