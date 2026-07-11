<script lang="ts">
  import CollectiveServicePhaseOne from './phases/CollectiveServicePhaseOne.svelte';
  import CollectiveServicePhaseTwo from './phases/CollectiveServicePhaseTwo.svelte';
  import CollectiveServicePhaseThree from './phases/CollectiveServicePhaseThree.svelte';
  import CollectiveServicePhaseFive from './phases/CollectiveServicePhaseFive.svelte';
  import CollectiveServicePhaseSix from './phases/CollectiveServicePhaseSix.svelte';
  import type {
    ProjectActivityRoleInput,
    ProjectServiceHistoryCompletionChoice,
    ProjectServiceHistoryCompletionRole,
    ProjectApprovalVote,
    ProjectImportanceVoteValue,
    ProjectLifecyclePhaseId,
    ProjectPageData,
    ProjectServiceRequestPlanInput,
    ProjectServiceRequestSettingsChangeInput,
    ProjectServiceRequestStatus
  } from '$lib/types/detail';
  import type { ProjectSubtype } from '$lib/types/feed';

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
    planPhases: DraftPlanPhase[];
    requestSystemEnabled?: boolean;
    requestMode?: 'calendar' | 'direct' | 'both';
    allowOffScheduleRequests?: boolean;
  };

  type DraftActivityForm = {
    title: string;
    scheduledAt: string;
    endsAt: string;
    isOnline: boolean;
    locationLabel: string;
    onlineDetail: string;
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
  export let showRequestComposer = false;
  export let productionForm: DraftPlanForm;
  export let distributionForm: DraftPlanForm;
  export let activityForm: DraftActivityForm;
  export let serviceRequestForm: DraftServiceRequestForm;
  export let serviceRequestFeedback = '';
  export let highlightedActivityId: string | null = null;
  export let highlightedRequestId: string | null = null;
  export let selectedRequestActivityId: string | null = null;
  export let activityComposerElement: HTMLElement | null = null;
  export let serviceRequestComposerElement: HTMLElement | null = null;

  export let submitValue: () => void | Promise<void> = () => {};
  export let setProjectValueVote: (valueId: string, voteValue: ProjectImportanceVoteValue) => void | Promise<void> =
    () => {};
  export let addProductionPlanPhase: () => void = () => {};
  export let submitProductionPlan: () => void | Promise<void> = () => {};
  export let editingProductionPlanId: string | null = null;
  export let startEditingProductionPlan: (planId: string) => void | Promise<void> = () => {};
  export let cancelEditingProductionPlan: () => void | Promise<void> = () => {};
  export let setPhaseTwoPlanOverallVote: (
    planId: string,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  export let setPhaseTwoPlanCriterionRating: (
    planId: string,
    criterionId: string,
    rating: import('$lib/types/detail').PlanCriterionRating | null
  ) => void | Promise<void> = () => {};
  export let addDistributionPlanPhase: () => void = () => {};
  export let submitDistributionPlan: () => void | Promise<void> = () => {};
  export let setPhaseThreePlanOverallVote: (
    planId: string,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  export let setPhaseThreePlanCriterionRating: (
    planId: string,
    criterionId: string,
    rating: import('$lib/types/detail').PlanCriterionRating | null
  ) => void | Promise<void> = () => {};
  export let isExpandedPlan: (list: 'phase-2' | 'phase-3', planId: string) => boolean = () => false;
  export let autoAssessPlanId: string | null = null;
  export let autoAssessCriterionId: string | null = null;
  export let openActivityComposer: () => void | Promise<void> = () => {};
  export let openActivityComposerForDay: (isoDay: string) => void | Promise<void> = () => {};
  export let openRequestComposer: () => void | Promise<void> = () => {};
  export let openRequestComposerForDay: (isoDay: string) => void | Promise<void> = () => {};
  export let openRequestComposerForActivity: (activityId: string) => void | Promise<void> = () => {};
  export let closeRequestComposer: () => void | Promise<void> = () => {};
  export let focusActivityCard: (activityId: string) => void | Promise<void> = () => {};
  export let planServiceRequest: (
    requestId: string,
    input: ProjectServiceRequestPlanInput
  ) => void | Promise<void> = () => {};
  export let submitActivity: () => void | Promise<void> = () => {};
  export let submitServiceRequest: () => void | Promise<void> = () => {};
  export let updateRequestStatus: (
    requestId: string,
    status: ProjectServiceRequestStatus
  ) => void | Promise<void> = () => {};
  export let updateActivityCommitment: (activityId: string, roleLabel: string | null) => void | Promise<void> =
    () => {};
  export let requestServiceRequestSettingsChange: (
    input: ProjectServiceRequestSettingsChangeInput
  ) => void | Promise<void> = () => {};
  export let voteOnRequestSettingsChange: (
    requestId: string,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  export let createPullRequest: (
    input: import('$lib/types/detail').ProjectSoftwarePullRequestInput
  ) => void | Promise<void> = () => {};
  export let requestMergeCapabilityChange: (
    input: import('$lib/types/detail').ProjectSoftwareMergeCapabilityChangeInput
  ) => void | Promise<void> = () => {};
  export let requestRepositoryReplacement: (
    input: import('$lib/types/detail').ProjectSoftwareRepositoryReplacementInput
  ) => void | Promise<void> = () => {};
  export let recordPullRequestMerge: (requestId: string, mergeId: string) => void | Promise<void> = () => {};
  export let votePullRequest: (
    requestId: string,
    vote: import('$lib/types/detail').ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  export let voteMergeCapabilityChange: (
    requestId: string,
    vote: import('$lib/types/detail').ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  export let voteRepositoryReplacement: (
    requestId: string,
    vote: import('$lib/types/detail').ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  export let toggleHistoryCompletion: (
    historyId: string,
    role: ProjectServiceHistoryCompletionRole,
    selection?: ProjectServiceHistoryCompletionChoice
  ) => void | Promise<void> = () => {};
  export let saveActivityRating: (
    activityId: string,
    rating: number,
    comment: string | null
  ) => void | Promise<void> = () => {};
</script>

{#if activePhaseId === 'phase-1'}
  <CollectiveServicePhaseOne
    {data}
    bind:draftValue
    bind:showValueComposer={showPhaseOneComposer}
    {importanceOptions}
    submitValue={submitValue}
    vote={setProjectValueVote}
  />
{:else if activePhaseId === 'phase-2'}
  <CollectiveServicePhaseTwo
    {data}
    form={productionForm}
    bind:showComposer={showPhaseTwoComposer}
    addPlanPhase={addProductionPlanPhase}
    submitPlan={submitProductionPlan}
    editingPlanId={editingProductionPlanId}
    startEditingPlan={startEditingProductionPlan}
    cancelEditingPlan={cancelEditingProductionPlan}
    isExpandedPlan={(planId) => isExpandedPlan('phase-2', planId)}
    {autoAssessPlanId}
    {autoAssessCriterionId}
    overallvote={setPhaseTwoPlanOverallVote}
    criterionvote={setPhaseTwoPlanCriterionRating}
  />
{:else if activePhaseId === 'phase-3'}
  <CollectiveServicePhaseThree
    {data}
    form={distributionForm}
    bind:showComposer={showPhaseThreeComposer}
    addPlanPhase={addDistributionPlanPhase}
    submitPlan={submitDistributionPlan}
    isExpandedPlan={(planId) => isExpandedPlan('phase-3', planId)}
    {autoAssessPlanId}
    {autoAssessCriterionId}
    overallvote={setPhaseThreePlanOverallVote}
    criterionvote={setPhaseThreePlanCriterionRating}
  />
{:else if activePhaseId === 'phase-5'}
  <CollectiveServicePhaseFive
    {data}
    bind:activityComposerElement
    bind:serviceRequestComposerElement
    {activityForm}
    {highlightedActivityId}
    {highlightedRequestId}
    bind:selectedRequestActivityId
    openComposer={openActivityComposer}
    openComposerForDay={openActivityComposerForDay}
    openRequestComposer={openRequestComposer}
    openRequestComposerForDay={openRequestComposerForDay}
    openRequestComposerForActivity={openRequestComposerForActivity}
    closeRequestComposer={closeRequestComposer}
    {focusActivityCard}
    {planServiceRequest}
    {serviceRequestForm}
    {serviceRequestFeedback}
    bind:showComposer={showPhaseFiveComposer}
    bind:showRequestComposer
    {submitActivity}
    {submitServiceRequest}
    {updateRequestStatus}
    changecommitment={updateActivityCommitment}
    {requestServiceRequestSettingsChange}
    {voteOnRequestSettingsChange}
    {createPullRequest}
    {requestMergeCapabilityChange}
    {requestRepositoryReplacement}
    recordPullRequestMerge={recordPullRequestMerge}
    {votePullRequest}
    {voteMergeCapabilityChange}
    {voteRepositoryReplacement}
    {toggleHistoryCompletion}
    {saveActivityRating}
  />
{:else}
  <CollectiveServicePhaseSix projectMode={data.projectMode} />
{/if}
