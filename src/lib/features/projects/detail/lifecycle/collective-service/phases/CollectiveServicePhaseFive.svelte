<script lang="ts">
  import { tick } from 'svelte';
  import CollapsibleServiceRequestCard from '$lib/components/cards/project-detail/CollapsibleServiceRequestCard.svelte';
  import ActivityCreationWizard from '$lib/components/shared/ActivityCreationWizard.svelte';
  import CollapsibleActivityCard from '$lib/components/cards/project-detail/CollapsibleActivityCard.svelte';
  import ProjectActivityCalendarCard from '$lib/components/cards/project-detail/ProjectActivityCalendarCard.svelte';
  import ActivityHistorySection from '$lib/features/projects/detail/components/ActivityHistorySection.svelte';
  import ProjectSoftwareGovernancePanel from '$lib/features/projects/detail/components/ProjectSoftwareGovernancePanel.svelte';
  import VoteCardFooter from '$lib/components/shared/VoteCardFooter.svelte';
  import ProjectActivityRolesEditor from '$lib/components/forms/project-detail/ProjectActivityRolesEditor.svelte';
  import {
    formatProjectVoteRequirement,
    formatProjectVoteSummary
  } from '$lib/utils/projectVotes';
  import type { ProjectSubtype } from '$lib/types/feed';
  import type {
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

  type RequestPlanningForm = {
    title: string;
    locationLabel: string;
    roleRequirements: ProjectActivityRoleInput[];
    linkedPlanPhaseId: string | null;
    note: string;
  };

  type RequestSettingsForm = {
    enabled: boolean;
    requestMode: 'calendar' | 'direct' | 'both';
    allowOffScheduleRequests: boolean;
    reason: string;
  };

  type ComparableRequestSettings = Omit<RequestSettingsForm, 'reason'>;

  type SpecializedRequestForm = {
    requestUse: 'project' | 'individual';
    itemSummary: string;
    pickupLabel: string;
    destinationLabel: string;
    description: string;
    needsDelivery: boolean;
  };

  type RequestComposerCopy = {
    sectionTitle: string;
    actionLabel: string;
    composerTitle: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    startLabel: string;
    endLabel: string;
    submitLabel: string;
    selectionHelp: string;
    usesAssetFields: boolean;
    usesDeliveryFields: boolean;
    itemLabel?: string;
    itemPlaceholder?: string;
    pickupLabel?: string;
    destinationLabel?: string;
    titlePlaceholder?: string;
    bodyPlaceholder?: string;
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
  export let requestServiceRequestSettingsChange: (
    input: ProjectServiceRequestSettingsChangeInput
  ) => void | Promise<void> = () => {};
  export let voteOnRequestSettingsChange: (
    requestId: string,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
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

  let historyOpen = false;

  function createDraftActivityRole(label = ''): ProjectActivityRoleInput {
    return {
      label,
      requiredCount: 1
    };
  }

  function createRequestPlanningForm(request?: ProjectServiceRequestItem): RequestPlanningForm {
    return {
      title: request?.title ?? '',
      locationLabel: data.locationLabel,
      roleRequirements: [createDraftActivityRole('Service lead')],
      linkedPlanPhaseId: '',
      note: request?.body ?? ''
    };
  }

  function createRequestSettingsForm(): RequestSettingsForm {
    const settings = data.lifecycle.requestSystem?.settings;

    return {
      enabled: settings?.enabled ?? false,
      requestMode: settings?.requestMode ?? 'both',
      allowOffScheduleRequests: settings?.allowOffScheduleRequests ?? false,
      reason: ''
    };
  }

  function createSpecializedRequestForm(): SpecializedRequestForm {
    return {
      requestUse: 'project',
      itemSummary: '',
      pickupLabel: '',
      destinationLabel: '',
      description: '',
      needsDelivery: false
    };
  }

  function currentSubtype(): ProjectSubtype {
    return data.lifecycle.currentSubtype ?? data.projectSubtype ?? 'standard';
  }

  function requestComposerCopy(subtype: ProjectSubtype): RequestComposerCopy {
    switch (subtype) {
      case 'asset-management':
        return {
          sectionTitle: 'Asset requests',
          actionLabel: 'Request assets',
          composerTitle: 'Create asset request',
          descriptionLabel: 'Description',
          descriptionPlaceholder:
            'Describe the land access, asset support, storage need, or handoff coordination needed during this time.',
          startLabel: 'Requested start',
          endLabel: 'Requested finish',
          submitLabel: 'Create request',
          selectionHelp:
            'Use this form when the inventory list is not the entry point for asset-management work.',
          usesAssetFields: true,
          usesDeliveryFields: false,
          itemLabel: 'Asset, site use, or handoff need',
          itemPlaceholder: 'What needs managing, moving, reserving, or supporting?'
        };
      default:
        return {
          sectionTitle: 'Requests',
          actionLabel: 'Request service',
          composerTitle: 'Create request',
          descriptionLabel: 'Request details',
          descriptionPlaceholder: 'What should happen during this requested window?',
          startLabel: 'Requested start',
          endLabel: 'Requested finish',
          submitLabel: 'Create request',
          selectionHelp: 'Use this form to request service during the selected time.',
          usesAssetFields: false,
          usesDeliveryFields: false,
          titlePlaceholder: 'Request title',
          bodyPlaceholder: 'What should happen during this requested window?'
        };
    }
  }

  function buildSpecializedRequestPayload(subtype: ProjectSubtype, form: SpecializedRequestForm) {
    if (subtype === 'asset-management') {
      const itemSummary = form.itemSummary.trim();
      const description = form.description.trim();

      if (!itemSummary || !description) {
        return null;
      }

      return {
        title: `Asset request: ${itemSummary}`,
        body: [
          `Use type: ${form.requestUse === 'project' ? 'Project use' : 'Individual use'}`,
          `Delivery needed: ${form.needsDelivery ? 'Yes' : 'No'}`,
          `Asset-management need: ${itemSummary}`,
          '',
          description
        ].join('\n')
      };
    }

    const title = serviceRequestForm.title.trim();
    const body = serviceRequestForm.body.trim();

    if (!title || !body) {
      return null;
    }

    return { title, body };
  }

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

  function scrollHistoryCardIntoView(historyId: string) {
    if (typeof document === 'undefined') {
      return;
    }

    document.getElementById(`history-card-${historyId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  async function focusHistoryCard(historyId: string) {
    if (historyHighlightResetHandle) {
      clearTimeout(historyHighlightResetHandle);
    }

    highlightedHistoryId = historyId;
    await tick();
    scrollHistoryCardIntoView(historyId);

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollHistoryCardIntoView(historyId);
        });
      });
    }

    historyHighlightResetHandle = setTimeout(() => {
      if (highlightedHistoryId === historyId) {
        highlightedHistoryId = null;
      }

      historyHighlightResetHandle = null;
    }, 1800);
  }

  function closeComposer() {
    showComposer = false;
  }

  function closeCalendarActionTarget() {
    calendarActionTarget = null;
    calendarActionAnchor = null;
  }

  function resetRequestPlanningForm() {
    requestPlanningForm = createRequestPlanningForm();
  }

  function closeRequestPlanning() {
    planningRequestId = null;
    resetRequestPlanningForm();
  }

  function scrollComposerIntoView(element: HTMLElement | null) {
    if (typeof window === 'undefined' || !element) {
      return;
    }

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  async function openRequestPlanning(request: ProjectServiceRequestItem) {
    planningRequestId = request.id;
    requestPlanningForm = createRequestPlanningForm(request);

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
    const payload = buildSpecializedRequestPayload(requestFormSubtype, specializedRequestForm);

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

  async function handleDaySelection(isoDay: string, anchor?: CalendarActionAnchor) {
    if (calendarActionTarget?.kind === 'day' && calendarActionTarget.isoDay === isoDay) {
      closeCalendarActionTarget();
      return;
    }

    if (showRequestComposer) {
      activeTab = 'live';
      closeCalendarActionTarget();
      await openRequestComposerForDay(isoDay);
      return;
    }

    if (showComposer) {
      activeTab = 'live';
      closeCalendarActionTarget();
      await openComposerForDay(isoDay);
      return;
    }

    if (canCreateActivities && canSubmitRequests) {
      calendarActionAnchor = anchor ?? null;
      calendarActionTarget = { kind: 'day', isoDay };
      return;
    }

    if (canSubmitRequests) {
      activeTab = 'live';
      closeCalendarActionTarget();
      await openRequestComposerForDay(isoDay);
      return;
    }

    if (canCreateActivities) {
      activeTab = 'live';
      closeCalendarActionTarget();
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

  async function toggleRequestSettingsComposerPanel() {
    const willOpen = !showRequestSettingsComposer;

    if (!willOpen) {
      closeRequestSettingsComposer();
      return;
    }

    requestSettingsForm = createRequestSettingsForm();
    showRequestSettingsComposer = true;
    showRequestSettingsVote = false;
    await tick();
    scrollComposerIntoView(requestSettingsComposerElement);

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        scrollComposerIntoView(requestSettingsComposerElement);
      });
    }
  }

  function closeRequestSettingsComposer() {
    showRequestSettingsComposer = false;
    requestSettingsForm = createRequestSettingsForm();
  }

  function toggleRequestSettingsVotePanel() {
    showRequestSettingsVote = !showRequestSettingsVote;
    showRequestSettingsComposer = false;
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
  let calendarActionAnchor: CalendarActionAnchor | null = null;
  let actionPickerElement: HTMLDivElement | null = null;
  let highlightedHistoryId: string | null = null;
  let historyHighlightResetHandle: ReturnType<typeof setTimeout> | null = null;
  let planningRequestId: string | null = null;
  let requestPlanningForm: RequestPlanningForm = createRequestPlanningForm();
  let showRequestSettingsComposer = false;
  let showRequestSettingsVote = false;
  let requestSettingsForm: RequestSettingsForm = createRequestSettingsForm();
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
  $: canCreateActivities = data.lifecycle.phaseFive.viewerCanCreateActivities;
  $: canSubmitRequests = data.lifecycle.requestSystem?.viewerCanSubmitRequests ?? false;
  $: hasQuickAction = canCreateActivities || canSubmitRequests;
  $: calendarSelectedDayIso = showRequestComposer ? serviceRequestForm.scheduledAt : activityForm.scheduledAt;
  $: calendarSelectedActivityId =
    selectedRequestActivityId ??
    (calendarActionTarget?.kind === 'activity' ? calendarActionTarget.activityId : '');
  $: actionPickerStyle = buildActionPickerStyle(
    calendarActionAnchor,
    actionPickerElement?.offsetHeight ?? 260
  );
  $: requestSettingsVotes = data.lifecycle.requestSystem?.settingsChangeRequests ?? [];
  $: requestSettingsVoteCount = requestSettingsVotes.length;
  $: requestHistory = data.lifecycle.phaseFive.history.filter((item) => item.source === 'request');
  $: selfPlannedHistory = data.lifecycle.phaseFive.history.filter(
    (item) => item.source === 'self-planned'
  );
  $: requestFormSubtype = currentSubtype();
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
    requestSettingsForm = createRequestSettingsForm();
  }
  $: if (!showRequestComposer) {
    specializedRequestForm = createSpecializedRequestForm();
  }
  $: if (requestSettingsVoteCount === 0) {
    showRequestSettingsVote = false;
  }
  $: if (highlightedActivityId || highlightedRequestId) {
    activeTab = 'live';
  }
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

  {#if calendarActionTarget}
    <div bind:this={actionPickerElement} class="mechanics-card action-picker-card" style={actionPickerStyle}>
      <div class="request-header-row">
        <div>
          <h3>
            {#if calendarActionTarget.kind === 'general'}
              Choose next step
            {:else if calendarActionTarget.kind === 'day'}
              Choose action for {calendarActionTarget.isoDay}
            {:else}
              Choose action for this slot
            {/if}
          </h3>
          <p>
            {#if calendarActionTarget.kind === 'general'}
              Start a new scheduled activity or open a new {requestFormCopy.actionLabel.toLowerCase()} form.
            {:else if calendarActionTarget.kind === 'activity'}
              Open the scheduled activity to sign up, or use its time window to place a {requestFormCopy.actionLabel.toLowerCase()} request.
            {:else}
              Choose whether this time should become a new activity or a {requestFormCopy.actionLabel.toLowerCase()} request.
            {/if}
          </p>
        </div>
      </div>

      <div class="action-picker-grid">
        {#if calendarActionTarget.kind === 'general' || calendarActionTarget.kind === 'day'}
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
        {:else}
          <button class="action-choice" type="button" on:click={chooseOpenActivity}>
            <strong>Open activity / sign up</strong>
            <span>Jump to the scheduled activity below the calendar and choose a role.</span>
          </button>
          {#if canSubmitRequests}
            <button class="action-choice" type="button" on:click={chooseRequestServiceForActivity}>
              <strong>{requestFormCopy.actionLabel}</strong>
              <span>Use this slot's window as the request time.</span>
            </button>
          {/if}
        {/if}
      </div>

      <div class="action-picker-actions">
        <button class="secondary-button" type="button" on:click={closeCalendarActionTarget}>Close</button>
      </div>
    </div>
  {/if}

  <ProjectActivityCalendarCard
    activities={calendarActivities}
    canCreate={hasQuickAction}
    createActive={showComposer || showRequestComposer || calendarActionTarget?.kind === 'general'}
    createAriaLabel="Open activity or request actions"
    selectedDayIso={calendarSelectedDayIso}
    selectedActivityId={calendarSelectedActivityId}
    daySelect={handleDaySelection}
    createAction={openQuickActions}
    activitySelect={handleActivitySelection}
  />

    {#if data.lifecycle.requestSystem}
      <section class="card-rail-section">
        <div class="section-head">
          <div class="section-copy">
            <h3>{requestFormCopy.sectionTitle}</h3>
            <p>{data.lifecycle.requestSystem.settings.summary}</p>
          </div>
          <div class="section-actions">
            {#if requestSettingsVoteCount > 0}
              <button class="vote-chip notice-chip" type="button" on:click={toggleRequestSettingsVotePanel}>
                Vote now ({requestSettingsVoteCount})
              </button>
            {/if}
            {#if data.lifecycle.requestSystem.viewerCanRequestSettingsChanges}
              <button
                class:active-toggle={showRequestSettingsComposer}
                class="secondary-button"
                type="button"
                on:click={toggleRequestSettingsComposerPanel}
              >
                Edit request settings
              </button>
            {/if}
          </div>
        </div>

        {#if requestSettingsVoteCount > 0 && showRequestSettingsVote}
          <div class="composer-card settings-panel">
            <div class="request-header-row">
              <div>
                <h3>Active request settings votes</h3>
                <p>
                  {#if requestSettingsVoteCount === 1}
                    One settings change vote is open right now.
                  {:else}
                    {requestSettingsVoteCount} settings change votes are open right now.
                  {/if}
                </p>
              </div>
            </div>

            <div class="surface-stack">
              {#each requestSettingsVotes as requestSettingsVote (requestSettingsVote.id)}
                <article class="vote-request-card">
                  <div class="vote-card-top">
                    <div class="vote-card-copy">
                      <span class="vote-kicker">Settings change</span>
                      <strong>{requestSettingsVote.proposedSettings.summary}</strong>
                    </div>
                    <span class="vote-requirement">
                      {formatProjectVoteRequirement(
                        requestSettingsVote.voteSummary,
                        requestSettingsVote.approvalThresholdPercent
                      )}
                    </span>
                  </div>

                  <p>{requestSettingsVote.reason}</p>

                  <div class="vote-summary-row">
                    <span>{formatProjectVoteSummary(requestSettingsVote.voteSummary)}</span>
                  </div>

                  <VoteCardFooter
                    authorUsername={requestSettingsVote.authorUsername}
                    createdAt={requestSettingsVote.createdAt}
                    activeVote={requestSettingsVote.voteSummary.activeVote}
                    canVote={data.lifecycle.requestSystem.viewerCanVoteOnSettingsChanges}
                    onVote={(vote) => voteOnRequestSettingsChange(requestSettingsVote.id, vote)}
                  />
                </article>
              {/each}
            </div>
          </div>
        {/if}

        {#if showRequestSettingsComposer && data.lifecycle.requestSystem.viewerCanRequestSettingsChanges}
          <div bind:this={requestSettingsComposerElement} class="composer-card settings-panel">
            <div class="request-header-row">
              <div>
                <h3>Edit request settings</h3>
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

            <div class="composer-actions">
              <button class="secondary-button" type="button" on:click={closeRequestSettingsComposer}>
                Cancel
              </button>
              <button
                class="primary-button"
                disabled={!requestSettingsCanSubmit}
                type="button"
                on:click={submitRequestSettingsChange}
              >
                Start vote
              </button>
            </div>
          </div>
        {/if}

        {#if canSubmitRequests && showRequestComposer}
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

            <div class="composer-actions">
              <button class="secondary-button" type="button" on:click={handleCloseRequestComposer}>Cancel</button>
              <button class="primary-button" type="button" on:click={handleSubmitServiceRequest}>{requestFormCopy.submitLabel}</button>
            </div>
          </div>
        {/if}

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
            onSubmit={submitActivity}
            onCancel={closeComposer}
          />
        </div>
      {/if}

      {#if data.lifecycle.phaseFive.activities.length === 0}
        <div class="empty-card">No future activity scheduled yet.</div>
      {:else}
        <div class="card-rail">
          {#each data.lifecycle.phaseFive.activities as activity (activity.id)}
            <div id={`activity-card-${activity.id}`} class="rail-card">
              <CollapsibleActivityCard
                activity={activity}
                expanded={highlightedActivityId === activity.id}
                highlighted={highlightedActivityId === activity.id}
                changecommitment={changecommitment}
              />
            </div>
          {/each}
        </div>
      {/if}
    </section>
  <details class="history-section" bind:open={historyOpen}>
    <summary class="history-summary">
      <span>History</span>
      <span class="history-count">{data.lifecycle.phaseFive.history.length}</span>
    </summary>
    <div class="history-stack">
      <ActivityHistorySection
        title="Request history"
        description="Requests that moved into past activity."
        items={requestHistory}
        emptyMessage="No request-based activity has moved into history yet."
        {highlightedHistoryId}
        {toggleHistoryCompletion}
        {saveActivityRating}
      />

      <ActivityHistorySection
        title="Self planned history"
        description="Past activity the collective created directly."
        items={selfPlannedHistory}
        emptyMessage="No self-planned activity has moved into history yet."
        {highlightedHistoryId}
        {toggleHistoryCompletion}
        {saveActivityRating}
      />
    </div>
  </details>
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
  .composer-card,
  .mechanics-card,
  .surface-stack,
  .number-grid {
    display: grid;
    gap: 12px;
  }

  .request-header-row,
  .composer-actions,
  .vote-summary-row,
  .section-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }

  .request-header-row,
  .composer-actions,
  .section-actions {
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
    max-height: min(34rem, 72vh);
    overflow-y: auto;
    align-items: start;
    padding-right: 2px;
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

  .notice-chip {
    border-color: color-mix(in srgb, var(--brand) 45%, var(--panel-border));
    color: var(--text-main);
  }

  .notice-chip {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: color-mix(in srgb, var(--brand-soft) 72%, var(--panel));
  }

  .settings-panel {
    background: color-mix(in srgb, var(--brand-soft) 24%, var(--panel-strong));
    scroll-margin-top: 92px;
  }

  .vote-request-card {
    display: grid;
    gap: 12px;
    padding: 16px;
    border: 1px solid color-mix(in srgb, var(--brand) 16%, var(--panel-border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--panel) 82%, var(--panel-strong));
  }

  .vote-card-top {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .vote-card-copy {
    display: grid;
    gap: 4px;
  }

  .vote-kicker {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .vote-requirement {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-main);
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

  .secondary-button.active-toggle {
    border-color: color-mix(in srgb, var(--brand-strong) 62%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 46%, var(--panel));
    color: var(--brand-strong);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 24%, transparent);
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