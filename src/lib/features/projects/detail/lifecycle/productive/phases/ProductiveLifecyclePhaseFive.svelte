<script lang="ts">
  import { tick } from 'svelte';
  import ActivitySchedulingPanel from '$lib/features/projects/detail/components/ActivitySchedulingPanel.svelte';
  import ProjectSoftwareGovernancePanel from '$lib/features/projects/detail/components/ProjectSoftwareGovernancePanel.svelte';
  import { focusEndedActivityCard } from '$lib/features/projects/detail/lifecycle/projectLifecycleNavigation';
  import type {
    ProjectActivityRoleInput,
    ProjectPageData,
    ProjectServiceHistoryCompletionChoice,
    ProjectServiceHistoryCompletionRole,
    ProjectSoftwareMergeCapabilityChangeInput,
    ProjectSoftwarePullRequestInput,
    ProjectSoftwareRepositoryReplacementInput
  } from '$lib/types/detail';

  type ActivityForm = {
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

  export let data: ProjectPageData;
  export let activityForm: ActivityForm;
  export let showComposer = false;
  export let highlightedActivityId: string | null = null;
  export let highlightedHistoryId: string | null = null;
  export let openComposer: () => void | Promise<void> = () => {};
  export let openComposerForDay: (isoDay: string) => void | Promise<void> = () => {};
  export let focusActivityCard: (activityId: string) => void | Promise<void> = () => {};
  export let submitActivity: () => void | Promise<void> = () => {};
  export let changecommitment: (activityId: string, roleLabel: string | null) => void | Promise<void> = () => {};
  export let createPullRequest: (input: ProjectSoftwarePullRequestInput) => void | Promise<void> = () => {};
  export let requestMergeCapabilityChange: (
    input: ProjectSoftwareMergeCapabilityChangeInput
  ) => void | Promise<void> = () => {};
  export let requestRepositoryReplacement: (
    input: ProjectSoftwareRepositoryReplacementInput
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
  export let deleteActivityRating: (activityId: string) => void | Promise<void> = () => {};

  let historyOpen = false;
  let historyHighlightResetHandle: ReturnType<typeof setTimeout> | null = null;

  async function focusHistoryCard(historyId: string) {
    historyOpen = true;
    await focusEndedActivityCard(historyId, {
      tick,
      setHighlighted: (id) => {
        highlightedHistoryId = id;
      },
      getHighlighted: () => highlightedHistoryId,
      clearHandle: () => {
        if (historyHighlightResetHandle) {
          clearTimeout(historyHighlightResetHandle);
        }
      },
      setHandle: (handle) => {
        historyHighlightResetHandle = handle;
      }
    });
  }

  async function toggleActivityComposer() {
    if (showComposer) {
      showComposer = false;
      return;
    }

    await openComposer();
  }

  function closeComposer() {
    showComposer = false;
  }

  $: calendarActivities = [
    ...data.lifecycle.phaseFive.activities,
    ...data.lifecycle.phaseFive.history
      .filter((item) => item.historyState !== 'request-only')
      .map((item) => item.activity)
  ];
</script>

<section id="participation-activities" class="phase-surface">
  {#if data.lifecycle.currentSubtype === 'software'}
    {#if data.lifecycle.phaseFive.softwareGovernance}
      <ProjectSoftwareGovernancePanel
        governance={data.lifecycle.phaseFive.softwareGovernance}
        createPullRequest={createPullRequest}
        requestMergeCapabilityChange={requestMergeCapabilityChange}
        requestRepositoryReplacement={requestRepositoryReplacement}
        recordMerge={recordPullRequestMerge}
        {votePullRequest}
        {voteMergeCapabilityChange}
        {voteRepositoryReplacement}
      />
    {:else}
      <div class="software-governance-placeholder">
        <h3>Software governance</h3>
        <p>Pull request tools appear here once a leading software plan is approved for this project.</p>
      </div>
    {/if}
  {/if}

  <ActivitySchedulingPanel
    {calendarActivities}
    liveActivities={data.lifecycle.phaseFive.activities}
    historyItems={data.lifecycle.phaseFive.history}
    canCreate={data.lifecycle.phaseFive.viewerCanCreateActivities}
    {showComposer}
    createActive={showComposer}
    selectedDayIso={activityForm.scheduledAt}
    {highlightedActivityId}
    {highlightedHistoryId}
    bind:historyOpen
    {activityForm}
    selectablePlanPhases={data.lifecycle.phaseFive.selectablePlanPhases}
    liveTitle="Activity setup"
    liveDescription="Schedule productive work blocks and track which ones have enough committed roles to activate."
    historyDescription="Past productive activity, ratings, and completion check-in."
    emptyLiveMessage="No activities scheduled yet."
    emptyHistoryMessage="No activity has moved into history yet."
    {submitActivity}
    {closeComposer}
    daySelect={openComposerForDay}
    createAction={toggleActivityComposer}
    {changecommitment}
    {toggleHistoryCompletion}
    {saveActivityRating}
    {deleteActivityRating}
    onLiveActivitySelect={focusActivityCard}
    onHistoryActivitySelect={focusHistoryCard}
  />
</section>

<style>
  .phase-surface {
    display: grid;
    gap: 12px;
  }

  .software-governance-placeholder {
    display: grid;
    gap: 8px;
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .software-governance-placeholder h3,
  .software-governance-placeholder p {
    margin: 0;
  }

  .software-governance-placeholder p {
    color: var(--text-soft);
    line-height: 1.45;
  }
</style>
