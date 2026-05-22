<script lang="ts">
  import ProductiveLifecyclePhaseOne from './phases/ProductiveLifecyclePhaseOne.svelte';
  import ProductiveLifecyclePhaseTwo from './phases/ProductiveLifecyclePhaseTwo.svelte';
  import ProductiveLifecyclePhaseThree from './phases/ProductiveLifecyclePhaseThree.svelte';
  import ProductiveLifecyclePhaseFive from './phases/ProductiveLifecyclePhaseFive.svelte';
  import ProductiveLifecyclePhaseSix from './phases/ProductiveLifecyclePhaseSix.svelte';
  import type {
    ProjectActivityRoleInput,
    ProjectServiceHistoryCompletionChoice,
    ProjectServiceHistoryCompletionRole,
    ProjectApprovalVote,
    ProjectImportanceVoteValue,
    ProjectLifecyclePhaseId,
    ProjectPageData
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
    locationLabel: string;
    roleRequirements: ProjectActivityRoleInput[];
    linkedPlanPhaseId: string | null;
    note: string;
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
  export let editingProductionPlanId: string | null = null;
  export let startEditingProductionPlan: (planId: string) => void | Promise<void> = () => {};
  export let cancelEditingProductionPlan: () => void | Promise<void> = () => {};
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
  export let updateActivityCommitment: (activityId: string, roleLabel: string | null) => void | Promise<void> =
    () => {};
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
  export let toggleHistoryCompletion: (
    historyId: string,
    role: ProjectServiceHistoryCompletionRole,
    selection?: ProjectServiceHistoryCompletionChoice
  ) => void | Promise<void> = () => {};
</script>

{#if activePhaseId === 'phase-1'}
  <ProductiveLifecyclePhaseOne
    {data}
    bind:draftValue
    bind:showValueComposer={showPhaseOneComposer}
    {importanceOptions}
    submitValue={submitValue}
    vote={setProjectValueVote}
  />
{:else if activePhaseId === 'phase-2'}
  <ProductiveLifecyclePhaseTwo
    {data}
    form={productionForm}
    bind:showComposer={showPhaseTwoComposer}
    addPlanPhase={addProductionPlanPhase}
    removePlanPhase={removeProductionPlanPhase}
    submitPlan={submitProductionPlan}
    editingPlanId={editingProductionPlanId}
    startEditingPlan={startEditingProductionPlan}
    cancelEditingPlan={cancelEditingProductionPlan}
    isExpandedPlan={(planId) => isExpandedPlan('phase-2', planId)}
    valuevote={setPhaseTwoPlanValueVote}
    overallvote={setPhaseTwoPlanOverallVote}
  />
{:else if activePhaseId === 'phase-3'}
  <ProductiveLifecyclePhaseThree
    {data}
    form={distributionForm}
    bind:showComposer={showPhaseThreeComposer}
    addPlanPhase={addDistributionPlanPhase}
    removePlanPhase={removeDistributionPlanPhase}
    submitPlan={submitDistributionPlan}
    isExpandedPlan={(planId) => isExpandedPlan('phase-3', planId)}
    valuevote={setPhaseThreePlanValueVote}
    overallvote={setPhaseThreePlanOverallVote}
  />
{:else if activePhaseId === 'phase-5'}
  <ProductiveLifecyclePhaseFive
    {data}
    bind:activityComposerElement
    bind:activityEndInputElement
    bind:activityStartInputElement
    {activityForm}
    {highlightedActivityId}
    openComposer={openActivityComposer}
    openComposerForDay={openActivityComposerForDay}
    {focusActivityCard}
    bind:showComposer={showPhaseFiveComposer}
    {submitActivity}
    changecommitment={updateActivityCommitment}
    {createPullRequest}
    {requestMergeCapabilityChange}
    {requestRepositoryReplacement}
    recordPullRequestMerge={recordPullRequestMerge}
    {toggleHistoryCompletion}
  />
{:else if activePhaseId === 'phase-6' || activePhaseId === 'phase-7'}
  <ProductiveLifecyclePhaseSix
    {data}
    {activePhaseId}
    {createPullRequest}
    {requestMergeCapabilityChange}
    {requestRepositoryReplacement}
    recordPullRequestMerge={recordPullRequestMerge}
  />
{/if}
