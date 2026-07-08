<script lang="ts">
  import CollapsiblePlanCard from '$lib/components/cards/project-detail/CollapsiblePlanCard.svelte';
  import PlanCreationWizard from '$lib/components/shared/PlanCreationWizard.svelte';
  import RoundPlusButton from '$lib/components/shared/RoundPlusButton.svelte';
  import type { EventPageData, PlanCriterionRating, ProjectApprovalVote } from '$lib/types/detail';
  import { buildEventPlanCreationSteps } from '$lib/utils/planRubric';
  import type { EventPlanForm } from '../eventLifecycleShared';

  export let data: EventPageData;
  export let showPlanComposer = false;
  export let planForm: EventPlanForm = {
    title: '',
    description: '',
    demandConsiderationNote: '',
    scheduleMode: 'date',
    scheduledDate: '',
    rangeStartDate: '',
    rangeEndDate: '',
    startTimeLabel: '',
    finishTimeLabel: '',
    locationLabel: '',
    planPhases: [{ title: '', details: '' }],
    validationMessages: []
  };
  export let addPlanPhase: () => void = () => {};
  export let submitPlan: () => void | Promise<void> = () => {};
  export let targetedPlanId: string | null = null;
  export let autoAssess = false;
  export let autoAssessCriterionId: string | null = null;
  export let voteOnPlanOverall: (
    planId: string,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  export let ratePlanCriterion: (
    planId: string,
    criterionId: string,
    rating: PlanCriterionRating | null
  ) => void | Promise<void> = () => {};

  function statusLabel(planId: string) {
    const plan = data.lifecycle.phaseTwo.plans.find((entry) => entry.id === planId);
    if (!plan) {
      return null;
    }

    if (data.lifecycle.currentPhaseId !== 'event-plan') {
      return planId === data.lifecycle.phaseTwo.winningPlanId ? 'Selected' : null;
    }

    if (plan.leaderStatus === 'leading') {
      return 'Leading above threshold';
    }

    if (plan.leaderStatus === 'tied') {
      return 'Tied above threshold';
    }

    return null;
  }

  $: prominentValues = data.lifecycle.phaseOne.values.filter((value) => value.importanceScore >= 5);
  $: creationSteps = buildEventPlanCreationSteps(prominentValues, planForm.planPhases.length);
</script>

<section class="phase-surface">
  {#if data.lifecycle.phaseTwo.viewerCanSubmitPlans}
    <div class="composer-toggle-row">
      <RoundPlusButton
        active={showPlanComposer}
        ariaLabel={showPlanComposer ? 'Hide event plan composer' : 'Add event plan'}
        participationAction="submit-plan"
        action={() => (showPlanComposer = !showPlanComposer)}
      />
    </div>

    <PlanCreationWizard
      open={showPlanComposer}
      title="Create event plan"
      context="event"
      steps={creationSteps}
      bind:form={planForm}
      submitLabel="Submit event plan"
      {addPlanPhase}
      onSubmit={submitPlan}
      onCancel={() => (showPlanComposer = false)}
    />
  {/if}

  <div id="participation-plans" class="surface-stack plan-stack" class:scrollable-stack={data.lifecycle.phaseTwo.plans.length > 4}>
    {#if data.lifecycle.phaseTwo.plans.length === 0}
      <div class="empty-card">No event plans submitted yet.</div>
    {:else}
      {#each data.lifecycle.phaseTwo.plans as plan}
        <CollapsiblePlanCard
          {plan}
          expanded={plan.id === data.lifecycle.phaseTwo.winningPlanId || plan.id === targetedPlanId}
          autoOpenAssessment={autoAssess && plan.id === targetedPlanId}
          autoAssessCriterionId={plan.id === targetedPlanId ? autoAssessCriterionId : null}
          canVote={data.lifecycle.phaseTwo.viewerCanVoteOnPlans}
          statusLabel={statusLabel(plan.id)}
          overallvote={voteOnPlanOverall}
          criterionvote={ratePlanCriterion}
        />
      {/each}
    {/if}
  </div>
</section>

<style>
  .phase-surface,
  .surface-stack {
    display: grid;
    gap: 12px;
  }

  .composer-toggle-row {
    display: flex;
    justify-content: center;
  }

  .empty-card {
    padding: 14px;
    border: 1px dashed var(--panel-border);
    border-radius: var(--radius-sm);
    color: var(--text-soft);
    font-size: 13px;
  }

  .scrollable-stack {
    max-height: min(34rem, 72vh);
    overflow-y: auto;
    align-content: start;
    padding-right: 4px;
  }
</style>
