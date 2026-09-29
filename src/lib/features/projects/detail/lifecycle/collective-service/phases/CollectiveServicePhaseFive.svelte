<script lang="ts">
  import { tick } from 'svelte';
  import CollapsibleServiceRequestCard from '$lib/components/cards/project-detail/CollapsibleServiceRequestCard.svelte';
  import ActivityCreationWizard from '$lib/components/shared/ActivityCreationWizard.svelte';
  import CollapsibleActivityCard from '$lib/components/cards/project-detail/CollapsibleActivityCard.svelte';
  import ProjectActivityCalendarCard from '$lib/components/cards/project-detail/ProjectActivityCalendarCard.svelte';
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import PhaseWorkToolbar from '$lib/components/shared/PhaseWorkToolbar.svelte';
  import RoundPlusButton from '$lib/components/shared/RoundPlusButton.svelte';
  import DecisionHistoryCard from '$lib/components/shared/DecisionHistoryCard.svelte';
  import ActivityHistorySection from '$lib/features/projects/detail/components/ActivityHistorySection.svelte';
  import ProjectSoftwareGovernancePanel from '$lib/features/projects/detail/components/ProjectSoftwareGovernancePanel.svelte';
  import { focusEndedActivityCard } from '$lib/features/projects/detail/lifecycle/projectLifecycleNavigation';
  import { isProjectActivityPhase } from '$lib/features/projects/projectMode';
  import ProjectActivityRolesEditor from '$lib/components/forms/project-detail/ProjectActivityRolesEditor.svelte';
  import {
    buildSpecializedRequestPayload,
    createDraftActivityRole,
    createRequestPlanningForm,
    createRequestSettingsForm,
    createSpecializedRequestForm,
    currentCollectiveSubtype,
    requestComposerCopy,
    type ComparableRequestSettings,
    type RequestComposerCopy,
    type RequestPlanningForm,
    type RequestSettingsForm,
    type SpecializedRequestForm
  } from '$lib/features/projects/detail/lifecycle/collective-service/collectiveServiceRequestForms';
  import type {
    DecisionHistoryEntry,
    ProjectActivityRoleInput,
    ProjectApprovalVote,
    ProjectPageData,
    ProjectServiceHistoryCompletionChoice,
    ProjectServiceHistoryCompletionRole,
    ProjectServiceRequestItem,
    ProjectServiceRequestPlanInput,
    ProjectServiceRequestSettingsChangeInput,
    ProjectServiceRequestStatus,
    ProjectSoftwarePullRequestInput,
    ProjectSoftwareMergeCapabilityChangeInput,
    ProjectSoftwareRepositoryReplacementInput
  } from '$lib/types/detail';
  import { buildActivityLocationQuickPicks } from '$lib/utils/activityLocationQuickPicks';
  import {
    declineProjectActivityRoleSuggestion,
    suggestProjectActivityRole
  } from '$lib/services/commands/projects';
  import { invalidateProjectDetail } from '$lib/utils/detailInvalidation';

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

  type CalendarActionTarget =
    | { kind: 'general' }
    | { kind: 'day'; isoDay: string }
    | { kind: 'activity'; activityId: string }
    | null;

  type CalendarActionAnchor = {
    clientX: number;
    clientY: number;
  };

  type ServiceTab = 'live' | 'history';
  type RequestSettingsVote = NonNullable<
    NonNullable<ProjectPageData['lifecycle']['requestSystem']>['settingsChangeRequests']
  >[number];

  export let data: ProjectPageData;
  export let activityForm: ActivityForm;
  export let serviceRequestForm: {
    title: string;
    body: string;
    scheduledAt: string;
    endsAt: string;
  };
  export let serviceRequestFeedback = '';
  export let showComposer = false;
  export let showRequestComposer = false;
  export let highlightedActivityId: string | null = null;
  export let highlightedRequestId: string | null = null;
  export let highlightedHistoryId: string | null = null;
  export let selectedRequestActivityId: string | null = null;
  export let activityComposerElement: HTMLElement | null = null;
  export let serviceRequestComposerElement: HTMLElement | null = null;
  export let openComposer: () => void | Promise<void> = () => {};
  export let openComposerForDay: (isoDay: string) => void | Promise<void> = () => {};
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
  export let changecommitment: (activityId: string, roleLabel: string | null) => void | Promise<void> = () => {};

  async function suggestRole(activityId: string, roleId: string, userId: string) {
    await suggestProjectActivityRole(data.slug, activityId, roleId, userId);
    await invalidateProjectDetail(data.slug);
  }

  async function declineRoleSuggestion(activityId: string, roleId: string) {
    await declineProjectActivityRoleSuggestion(data.slug, activityId, roleId);
    await invalidateProjectDetail(data.slug);
  }
  export let requestServiceRequestSettingsChange: (
    input: ProjectServiceRequestSettingsChangeInput
  ) => void | Promise<void> = () => {};
  export let voteOnRequestSettingsChange: (
    requestId: string,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  $: void voteOnRequestSettingsChange;
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
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  export let voteMergeCapabilityChange: (
    requestId: string,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  export let voteRepositoryReplacement: (
    requestId: string,
    vote: ProjectApprovalVote | null
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

  function resolveRequestSettings(
    settings?: ComparableRequestSettings | NonNullable<ProjectPageData['lifecycle']['requestSystem']>['settings'] | null
  ): ComparableRequestSettings {
    const enabled = settings?.enabled ?? false;
    const requestMode = settings?.requestMode ?? 'both';

    return {
      enabled,
      requestMode,
      allowOffScheduleRequests:
        enabled && requestMode === 'both' ? (settings?.allowOffScheduleRequests ?? false) : false
    };
  }

  function requestSettingsMatch(
    left: ComparableRequestSettings,
    right: ComparableRequestSettings
  ) {
    return (
      left.enabled === right.enabled &&
      left.requestMode === right.requestMode &&
      left.allowOffScheduleRequests === right.allowOffScheduleRequests
    );
  }

  function formatRequestedWindow(start?: string, end?: string) {
    if (!start || !end) {
      return 'Requested time pending';
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    const dayLabel = startDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const startLabel = startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const endLabel = endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    return `${dayLabel} · ${startLabel} to ${endLabel}`;
  }

  function minimumParticipantsForRoles(roleRequirements: ProjectActivityRoleInput[]) {
    return roleRequirements.reduce(
      (total, role) => total + Math.max(1, Number(role.requiredCount) || 1),
      0
    );
  }

  function buildActionPickerStyle(anchor: CalendarActionAnchor | null, popupHeight: number) {
    const maxWidth = 'min(320px, calc(100vw - 24px))';

    if (!anchor || typeof window === 'undefined') {
      return `left: 12px; top: 12px; width: ${maxWidth}; transform: none;`;
    }

    const popupWidth = Math.min(320, Math.max(220, window.innerWidth - 24));
    const left = Math.max(12, Math.min(anchor.clientX + 14, window.innerWidth - popupWidth - 12));
    const top = Math.max(12, Math.min(anchor.clientY + 14, window.innerHeight - popupHeight - 12));

    return `left: ${left}px; top: ${top}px; width: ${maxWidth}; transform: none;`;
  }

  function historyItemByActivityId(activityId: string) {
    return data.lifecycle.phaseFive.history.find((item) => item.activity.id === activityId) ?? null;
  }

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

  function closeComposer() {
    showComposer = false;
  }

  function closeCalendarActionTarget() {
    calendarActionTarget = null;
    calendarActionAnchor = null;
  }

  function resetRequestPlanningForm() {
    requestPlanningForm = createRequestPlanningForm(data);
  }

  function closeRequestPlanning() {
    planningRequestId = null;
    resetRequestPlanningForm();
  }

  async function openRequestPlanning(request: ProjectServiceRequestItem) {
    planningRequestId = request.id;
    requestPlanningForm = createRequestPlanningForm(data, request);

    if (showRequestComposer) {
      await closeRequestComposer();
    }
  }

  async function submitRequestPlanning(requestId: string) {
    const roleRequirements = requestPlanningForm.roleRequirements.filter((role) => role.label.trim());

    if (
      !requestPlanningForm.title.trim() ||
      !requestPlanningForm.locationLabel.trim() ||
      !requestPlanningForm.note.trim() ||
      roleRequirements.length === 0
    ) {
      return;
    }

    await planServiceRequest(requestId, {
      title: requestPlanningForm.title,
      locationLabel: requestPlanningForm.locationLabel,
      roleRequirements: requestPlanningForm.roleRequirements,
      linkedPlanPhaseId: requestPlanningForm.linkedPlanPhaseId || null,
      note: requestPlanningForm.note
    });

    closeRequestPlanning();
  }

  async function handleSubmitServiceRequest() {
    const payload = buildSpecializedRequestPayload(
      requestFormSubtype,
      specializedRequestForm,
      serviceRequestForm
    );

    if (!payload) {
      return;
    }

    serviceRequestForm.title = payload.title;
    serviceRequestForm.body = payload.body;
    await submitServiceRequest();
    specializedRequestForm = createSpecializedRequestForm();
  }

  async function handleCloseRequestComposer() {
    specializedRequestForm = createSpecializedRequestForm();
    await closeRequestComposer();
  }

  async function openQuickActions(anchor?: CalendarActionAnchor) {
    planningRequestId = null;

    if (calendarActionTarget?.kind === 'general') {
      closeCalendarActionTarget();
      return;
    }

    if (showComposer) {
      closeComposer();
    }

    if (showRequestComposer) {
      await closeRequestComposer();
    }

    if (canCreateActivities && canSubmitRequests) {
      calendarActionAnchor = anchor ?? null;
      calendarActionTarget = { kind: 'general' };
      return;
    }

    if (canCreateActivities) {
      activeTab = 'live';
      await openComposer();
      return;
    }

    if (canSubmitRequests) {
      activeTab = 'live';
      await openRequestComposer();
    }
  }

  async function handleDaySelection(isoDay: string, _anchor?: CalendarActionAnchor) {
    previewDayIso = isoDay;
    closeCalendarActionTarget();

    if (showRequestComposer) {
      await openRequestComposerForDay(isoDay);
      return;
    }

    if (showComposer) {
      await openComposerForDay(isoDay);
    }
  }

  async function handleActivitySelection(activityId: string, anchor?: CalendarActionAnchor) {
    const historyItem = historyItemByActivityId(activityId);

    if (historyItem && historyItem.historyState !== 'request-only') {
      historyOpen = true;
      closeCalendarActionTarget();
      await focusHistoryCard(historyItem.id);
      return;
    }

    if (showRequestComposer) {
      activeTab = 'live';
      closeCalendarActionTarget();
      await openRequestComposerForActivity(activityId);
      return;
    }

    if (canSubmitRequests) {
      calendarActionAnchor = anchor ?? null;
      calendarActionTarget = { kind: 'activity', activityId };
      return;
    }

    closeCalendarActionTarget();
    await focusActivityCard(activityId);
  }

  async function chooseCreateActivity() {
    const target = calendarActionTarget;

    if (!target) {
      return;
    }

    if (target.kind === 'general') {
      activeTab = 'live';
      closeCalendarActionTarget();
      await openComposer();
      return;
    }

    if (target.kind !== 'day') {
      return;
    }

    activeTab = 'live';
    closeCalendarActionTarget();
    await openComposerForDay(target.isoDay);
  }

  function chooseSubmitPullRequest() {
    closeCalendarActionTarget();
    softwareGovernancePanel?.openCreatePullRequest();
  }

  async function chooseRequestServiceForDay() {
    const target = calendarActionTarget;

    if (!target) {
      return;
    }

    if (target.kind === 'general') {
      activeTab = 'live';
      closeCalendarActionTarget();
      await openRequestComposer();
      return;
    }

    if (target.kind !== 'day') {
      return;
    }

    activeTab = 'live';
    closeCalendarActionTarget();
    await openRequestComposerForDay(target.isoDay);
  }

  async function chooseOpenActivity() {
    if (calendarActionTarget?.kind !== 'activity') {
      return;
    }

    const activityId = calendarActionTarget.activityId;

    activeTab = 'live';
    closeCalendarActionTarget();
    await focusActivityCard(activityId);
  }

  async function chooseRequestServiceForActivity() {
    if (calendarActionTarget?.kind !== 'activity') {
      return;
    }

    const activityId = calendarActionTarget.activityId;

    activeTab = 'live';
    closeCalendarActionTarget();
    await openRequestComposerForActivity(activityId);
  }

  async function openDockedActivity() {
    activeTab = 'live';
    closeCalendarActionTarget();

    if (previewDayIso) {
      await openComposerForDay(previewDayIso);
      return;
    }

    await openComposer();
  }

  async function openDockedServiceRequest() {
    activeTab = 'live';
    closeCalendarActionTarget();

    if (selectedLiveActivityId) {
      await openRequestComposerForActivity(selectedLiveActivityId);
      return;
    }

    if (previewDayIso) {
      await openRequestComposerForDay(previewDayIso);
      return;
    }

    await openRequestComposer();
  }

  function openDockedRequestSettings() {
    requestSettingsForm = createRequestSettingsForm(data);
    showRequestSettingsComposer = true;
  }

  function closeRequestSettingsComposer() {
    showRequestSettingsComposer = false;
    requestSettingsForm = createRequestSettingsForm(data);
  }

  async function submitRequestSettingsChange() {
    if (!requestSettingsCanSubmit) {
      return;
    }

    await requestServiceRequestSettingsChange({
      reason: requestSettingsForm.reason,
      enabled: requestSettingsForm.enabled,
      requestMode: requestSettingsForm.requestMode,
      allowOffScheduleRequests:
        requestSettingsForm.requestMode === 'both' && requestSettingsForm.allowOffScheduleRequests
    });

    showRequestSettingsComposer = false;
  }

  let activeTab: ServiceTab = 'live';
  let calendarActionTarget: CalendarActionTarget = null;
  let previewDayIso = '';
  let showRequestsSheet = false;
  let calendarActionAnchor: CalendarActionAnchor | null = null;
  let actionPickerElement: HTMLDivElement | null = null;
  let softwareGovernancePanel: ProjectSoftwareGovernancePanel | null = null;
  let historyHighlightResetHandle: ReturnType<typeof setTimeout> | null = null;
  let planningRequestId: string | null = null;
  let requestPlanningForm: RequestPlanningForm = createRequestPlanningForm(data);
  let showRequestSettingsComposer = false;
  let requestSettingsForm: RequestSettingsForm = createRequestSettingsForm(data);
  let requestSettingsComposerElement: HTMLDivElement | null = null;
  let specializedRequestForm: SpecializedRequestForm = createSpecializedRequestForm();

  $: minimumParticipants = minimumParticipantsForRoles(activityForm.roleRequirements);
  $: requestPlanningMinimumParticipants = minimumParticipantsForRoles(
    requestPlanningForm.roleRequirements
  );
  $: selectedRequestActivity =
    data.lifecycle.phaseFive.activities.find((activity) => activity.id === selectedRequestActivityId) ?? null;
  $: sortedRequests = [...(data.lifecycle.requestSystem?.requests ?? [])].sort(
    (left, right) => +new Date(right.createdAt) - +new Date(left.createdAt)
  );
  $: canCreateActivities =
    isProjectActivityPhase(data.projectMode, data.lifecycle.currentPhaseId) &&
    data.lifecycle.phaseFive.viewerCanCreateActivities;
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
      sourceLabel: 'Plan location'
    },
    {
      id: 'distribution-plan',
      label: winningDistributionPlan?.locationLabel,
      locationId: winningDistributionPlan?.locationId,
      sourceLabel: 'Distribution plan'
    }
  ]);
  $: canSubmitRequests = data.lifecycle.requestSystem?.viewerCanSubmitRequests ?? false;
  $: calendarSelectedDayIso =
    previewDayIso || (showRequestComposer ? serviceRequestForm.scheduledAt : activityForm.scheduledAt);
  $: calendarSelectedActivityId =
    selectedRequestActivityId ??
    (calendarActionTarget?.kind === 'activity' ? calendarActionTarget.activityId : '');
  $: selectedLiveActivityId = data.lifecycle.phaseFive.activities.some(
    (activity) => activity.id === calendarSelectedActivityId
  )
    ? calendarSelectedActivityId
    : '';
  $: actionPickerStyle = buildActionPickerStyle(
    calendarActionAnchor,
    actionPickerElement?.offsetHeight ?? 260
  );
  $: if (highlightedRequestId) {
    showRequestsSheet = true;
  }
  $: requestHistory = data.lifecycle.phaseFive.history.filter((item) => item.source === 'request');
  $: selfPlannedHistory = data.lifecycle.phaseFive.history.filter(
    (item) => item.source === 'self-planned'
  );
  $: softwareGovernanceHistory = data.history.filter((entry) =>
    SOFTWARE_GOVERNANCE_HISTORY_KINDS.has(entry.kind)
  );
  $: calendarHistoryCount =
    data.lifecycle.phaseFive.history.length + softwareGovernanceHistory.length;
  $: unifiedCalendarHistory = (
    [
      ...data.lifecycle.phaseFive.history.map((item) => ({
        kind: 'activity' as const,
        at: item.activity.endAt || item.activity.scheduledAt || item.activity.startAt || '',
        item
      })),
      ...softwareGovernanceHistory.map((item) => ({
        kind: 'governance' as const,
        at: item.createdAt,
        item
      }))
    ] as Array<
      | { kind: 'activity'; at: string; item: (typeof data.lifecycle.phaseFive.history)[number] }
      | { kind: 'governance'; at: string; item: DecisionHistoryEntry }
    >
  ).sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime());

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
  $: requestFormSubtype = currentCollectiveSubtype(data);
  $: requestFormCopy = requestComposerCopy(requestFormSubtype);
  $: calendarActivities = [
    ...data.lifecycle.phaseFive.activities,
    ...data.lifecycle.phaseFive.history
      .filter((item) => item.historyState !== 'request-only' && item.activity.statusTone === 'green')
      .map((item) => item.activity)
  ];
  $: currentRequestSettings = resolveRequestSettings(data.lifecycle.requestSystem?.settings);
  $: draftRequestSettings = resolveRequestSettings(requestSettingsForm);
  $: requestSettingsChanged = !requestSettingsMatch(currentRequestSettings, draftRequestSettings);
  $: requestSettingsCanSubmit = requestSettingsChanged && requestSettingsForm.reason.trim().length > 0;
  $: if (!showRequestSettingsComposer) {
    requestSettingsForm = createRequestSettingsForm(data);
  }
  $: if (!showRequestComposer) {
    specializedRequestForm = createSpecializedRequestForm();
  }
  $: if (highlightedRequestId) {
    showRequestsSheet = true;
    activeTab = 'live';
  }
  $: canSubmitPullRequest =
    data.lifecycle.currentSubtype === 'software' &&
    !!data.lifecycle.phaseFive.softwareGovernance?.viewerCanCreatePullRequests;
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

  {#if calendarActionTarget && calendarActionTarget.kind !== 'activity'}
    <div bind:this={actionPickerElement} class="mechanics-card action-picker-card" style={actionPickerStyle}>
      <div class="request-header-row">
        <div>
          <h3>
            {#if calendarActionTarget.kind === 'day'}
              Choose action for {calendarActionTarget.isoDay}
            {:else}
              Choose next step
            {/if}
          </h3>
          <p>
            {#if calendarActionTarget.kind === 'day'}
              Choose whether this time should become a new activity{canSubmitPullRequest ? ', a pull request,' : ''} or a {requestFormCopy.actionLabel.toLowerCase()} request.
            {:else}
              Start a scheduled activity{canSubmitPullRequest ? ', submit a pull request,' : ''} or open a new {requestFormCopy.actionLabel.toLowerCase()} form.
            {/if}
          </p>
        </div>
      </div>

      <div class="action-picker-grid">
        {#if canCreateActivities}
          <button class="action-choice" type="button" on:click={chooseCreateActivity}>
            <strong>Create activity</strong>
            <span>
              {calendarActionTarget.kind === 'day'
                ? 'Open the activity planner with this day prefilled.'
                : 'Open the activity planner.'}
            </span>
          </button>
        {/if}
        {#if canSubmitPullRequest && calendarActionTarget.kind === 'general'}
          <button class="action-choice" type="button" on:click={chooseSubmitPullRequest}>
            <strong>Submit pull request</strong>
            <span>Open the existing software governance wizard when the change itself needs approval.</span>
          </button>
        {/if}
        {#if canSubmitRequests}
          <button class="action-choice" type="button" on:click={chooseRequestServiceForDay}>
            <strong>{requestFormCopy.actionLabel}</strong>
            <span>
              {calendarActionTarget.kind === 'day'
                ? 'Open the request form and prefill the selected time.'
                : 'Open the request form.'}
            </span>
          </button>
        {/if}
      </div>

      <div class="action-picker-actions">
        <button class="secondary-button" type="button" on:click={closeCalendarActionTarget}>Close</button>
      </div>
    </div>
  {/if}

  {#if calendarActionTarget?.kind === 'activity'}
    <OverlaySheet
      open
      hideClose
      elevated
      title="This time slot"
      labelledById="slot-action-sheet"
      on:close={closeCalendarActionTarget}
    >
      <div class="slot-sheet-copy">
        <p>Open the scheduled activity to sign up, or use its time window to place a request.</p>
        <div class="slot-choice">
          <strong>Open activity / sign up</strong>
          <span>Jump to the scheduled activity and choose a role.</span>
        </div>
        <div class="slot-choice">
          <strong>{requestFormCopy.actionLabel}</strong>
          <span>Use this slot's window as the request time.</span>
        </div>
      </div>
      <svelte:fragment slot="footer">
        <div class="sheet-actions">
          <button class="sheet-cancel" type="button" on:click={closeCalendarActionTarget}>Cancel</button>
          <button class="sheet-cancel" type="button" on:click={chooseOpenActivity}>Open activity</button>
          <button class="sheet-submit" type="button" on:click={chooseRequestServiceForActivity}>
            {requestFormCopy.actionLabel}
          </button>
        </div>
      </svelte:fragment>
    </OverlaySheet>
  {/if}

  <ProjectActivityCalendarCard
    activities={calendarActivities}
    canCreate={false}
    createActive={showComposer || showRequestComposer || calendarActionTarget?.kind === 'general'}
    createAriaLabel="Open activity or request actions"
    createButtonLabel="Add"
    selectedDayIso={calendarSelectedDayIso}
    selectedActivityId={calendarSelectedActivityId}
    daySelect={handleDaySelection}
    createAction={openQuickActions}
    activitySelect={handleActivitySelection}
  />

  <PhaseWorkToolbar>
    {#if canCreateActivities}
      <RoundPlusButton
        standout
        label="Create activity"
        ariaLabel="Create activity"
        participationAction="create-activity"
        action={() => openDockedActivity()}
      />
    {/if}
    {#if selectedLiveActivityId}
      <RoundPlusButton
        label="Open activity"
        ariaLabel="Open activity and sign up for a service role"
        participationAction="open-activity"
        action={() => focusActivityCard(selectedLiveActivityId)}
      />
    {/if}
    {#if canSubmitRequests}
      <RoundPlusButton
        standout={!canCreateActivities}
        label={requestFormCopy.actionLabel}
        ariaLabel={requestFormCopy.actionLabel}
        participationAction="request-service"
        action={() => openDockedServiceRequest()}
      />
    {/if}
    {#if data.lifecycle.requestSystem && (data.lifecycle.requestSystem.viewerCanReviewRequests || sortedRequests.length > 0)}
      <RoundPlusButton
        label="Requests"
        ariaLabel="Show service requests"
        participationAction="review-requests"
        action={() => (showRequestsSheet = true)}
      />
    {/if}
    {#if data.lifecycle.requestSystem?.viewerCanRequestSettingsChanges}
      <RoundPlusButton
        label="Request settings"
        ariaLabel="Request service settings changes"
        participationAction="request-settings"
        action={() => openDockedRequestSettings()}
      />
    {/if}
    <svelte:fragment slot="governance">
      {#if data.lifecycle.phaseFive.softwareGovernance?.viewerCanCreatePullRequests}
        <RoundPlusButton
          label="Pull request"
          ariaLabel="New pull request"
          participationAction="make-pull-request"
          action={() => softwareGovernancePanel?.openCreatePullRequest()}
        />
      {/if}
      {#if data.lifecycle.phaseFive.softwareGovernance?.viewerCanRequestRepositoryReplacement}
        <RoundPlusButton
          label="Replace repository"
          ariaLabel="Replace repository"
          participationAction="replace-repository"
          action={() => softwareGovernancePanel?.openSoftwareWizard('repository-replacement')}
        />
      {/if}
      {#if data.lifecycle.phaseFive.softwareGovernance?.viewerCanRequestMergeCapabilityChanges}
        <RoundPlusButton
          label="Merge capability"
          ariaLabel="Change merge capability"
          participationAction="change-merge-capability"
          action={() => softwareGovernancePanel?.openSoftwareWizard('merge-capability')}
        />
      {/if}
    </svelte:fragment>
  </PhaseWorkToolbar>

    {#if data.lifecycle.requestSystem}
      <OverlaySheet bind:open={showRequestsSheet} title={requestFormCopy.sectionTitle} labelledById="collective-requests-sheet">
      <section class="card-rail-section">
        <div class="section-head">
          <div class="section-copy">
            <h3>{requestFormCopy.sectionTitle}</h3>
            <p>{data.lifecycle.requestSystem.settings.summary}</p>
          </div>
        </div>

        {#if !data.lifecycle.requestSystem.enabled && sortedRequests.length === 0}
          <div class="empty-card">Requests are currently turned off.</div>
        {:else if sortedRequests.length === 0}
          <div class="empty-card">No open requests right now.</div>
        {:else}
          <div class="card-rail">
            {#each sortedRequests as request}
              <div id={`request-card-${request.id}`} class="rail-card">
                <CollapsibleServiceRequestCard
                  request={request}
                  expanded={planningRequestId === request.id || highlightedRequestId === request.id}
                  highlighted={highlightedRequestId === request.id}
                >
                  {#if data.lifecycle.requestSystem.viewerCanReviewRequests && request.status === 'open'}
                    <div class="composer-actions review-actions">
                      <button class="vote-chip" type="button" on:click={() => openRequestPlanning(request)}>
                        Plan request
                      </button>
                      <button
                        class="vote-chip negative"
                        type="button"
                        on:click={() => updateRequestStatus(request.id, 'declined')}
                      >
                        Decline
                      </button>
                    </div>
                  {/if}

                  {#if planningRequestId === request.id}
                    <div class="composer-card planner-card">
                      <input bind:value={requestPlanningForm.title} maxlength="120" placeholder="Scheduled activity title" />
                      <input bind:value={requestPlanningForm.locationLabel} maxlength="120" placeholder="Place" />
                      <select bind:value={requestPlanningForm.linkedPlanPhaseId}>
                        <option value="" disabled>Choose stage</option>
                        {#each data.lifecycle.phaseFive.selectablePlanPhases as stage}
                          <option value={stage.id}>{stage.label}</option>
                        {/each}
                      </select>
                      <ProjectActivityRolesEditor bind:roles={requestPlanningForm.roleRequirements} />
                      <div class="count-field">
                        <span class="count-field-label">
                          <span class="field-inline-label">Minimum people:</span>
                          <span class="count-note">Calculated from the role minimums above.</span>
                        </span>
                        <div class="count-readout">
                          <strong>{requestPlanningMinimumParticipants}</strong>
                        </div>
                      </div>
                      <textarea
                        bind:value={requestPlanningForm.note}
                        rows="3"
                        placeholder="How should this request be carried out?"
                      ></textarea>
                      <div class="composer-actions">
                        <button class="secondary-button" type="button" on:click={closeRequestPlanning}>
                          Cancel
                        </button>
                        <button class="primary-button" type="button" on:click={() => submitRequestPlanning(request.id)}>
                          Schedule activity
                        </button>
                      </div>
                    </div>
                  {/if}
                </CollapsibleServiceRequestCard>
              </div>
            {/each}
          </div>
        {/if}
      </section>
      </OverlaySheet>

      <OverlaySheet
        bind:open={showRequestComposer}
        hideClose
        title={requestFormCopy.composerTitle}
        labelledById="collective-request-form-sheet"
        on:close={handleCloseRequestComposer}
      >
        
          <div bind:this={serviceRequestComposerElement} class="composer-card">
            {#if selectedRequestActivity}
              <div class="selection-note">
                <strong>{selectedRequestActivity.title}</strong>
                <span>{formatRequestedWindow(selectedRequestActivity.startAt, selectedRequestActivity.endAt)}</span>
              </div>
            {/if}
            <div class="request-header-row">
              <div>
                <h3>{requestFormCopy.composerTitle}</h3>
                <p>{requestFormCopy.selectionHelp}</p>
              </div>
            </div>

            <div class="number-grid">
              <label>
                <span class="field-inline-label">{requestFormCopy.startLabel}</span>
                <input bind:value={serviceRequestForm.scheduledAt} type="datetime-local" />
              </label>
              <label>
                <span class="field-inline-label">{requestFormCopy.endLabel}</span>
                <input bind:value={serviceRequestForm.endsAt} type="datetime-local" />
              </label>
            </div>

            {#if requestFormCopy.usesDeliveryFields}
              <div class="number-grid">
                <label>
                  <span class="field-inline-label">{requestFormCopy.pickupLabel}</span>
                  <input bind:value={specializedRequestForm.pickupLabel} maxlength="120" placeholder="Where should pickup happen?" />
                </label>
                <label>
                  <span class="field-inline-label">{requestFormCopy.destinationLabel}</span>
                  <input bind:value={specializedRequestForm.destinationLabel} maxlength="120" placeholder="Where should it go?" />
                </label>
              </div>
              <label>
                <span class="field-inline-label">{requestFormCopy.itemLabel}</span>
                <input bind:value={specializedRequestForm.itemSummary} maxlength="160" placeholder={requestFormCopy.itemPlaceholder} />
              </label>
              <label>
                <span class="field-inline-label">{requestFormCopy.descriptionLabel}</span>
                <textarea
                  bind:value={specializedRequestForm.description}
                  rows="3"
                  placeholder={requestFormCopy.descriptionPlaceholder}
                ></textarea>
              </label>
            {:else if requestFormCopy.usesAssetFields}
              <label>
                <span class="field-inline-label">Use type</span>
                <select bind:value={specializedRequestForm.requestUse}>
                  <option value="project">Project use</option>
                  <option value="individual">Individual use</option>
                </select>
              </label>
              <label>
                <span class="field-inline-label">{requestFormCopy.itemLabel}</span>
                <input bind:value={specializedRequestForm.itemSummary} maxlength="160" placeholder={requestFormCopy.itemPlaceholder} />
              </label>
              <label class="checkbox-row">
                <input bind:checked={specializedRequestForm.needsDelivery} type="checkbox" />
                <span>I will need delivery</span>
              </label>
              <label>
                <span class="field-inline-label">{requestFormCopy.descriptionLabel}</span>
                <textarea
                  bind:value={specializedRequestForm.description}
                  rows="3"
                  placeholder={requestFormCopy.descriptionPlaceholder}
                ></textarea>
              </label>
            {:else}
              <input bind:value={serviceRequestForm.title} maxlength="120" placeholder={requestFormCopy.titlePlaceholder} />
              <textarea
                bind:value={serviceRequestForm.body}
                rows="3"
                placeholder={requestFormCopy.bodyPlaceholder}
              ></textarea>
            {/if}

            {#if serviceRequestFeedback}
              <div class="feedback-card" role="status">{serviceRequestFeedback}</div>
            {/if}

            </div>
        <svelte:fragment slot="footer">
          <div class="sheet-actions">
            <button class="sheet-cancel" type="button" on:click={handleCloseRequestComposer}>Cancel</button>
            <button class="sheet-submit" type="button" on:click={handleSubmitServiceRequest}>Request</button>
          </div>
        </svelte:fragment>
      </OverlaySheet>

      {#if data.lifecycle.requestSystem.viewerCanRequestSettingsChanges}
        <OverlaySheet
          bind:open={showRequestSettingsComposer}
          hideClose
          title="Request settings"
          labelledById="collective-request-settings-sheet"
          on:close={closeRequestSettingsComposer}
        >
        
          <div bind:this={requestSettingsComposerElement} class="composer-card">
            <div class="request-header-row">
              <div>
                <h3>Request settings</h3>
                <p>Each vote runs on its own and applies automatically once it reaches 66% approval and the required vote count.</p>
              </div>
            </div>

            <label class="checkbox-row">
              <input bind:checked={requestSettingsForm.enabled} type="checkbox" />
              <span>Enable requests</span>
            </label>

            {#if requestSettingsForm.enabled}
              <label>
                <span class="field-inline-label">Request mode</span>
                <select bind:value={requestSettingsForm.requestMode}>
                  <option value="calendar">Scheduled slots only</option>
                  <option value="direct">Message requests only</option>
                  <option value="both">Scheduled slots and message requests</option>
                </select>
              </label>
              <p class="field-help">Scheduled slots start from listed times. Message requests let people write in without choosing a listed slot.</p>

              {#if requestSettingsForm.requestMode === 'both'}
                <label class="checkbox-row">
                  <input bind:checked={requestSettingsForm.allowOffScheduleRequests} type="checkbox" />
                  <span>Allow message requests when no slot is listed</span>
                </label>
              {/if}
            {/if}

            {#if !requestSettingsChanged}
              <p class="field-help">Choose a different request setup before adding a reason or starting a vote.</p>
            {/if}

            <label>
              <span class="field-inline-label">Reason</span>
              <textarea
                bind:value={requestSettingsForm.reason}
                disabled={!requestSettingsChanged}
                rows="3"
                placeholder={requestSettingsChanged
                  ? 'Explain why the request flow should change right now.'
                  : 'Choose a different request setup to unlock the reason field.'}
              ></textarea>
            </label>
          </div>
          <svelte:fragment slot="footer">
            <div class="sheet-actions">
              <button class="sheet-cancel" type="button" on:click={closeRequestSettingsComposer}>Cancel</button>
              <button
                class="sheet-submit"
                disabled={!requestSettingsCanSubmit}
                type="button"
                on:click={submitRequestSettingsChange}
              >
                Start vote
              </button>
            </div>
          </svelte:fragment>
        </OverlaySheet>
      {/if}
    {/if}

    <section class="card-rail-section">
      <div class="section-head">
        <div class="section-copy">
          <h3>Activity</h3>
          <p>
            {data.lifecycle.phaseFive.activities.length} future activity card{data.lifecycle.phaseFive.activities.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {#if canCreateActivities && showComposer}
        <div bind:this={activityComposerElement}>
          <ActivityCreationWizard
            open={showComposer}
            form={activityForm}
            selectablePlanPhases={data.lifecycle.phaseFive.selectablePlanPhases}
            {locationQuickPicks}
            onSubmit={submitActivity}
            onCancel={closeComposer}
          />
        </div>
      {/if}

      {#if data.lifecycle.phaseFive.activities.length === 0}
        <div class="empty-card">No activities scheduled yet.</div>
      {:else}
        <div class="card-rail">
          {#each data.lifecycle.phaseFive.activities as activity (activity.id)}
            <div id={`activity-card-${activity.id}`} class="rail-card">
              <CollapsibleActivityCard
                activity={activity}
                expanded={highlightedActivityId === activity.id}
                highlighted={highlightedActivityId === activity.id}
                changecommitment={changecommitment}
                viewerCanSuggest={data.viewerIsMember}
                onSuggestRole={suggestRole}
                onDeclineRoleSuggestion={declineRoleSuggestion}
              />
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {#if calendarHistoryCount > 0}
  <details class="history-section" bind:open={historyOpen}>
    <summary class="history-summary">
      <span>History</span>
      <span class="history-count">{calendarHistoryCount}</span>
    </summary>
    <div class="history-stack">
      {#if softwareGovernanceHistory.length > 0}
        <p class="unified-history-copy">
          Past requests, self-planned activity, and software governance decisions in one timeline. They also stay in the History tab.
        </p>
        <div class="unified-history">
          {#each unifiedCalendarHistory as entry (entry.kind === 'activity' ? entry.item.id : `gov-${entry.item.id}`)}
            {#if entry.kind === 'activity'}
              <ActivityHistorySection
                hideHeader={true}
                title=""
                description=""
                items={[entry.item]}
                emptyMessage=""
                {highlightedHistoryId}
                {toggleHistoryCompletion}
                {saveActivityRating}
                {deleteActivityRating}
              />
            {:else}
              <DecisionHistoryCard
                entry={entry.item}
                highlighted={highlightedHistoryId === entry.item.id}
                onVote={handleGovernanceVote}
              />
            {/if}
          {/each}
        </div>
      {:else}
        <ActivityHistorySection
          title="Request history"
          description="Requests that moved into past activity."
          items={requestHistory}
          emptyMessage="No request-based activity has moved into history yet."
          {highlightedHistoryId}
          {toggleHistoryCompletion}
          {saveActivityRating}
          {deleteActivityRating}
        />

        <ActivityHistorySection
          title="Self planned history"
          description="Past activity the collective created directly."
          items={selfPlannedHistory}
          emptyMessage="No self-planned activity has moved into history yet."
          {highlightedHistoryId}
          {toggleHistoryCompletion}
          {saveActivityRating}
          {deleteActivityRating}
        />
      {/if}
    </div>
  </details>
  {/if}
</section>

<style>
  .history-section {
    border-top: 1px solid var(--panel-border);
    padding-top: 12px;
  }

  .history-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    cursor: pointer;
    list-style: none;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 12px;
  }

  .history-summary::-webkit-details-marker {
    display: none;
  }

  .history-count {
    padding: 4px 8px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
  }

  .phase-surface,
  .card-rail-section,
  .history-stack,
  .unified-history,
  .composer-card,
  .mechanics-card,
  .number-grid {
    display: grid;
    gap: 12px;
  }

  .slot-sheet-copy {
    display: grid;
    gap: 12px;
    padding: 4px 20px 20px;
  }

  .slot-sheet-copy p,
  .slot-choice span {
    margin: 0;
    color: var(--text-soft);
    font-size: 15px;
    line-height: 1.5;
  }

  .slot-choice {
    display: grid;
    gap: 4px;
  }

  .slot-choice strong {
    color: var(--text-main);
    font-size: 15px;
  }

  .unified-history-copy {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.45;
  }

  :global(.overlay-footer:has(.sheet-actions)) {
    gap: 0;
    padding: 0 0 env(safe-area-inset-bottom);
  }

  .sheet-actions {
    display: flex;
    width: 100%;
  }

  .sheet-actions > .sheet-cancel,
  .sheet-actions > .sheet-submit {
    flex: 1 1 0;
  }

  .sheet-cancel,
  .sheet-submit {
    min-height: 56px;
    border: 0;
    border-radius: 0;
    font: inherit;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
  }

  .sheet-cancel {
    background: var(--panel-strong);
    color: var(--text-main);
    box-shadow: inset -1px 0 0 var(--panel-border);
  }

  .sheet-submit {
    background: var(--brand);
    color: var(--page-bg);
  }

  .request-header-row,
  .composer-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
  }

  .section-head,
  .card-rail,
  .action-picker-grid {
    display: grid;
    gap: 12px;
  }

  .section-head {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
  }

  .section-copy h3,
  .section-copy p {
    margin: 0;
  }

  .card-rail {
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    padding-right: 2px;
  }

  .card-rail:has(:global(.activity-card-shell)) {
    gap: 0;
  }

  .rail-card {
    min-width: 0;
  }

  .action-choice {
    width: 100%;
    display: grid;
    gap: 4px;
    padding: 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
    text-align: left;
  }

  .action-picker-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .action-picker-card {
    position: fixed;
    z-index: 30;
    box-shadow: 0 18px 36px color-mix(in srgb, black 18%, transparent);
    max-height: calc(100dvh - var(--topbar-height, 53px) - var(--shell-bottom-nav-offset, 0px) - 24px);
    overflow-y: auto;
  }

  .action-picker-actions {
    display: flex;
    justify-content: flex-end;
  }

  .composer-card,
  .empty-card,
  .mechanics-card,
  .feedback-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .feedback-card {
    color: var(--text-main);
    background: color-mix(in srgb, var(--brand-soft) 28%, var(--panel-strong));
  }

  .number-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .selection-note {
    display: grid;
    gap: 4px;
    padding: 12px 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .checkbox-row {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .checkbox-row input {
    width: auto;
  }

  .review-actions {
    justify-content: flex-start;
  }

  .planner-card {
    margin-top: 12px;
  }

  .count-field {
    display: grid;
    gap: 6px;
  }

  .count-field-label {
    display: flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: wrap;
  }

  .count-note {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 400;
  }

  .count-readout {
    width: 100%;
    min-height: 48px;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
    box-sizing: border-box;
    display: flex;
    align-items: center;
  }

  .count-readout strong {
    color: var(--text-main);
    font-size: 18px;
    line-height: 1;
  }

  .vote-chip.negative {
    color: var(--tablet-community-text);
  }

  .empty-card,
  p,
  span {
    color: var(--text-soft);
  }

  strong,
  h3,
  .field-inline-label {
    color: var(--text-main);
  }

  h3 {
    margin: 0;
  }

  input,
  textarea,
  select {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
  }

  [id^='activity-card-'] {
    scroll-margin-top: 92px;
  }

  textarea {
    min-height: 110px;
    resize: vertical;
  }

  .field-inline-label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 700;
  }

  .field-help {
    margin: 0;
    font-size: 12px;
  }

  .primary-button,
  .secondary-button,
  .vote-chip {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
  }

  .primary-button {
    background: var(--brand);
    color: var(--page-bg);
  }

  .secondary-button,
  .vote-chip {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    color: var(--text-soft);
  }

  @media (max-width: 760px) {
    .section-head,
    .number-grid,
    .action-picker-grid {
      grid-template-columns: 1fr;
    }

    .action-picker-actions {
      justify-content: flex-start;
    }
  }

</style>