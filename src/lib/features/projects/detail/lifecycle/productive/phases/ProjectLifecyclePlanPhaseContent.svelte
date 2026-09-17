<script lang="ts">
  import CollapsiblePlanCard from '$lib/components/cards/project-detail/CollapsiblePlanCard.svelte';
  import PlanCreationWizard from '$lib/components/shared/PlanCreationWizard.svelte';
  import PhaseWorkToolbar from '$lib/components/shared/PhaseWorkToolbar.svelte';
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
    valuesNote?: string;
    valueConsiderationNotes?: Record<string, string>;
    planPhases: DraftPlanPhase[];
    requestSystemEnabled?: boolean;
    requestMode?: 'calendar' | 'direct' | 'both';
    allowOffScheduleRequests?: boolean;
    validationMessages?: string[];
    locationId?: string | null;
    locationLabel?: string;
    locationIsOnline?: boolean;
    distributionLocationId?: string | null;
    distributionLocationLabel?: string;
    distributionLocationIsOnline?: boolean;
  };

  export let data: ProjectPageData;
  export let phaseId: 'phase-2' | 'phase-3' = 'phase-2';
  export let form: DraftPlanForm;
  export let showComposer = false;
  export let submitLabel = 'Submit plan';
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
  $: canSubmitPlans =
    data.lifecycle.currentPhaseId === phaseId &&
    (isPhaseTwo
      ? data.lifecycle.phaseTwo.viewerCanSubmitPlans
      : data.lifecycle.phaseThree.viewerCanSubmitPlans);
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
  $: winningProductionPlan = isPhaseTwo
    ? null
    : data.lifecycle.phaseTwo.plans.find((entry) => entry.id === data.lifecycle.phaseTwo.winningPlanId) ??
      data.lifecycle.phaseTwo.plans.find((entry) => entry.leaderStatus === 'leading') ??
      null;
  $: productionPlanLocation = winningProductionPlan
    ? {
        locationId: winningProductionPlan.locationId ?? null,
        locationLabel: winningProductionPlan.locationLabel ?? ''
      }
    : null;
  $: includePhysicalLocation = selectedSubtype !== 'software';
  $: creationSteps = isPhaseTwo
    ? buildProjectProductionCreationSteps(prominentValues, {
        includeSubtype: true,
        includeRepository: selectedSubtype === 'software',
        includeLocation: includePhysicalLocation
      })
    : buildProjectDistributionCreationSteps(prominentValues, {
        includeRequestSettings: collectiveService,
        includeDistributionLocation: includePhysicalLocation
      });

  function descriptionPlaceholder() {
    if (isPhaseTwo) {
      return collectiveService ? 'Describe the overall operating plan.' : 'Describe the overall production plan.';
    }

    return collectiveService ? 'Describe the overall access plan.' : 'Describe the overall distribution plan.';
  }

  function demandPlaceholder() {
    return 'Explain whether this plan meets the current support signal. If it does not, explain the gap and why.';
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
      return 'Leading';
    }

    if (plan.leaderStatus === 'tied') {
      return 'Tied';
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

</script>

<section class="phase-surface">
  {#if canSubmitPlans}
    <PlanCreationWizard
      open={showComposer}
      title={editingPlanId ? 'Edit plan' : isPhaseTwo ? 'Create production plan' : 'Create distribution plan'}
      context="project"
      steps={creationSteps}
      bind:form
      {submitLabel}
      subtypeOptions={wizardSubtypeOptions}
      {productionPlanLocation}
      signalSummary={data.lifecycle.phaseOne.signalSummary}
      signalCount={data.signalCount}
      onSubmit={submitPlan}
      onCancel={() => {
        if (editingPlanId) {
          cancelEditingPlan();
        } else {
          showComposer = false;
        }
      }}
      onDismiss={() => {
        showComposer = false;
      }}
    />
  {/if}

  <div id="participation-plans">
    {#if plans.length > 0}
      <div class="plan-stack">
        {#each plans as plan (plan.id)}
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
      </div>
    {/if}
  </div>

  <PhaseWorkToolbar>
    {#if canSubmitPlans}
      <RoundPlusButton
        standout
        active={showComposer}
        label={editingPlanId ? 'Edit plan' : 'Add plan'}
        participationAction="submit-plan"
        action={toggleComposer}
      />
    {/if}
  </PhaseWorkToolbar>
</section>

<style>
  .phase-surface {
    display: grid;
    gap: 12px;
  }
</style>