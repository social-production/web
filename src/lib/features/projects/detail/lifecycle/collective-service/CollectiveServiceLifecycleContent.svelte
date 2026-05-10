<script lang="ts">
  import ProductiveLifecycleContent from '../productive/ProductiveLifecycleContent.svelte';
  import type {
    ProjectActivityRoleInput,
    ProjectApprovalVote,
    ProjectImportanceVoteValue,
    ProjectLifecyclePhaseId,
    ProjectPageData
  } from '$lib/types/detail';

  type DraftPlanPhase = {
    title: string;
    details: string;
    materialsLabel: string;
    costLabel: string;
  };

  type DraftPlanForm = {
    title: string;
    description: string;
    totalCostLabel: string;
    planPhases: DraftPlanPhase[];
    requestSystemEnabled?: boolean;
    requestMode?: 'calendar' | 'direct' | 'both';
    allowOffScheduleRequests?: boolean;
  };

  type DraftActivityForm = {
    title: string;
    scheduledAt: string;
    endsAt: string;
    locationLabel: string;
    roleRequirements: ProjectActivityRoleInput[];
    linkedPlanPhaseId: string | null;
    note: string;
  };

  type DraftServiceRequestForm = {
    title: string;
    body: string;
    scheduledAt: string;
    endsAt: string;
  };

  export let data: ProjectPageData;
  export let activePhaseId: ProjectLifecyclePhaseId;
  export let importanceOptions: Array<{ value: ProjectImportanceVoteValue; label: string }> = [];
  export let draftValue = '';
  export let showPhaseOneComposer = false;
  export let showPhaseTwoComposer = false;
  export let showPhaseThreeComposer = false;
  export let showPhaseFiveComposer = false;
  export let productionForm: DraftPlanForm;
  export let distributionForm: DraftPlanForm;
  export let activityForm: DraftActivityForm;
  export let serviceRequestForm: DraftServiceRequestForm;
  export let highlightedActivityId: string | null = null;
  export let activityComposerElement: HTMLElement | null = null;
  export let activityStartInputElement: HTMLInputElement | null = null;
  export let activityEndInputElement: HTMLInputElement | null = null;

  export let submitValue: () => void | Promise<void> = () => {};
  export let setProjectValueVote: (valueId: string, voteValue: ProjectImportanceVoteValue) => void | Promise<void> =
    () => {};
  export let addProductionPlanPhase: () => void = () => {};
  export let removeProductionPlanPhase: (index: number) => void = () => {};
  export let submitProductionPlan: () => void | Promise<void> = () => {};
  export let setPhaseTwoPlanValueVote: (
    planId: string,
    valueId: string,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  export let setPhaseTwoPlanOverallVote: (
    planId: string,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  export let addDistributionPlanPhase: () => void = () => {};
  export let removeDistributionPlanPhase: (index: number) => void = () => {};
  export let submitDistributionPlan: () => void | Promise<void> = () => {};
  export let setPhaseThreePlanValueVote: (
    planId: string,
    valueId: string,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  export let setPhaseThreePlanOverallVote: (
    planId: string,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  export let isExpandedPlan: (list: 'phase-2' | 'phase-3', planId: string) => boolean = () => false;
  export let openActivityComposer: () => void | Promise<void> = () => {};
  export let openActivityComposerForDay: (isoDay: string) => void | Promise<void> = () => {};
  export let focusActivityCard: (activityId: string) => void | Promise<void> = () => {};
  export let submitActivity: () => void | Promise<void> = () => {};
  export let submitServiceRequest: () => void | Promise<void> = () => {};
  export let updateActivityCommitment: (activityId: string, roleLabel: string | null) => void | Promise<void> =
    () => {};
</script>

<ProductiveLifecycleContent
  {data}
  {activePhaseId}
  {importanceOptions}
  bind:draftValue
  bind:showPhaseOneComposer
  bind:showPhaseTwoComposer
  bind:showPhaseThreeComposer
  bind:showPhaseFiveComposer
  {productionForm}
  {distributionForm}
  {activityForm}
  {serviceRequestForm}
  {highlightedActivityId}
  bind:activityComposerElement
  bind:activityStartInputElement
  bind:activityEndInputElement
  {submitValue}
  {setProjectValueVote}
  {addProductionPlanPhase}
  {removeProductionPlanPhase}
  {submitProductionPlan}
  {setPhaseTwoPlanValueVote}
  {setPhaseTwoPlanOverallVote}
  {addDistributionPlanPhase}
  {removeDistributionPlanPhase}
  {submitDistributionPlan}
  {setPhaseThreePlanValueVote}
  {setPhaseThreePlanOverallVote}
  {isExpandedPlan}
  {openActivityComposer}
  {openActivityComposerForDay}
  {focusActivityCard}
  {submitActivity}
  {submitServiceRequest}
  {updateActivityCommitment}
/>
