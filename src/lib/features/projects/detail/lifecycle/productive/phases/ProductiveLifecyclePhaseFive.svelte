<script lang="ts">
  import { tick } from 'svelte';
  import ActivitySchedulingPanel from '$lib/features/projects/detail/components/ActivitySchedulingPanel.svelte';
  import ProjectSoftwareGovernancePanel from '$lib/features/projects/detail/components/ProjectSoftwareGovernancePanel.svelte';
  import { focusEndedActivityCard } from '$lib/features/projects/detail/lifecycle/projectLifecycleNavigation';
  import type {
    DecisionHistoryEntry,
    ProjectActivityRoleInput,
    ProjectApprovalVote,
    ProjectPageData,
    ProjectServiceHistoryCompletionChoice,
    ProjectServiceHistoryCompletionRole,
    ProjectSoftwareMergeCapabilityChangeInput,
    ProjectSoftwarePullRequestInput,
    ProjectSoftwareRepositoryReplacementInput
  } from '$lib/types/detail';
  import { buildActivityLocationQuickPicks } from '$lib/utils/activityLocationQuickPicks';

  const SOFTWARE_GOVERNANCE_HISTORY_KINDS = new Set([
    'project-pull-request-approval',
    'project-pull-request-confirmation',
    'project-merge-capability-change',
    'project-repository-replacement'
  ]);

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
  export let recordPullRequestMerge: (
    requestId: string,
    mergeId: string,
    mergeUrl: string
  ) => void | Promise<void> = () => {};
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
  export let softwareWizardRequest: { mode: 'record-merge' | 'vote-pr'; requestId: string } | null = null;
  export let onSoftwareWizardRequestHandled: () => void = () => {};

  let historyOpen = false;
  let historyHighlightResetHandle: ReturnType<typeof setTimeout> | null = null;
  let softwareGovernancePanel: ProjectSoftwareGovernancePanel | null = null;

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

  function openSoftwarePullRequestWizard() {
    softwareGovernancePanel?.openCreatePullRequest();
  }

  $: calendarActivities = [
    ...data.lifecycle.phaseFive.activities,
    ...data.lifecycle.phaseFive.history
      .filter((item) => item.historyState !== 'request-only')
      .map((item) => item.activity)
  ];
  $: winningProductionPlan =
    data.lifecycle.phaseTwo.plans.find((plan) => plan.id === data.lifecycle.phaseTwo.winningPlanId) ??
    null;
  $: winningDistributionPlan =
    data.lifecycle.phaseThree.plans.find((plan) => plan.id === data.lifecycle.phaseThree.winningPlanId) ??
    null;
  $: locationQuickPicks = buildActivityLocationQuickPicks([
    {
      id: 'project-initial',
      label: data.locationLabel,
      locationId: data.locationId,
      sourceLabel: 'Project location'
    },
    {
      id: 'production-plan',
      label: winningProductionPlan?.locationLabel,
      locationId: winningProductionPlan?.locationId,
      sourceLabel: 'Production plan'
    },
    {
      id: 'distribution-plan',
      label: winningDistributionPlan?.locationLabel,
      locationId: winningDistributionPlan?.locationId,
      sourceLabel: 'Distribution plan'
    }
  ]);
  $: softwareGovernanceHistory = data.history.filter((entry) =>
    SOFTWARE_GOVERNANCE_HISTORY_KINDS.has(entry.kind)
  );
  $: historyDescription =
    data.lifecycle.currentSubtype === 'software'
      ? 'Past productive activity, ratings, completion check-in, and software governance decisions.'
      : 'Past productive activity, ratings, and completion check-in.';
  $: emptyHistoryMessage =
    data.lifecycle.currentSubtype === 'software'
      ? 'No activity or software governance has moved into history yet.'
      : 'No activity has moved into history yet.';
  $: canSubmitPullRequest =
    data.lifecycle.currentSubtype === 'software' &&
    !!data.lifecycle.phaseFive.softwareGovernance?.viewerCanCreatePullRequests;

  async function handleGovernanceVote(entry: DecisionHistoryEntry, vote: ProjectApprovalVote | null) {
    switch (entry.kind) {
      case 'project-pull-request-approval':
      case 'project-pull-request-confirmation':
        await votePullRequest(entry.id, vote);
        break;
      case 'project-merge-capability-change':
        await voteMergeCapabilityChange(entry.id, vote);
        break;
      case 'project-repository-replacement':
        await voteRepositoryReplacement(entry.id, vote);
        break;
      default:
        break;
    }
  }
</script>

<section id="participation-activities" class="phase-surface">
  {#if data.lifecycle.currentSubtype === 'software'}
    {#if data.lifecycle.phaseFive.softwareGovernance}
      <ProjectSoftwareGovernancePanel
        bind:this={softwareGovernancePanel}
        governance={data.lifecycle.phaseFive.softwareGovernance}
        createPullRequest={createPullRequest}
        requestMergeCapabilityChange={requestMergeCapabilityChange}
        requestRepositoryReplacement={requestRepositoryReplacement}
        recordMerge={recordPullRequestMerge}
        {votePullRequest}
        {softwareWizardRequest}
        {onSoftwareWizardRequestHandled}
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
    governanceHistory={softwareGovernanceHistory}
    canCreate={data.lifecycle.phaseFive.viewerCanCreateActivities}
    {showComposer}
    createActive={showComposer}
    selectedDayIso={activityForm.scheduledAt}
    {highlightedActivityId}
    {highlightedHistoryId}
    bind:historyOpen
    {activityForm}
    selectablePlanPhases={data.lifecycle.phaseFive.selectablePlanPhases}
    {locationQuickPicks}
    liveTitle="Activity setup"
    liveDescription="Schedule productive work blocks and track which ones have enough committed roles to activate."
    {historyDescription}
    emptyLiveMessage="No activities scheduled yet."
    {emptyHistoryMessage}
    {submitActivity}
    {closeComposer}
    daySelect={openComposerForDay}
    createAction={toggleActivityComposer}
    canSubmitPullRequest={canSubmitPullRequest}
    openPullRequestWizard={openSoftwarePullRequestWizard}
    {changecommitment}
    {toggleHistoryCompletion}
    {saveActivityRating}
    {deleteActivityRating}
    onGovernanceVote={handleGovernanceVote}
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
