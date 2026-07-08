<script lang="ts">
  import CollapsiblePlanCard from '$lib/components/cards/project-detail/CollapsiblePlanCard.svelte';
  import PlanCreationWizard from '$lib/components/shared/PlanCreationWizard.svelte';
  import RoundPlusButton from '$lib/components/shared/RoundPlusButton.svelte';
  import {
    isCollectiveServiceProject,
    projectSubtypeOptions
  } from '$lib/features/projects/projectMode';
  import type { ProjectApprovalVote, ProjectPageData, PlanCriterionRating } from '$lib/types/detail';
  import type { ProjectSubtype } from '$lib/types/feed';
  import {
    buildProjectDistributionCreationSteps,
    buildProjectProductionCreationSteps
  } from '$lib/utils/planRubric';

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
    valueConsiderationNotes?: Record<string, string>;
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
  export let autoAssessPlanId: string | null = null;
  export let autoAssessCriterionId: string | null = null;
  export let overallvote: (planId: string, vote: ProjectApprovalVote | null) => void = () => {};
  export let criterionvote: (
    planId: string,
    criterionId: string,
    rating: PlanCriterionRating | null
  ) => void | Promise<void> = () => {};

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
  $: prominentValues = data.lifecycle.phaseOne.values.filter((value) => value.importanceScore >= 5);
  $: wizardSubtypeOptions = subtypeOptions.map((option) => ({ value: option.value, label: option.label }));
  $: creationSteps = isPhaseTwo
    ? buildProjectProductionCreationSteps(prominentValues, form.planPhases.length, {
        includeSubtype: true,
        includeRepository: selectedSubtype === 'software'
      })
    : buildProjectDistributionCreationSteps(prominentValues, form.planPhases.length);

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

  function valueNote(valueId: string) {
    return form.valueConsiderationNotes?.[valueId] ?? '';
  }

  function updateValueNote(valueId: string, note: string) {
    form = {
      ...form,
      valueConsiderationNotes: {
        ...(form.valueConsiderationNotes ?? {}),
        [valueId]: note
      }
    };
  }

  function statusLabel(planId: string) {
    const plan = plans.find((entry) => entry.id === planId);
    if (!plan) {
      return null;
    }

    if (data.lifecycle.currentPhaseId !== phaseId) {
      return planId === winningPlanId ? 'Selected' : null;
    }

    if (plan.leaderStatus === 'leading') {
      return 'Leading above threshold';
    }

    if (plan.leaderStatus === 'tied') {
      return 'Tied above threshold';
    }

    return null;
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
        participationAction="submit-plan"
        action={toggleComposer}
      />
    </div>

    <PlanCreationWizard
      open={showComposer}
      title={editingPlanId ? 'Edit plan' : isPhaseTwo ? 'Create production plan' : 'Create distribution plan'}
      context="project"
      steps={creationSteps}
      bind:form
      {submitLabel}
      subtypeOptions={wizardSubtypeOptions}
      {addPlanPhase}
      {addMaterial}
      {removeMaterial}
      onSubmit={submitPlan}
      onCancel={() => {
        if (editingPlanId) {
          cancelEditingPlan();
        } else {
          showComposer = false;
        }
      }}
    />
  {/if}

  <div id="participation-plans" class="surface-stack">
    {#if plans.length === 0}
      <div class="empty-card">{emptyCopy()}</div>
    {:else}
      {#each plans as plan}
        <CollapsiblePlanCard
          canEdit={isPhaseTwo && 'viewerCanEdit' in plan && !!plan.viewerCanEdit}
          canVote={canVoteOnPlans}
          expanded={isExpandedPlan(plan.id)}
          autoOpenAssessment={autoAssessPlanId === plan.id}
          autoAssessCriterionId={autoAssessPlanId === plan.id ? autoAssessCriterionId : null}
          onEdit={() => startEditingPlan(plan.id)}
          showRequestSystem={!isPhaseTwo && collectiveService}
          {plan}
          statusLabel={statusLabel(plan.id)}
          {overallvote}
          {criterionvote}
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

  .value-proposal-list {
    display: grid;
    gap: 8px;
  }

  .value-proposal-heading {
    font-size: 12px;
    font-weight: 700;
  }

  .value-proposal-list ul {
    margin: 0;
    padding-left: 18px;
    display: grid;
    gap: 6px;
  }

  .value-proposal-list li {
    display: grid;
    gap: 2px;
  }

  .value-proposal-list li span {
    color: var(--text-soft);
    font-size: 12px;
  }

  .value-note-stack {
    display: grid;
    gap: 10px;
  }

  .value-note-field {
    display: grid;
    gap: 6px;
  }

  .value-note-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-main);
  }

  .field-inline-label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 700;
  }
</style>