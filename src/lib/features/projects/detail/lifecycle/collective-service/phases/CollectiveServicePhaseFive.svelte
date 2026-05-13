<script lang="ts">
  import CollapsibleServiceRequestCard from '$lib/components/cards/project-detail/CollapsibleServiceRequestCard.svelte';
  import CollapsibleActivityCard from '$lib/components/cards/project-detail/CollapsibleActivityCard.svelte';
  import ProjectActivityCalendarCard from '$lib/components/cards/project-detail/ProjectActivityCalendarCard.svelte';
  import CountBadge from '$lib/components/shared/CountBadge.svelte';
  import VoteCardFooter from '$lib/components/shared/VoteCardFooter.svelte';
  import ProjectActivityRolesEditor from '$lib/components/forms/project-detail/ProjectActivityRolesEditor.svelte';
  import {
    formatProjectVoteRequirement,
    formatProjectVoteSummary
  } from '$lib/utils/projectVotes';
  import { formatRelativeTime } from '$lib/utils/time';
  import type {
    ProjectActivityRoleInput,
    ProjectApprovalVote,
    ProjectPageData,
    ProjectServiceHistoryCompletionRole,
    ProjectServiceHistoryCompletionState,
    ProjectServiceRequestItem,
    ProjectServiceRequestPlanInput,
    ProjectServiceRequestSettingsChangeInput,
    ProjectServiceRequestStatus
  } from '$lib/types/detail';

  type ActivityForm = {
    title: string;
    scheduledAt: string;
    endsAt: string;
    locationLabel: string;
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
  export let showComposer = false;
  export let showRequestComposer = false;
  export let highlightedActivityId: string | null = null;
  export let selectedRequestActivityId: string | null = null;
  export let activityComposerElement: HTMLElement | null = null;
  export let serviceRequestComposerElement: HTMLElement | null = null;
  export let activityStartInputElement: HTMLInputElement | null = null;
  export let activityEndInputElement: HTMLInputElement | null = null;
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
  export let toggleHistoryCompletion: (
    historyId: string,
    role: ProjectServiceHistoryCompletionRole
  ) => void | Promise<void> = () => {};

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
      linkedPlanPhaseId: null,
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

  function completionStatusText(summary: ProjectServiceHistoryCompletionState) {
    if (summary.totalEligible === 0) {
      return 'No one eligible has checked in yet.';
    }

    return `${summary.doneCount}/${summary.totalEligible} marked done`;
  }

  function completionButtonLabel(summary: ProjectServiceHistoryCompletionState) {
    return summary.viewerHasMarkedDone ? 'Undo done mark' : 'Mark done';
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

    activeTab = 'live';
    closeCalendarActionTarget();
    await focusActivityCard(calendarActionTarget.activityId);
  }

  async function chooseRequestServiceForActivity() {
    if (calendarActionTarget?.kind !== 'activity') {
      return;
    }

    activeTab = 'live';
    closeCalendarActionTarget();
    await openRequestComposerForActivity(calendarActionTarget.activityId);
  }

  function openRequestSettingsComposerPanel() {
    requestSettingsForm = createRequestSettingsForm();
    showRequestSettingsComposer = true;
    showRequestSettingsVote = false;
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
    if (!requestSettingsForm.reason.trim()) {
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
  let planningRequestId: string | null = null;
  let requestPlanningForm: RequestPlanningForm = createRequestPlanningForm();
  let showRequestSettingsComposer = false;
  let showRequestSettingsVote = false;
  let requestSettingsForm: RequestSettingsForm = createRequestSettingsForm();

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
  $: if (!showRequestSettingsComposer) {
    requestSettingsForm = createRequestSettingsForm();
  }
  $: if (requestSettingsVoteCount === 0) {
    showRequestSettingsVote = false;
  }
</script>

<section class="phase-surface">
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
              Start a new scheduled activity or open a new service request.
            {:else if calendarActionTarget.kind === 'activity'}
              Open the scheduled activity to sign up, or use its time window to place a service request.
            {:else}
              Choose whether this time should become a new activity or a service request.
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
              <strong>Request service</strong>
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
              <strong>Request service</strong>
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
    activities={data.lifecycle.phaseFive.activities}
    canCreate={hasQuickAction}
    createActive={showComposer || showRequestComposer || calendarActionTarget?.kind === 'general'}
    createAriaLabel="Open activity or request actions"
    selectedDayIso={calendarSelectedDayIso}
    selectedActivityId={calendarSelectedActivityId}
    daySelect={handleDaySelection}
    createAction={openQuickActions}
    activitySelect={handleActivitySelection}
  />

  <div class="tab-row" role="tablist" aria-label="Service activity view">
    <button
      class:active-tab={activeTab === 'live'}
      class="tab-button"
      type="button"
      on:click={() => (activeTab = 'live')}
    >
      Live
    </button>
    <button
      class:active-tab={activeTab === 'history'}
      class="tab-button"
      type="button"
      on:click={() => (activeTab = 'history')}
    >
      History
      <span>{data.lifecycle.phaseFive.history.length}</span>
    </button>
  </div>

  {#if activeTab === 'live'}
    {#if data.lifecycle.requestSystem}
      <section class="card-rail-section">
        <div class="section-head">
          <div class="section-copy">
            <h3>Requests</h3>
            <p>{data.lifecycle.requestSystem.settings.summary}</p>
          </div>
          <div class="section-actions">
            {#if requestSettingsVoteCount > 0}
              <button class="vote-chip notice-chip" type="button" on:click={toggleRequestSettingsVotePanel}>
                Vote Active
                <CountBadge count={requestSettingsVoteCount} />
              </button>
            {/if}
            {#if data.lifecycle.requestSystem.viewerCanRequestSettingsChanges}
              <button class="secondary-button" type="button" on:click={openRequestSettingsComposerPanel}>
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
          <div class="composer-card settings-panel">
            <div class="request-header-row">
              <div>
                <h3>Edit request settings</h3>
                <p>Each vote runs on its own and applies automatically once it reaches 70% approval and the required vote count.</p>
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
                  <option value="calendar">Only through active calendar time</option>
                  <option value="direct">Direct written requests only</option>
                  <option value="both">Calendar and written requests</option>
                </select>
              </label>

              {#if requestSettingsForm.requestMode === 'both'}
                <label class="checkbox-row">
                  <input bind:checked={requestSettingsForm.allowOffScheduleRequests} type="checkbox" />
                  <span>Allow written requests outside existing activity windows</span>
                </label>
              {/if}
            {/if}

            <label>
              <span class="field-inline-label">Reason</span>
              <textarea
                bind:value={requestSettingsForm.reason}
                rows="3"
                placeholder="Explain why the request flow should change right now."
              ></textarea>
            </label>

            <div class="composer-actions">
              <button class="secondary-button" type="button" on:click={closeRequestSettingsComposer}>
                Cancel
              </button>
              <button class="primary-button" type="button" on:click={submitRequestSettingsChange}>
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
            <input bind:value={serviceRequestForm.title} maxlength="120" placeholder="Request title" />
            <div class="number-grid">
              <label>
                <span class="field-inline-label">Requested start</span>
                <input bind:value={serviceRequestForm.scheduledAt} type="datetime-local" />
              </label>
              <label>
                <span class="field-inline-label">Requested finish</span>
                <input bind:value={serviceRequestForm.endsAt} type="datetime-local" />
              </label>
            </div>
            <textarea
              bind:value={serviceRequestForm.body}
              rows="3"
              placeholder="What should happen during this requested window?"
            ></textarea>
            <div class="composer-actions">
              <button class="secondary-button" type="button" on:click={closeRequestComposer}>Cancel</button>
              <button class="primary-button" type="button" on:click={submitServiceRequest}>Create request</button>
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
              <div class="rail-card">
                <CollapsibleServiceRequestCard request={request} expanded={planningRequestId === request.id}>
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
                        <option value="">Choose stage</option>
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
        <div bind:this={activityComposerElement} class="composer-card">
          <input bind:value={activityForm.title} maxlength="120" placeholder="Activity title" />
          <div class="number-grid">
            <label>
              <span class="field-inline-label">Start time</span>
              <input bind:this={activityStartInputElement} bind:value={activityForm.scheduledAt} type="datetime-local" />
            </label>
            <label>
              <span class="field-inline-label">Finish time</span>
              <input bind:this={activityEndInputElement} bind:value={activityForm.endsAt} type="datetime-local" />
            </label>
          </div>
          <input bind:value={activityForm.locationLabel} maxlength="120" placeholder="Place" />
          <select bind:value={activityForm.linkedPlanPhaseId}>
            <option value="">Choose stage</option>
            {#each data.lifecycle.phaseFive.selectablePlanPhases as stage}
              <option value={stage.id}>{stage.label}</option>
            {/each}
          </select>

          <ProjectActivityRolesEditor bind:roles={activityForm.roleRequirements} />

          <div class="count-field">
            <span class="count-field-label">
              <span class="field-inline-label">Minimum people:</span>
              <span class="count-note">Calculated from the role minimums above. Leave a role max blank if it has no cap.</span>
            </span>
            <div class="count-readout">
              <strong>{minimumParticipants}</strong>
            </div>
          </div>
          <textarea bind:value={activityForm.note} rows="3" placeholder="What should happen in this activity?"></textarea>
          <div class="composer-actions">
            <button class="secondary-button" type="button" on:click={closeComposer}>Cancel</button>
            <button class="primary-button" type="button" on:click={submitActivity}>Create activity</button>
          </div>
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
                highlighted={highlightedActivityId === activity.id}
                changecommitment={changecommitment}
              />
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {:else}
    <div class="history-stack">
      <section class="card-rail-section">
        <div class="section-head">
          <div class="section-copy">
            <h3>Request history</h3>
            <p>Requests that moved into past activity.</p>
          </div>
        </div>

        {#if requestHistory.length === 0}
          <div class="empty-card">No request-based activity has moved into history yet.</div>
        {:else}
          <div class="card-rail">
            {#each requestHistory as item (item.id)}
              <div class="rail-card">
                <CollapsibleActivityCard
                  activity={item.activity}
                  badgeLabel="Completed"
                  badgeClass="complete"
                  readOnly={true}
                >
                  <div class="history-meta-row">
                    <span>Requester: {item.requesterUsername}</span>
                    <span>{formatRelativeTime(item.activity.endAt)}</span>
                  </div>

                  <div class="completion-grid">
                    {#if item.requesterCompletion}
                      <div class="completion-card">
                        <strong>{item.requesterCompletion.label}</strong>
                        <span>{completionStatusText(item.requesterCompletion)}</span>
                        {#if item.requesterCompletion.viewerCanToggle}
                          <button
                            class="vote-chip"
                            type="button"
                            on:click={() => toggleHistoryCompletion(item.id, 'requester')}
                          >
                            {completionButtonLabel(item.requesterCompletion)}
                          </button>
                        {/if}
                      </div>
                    {/if}

                    <div class="completion-card">
                      <strong>{item.participantCompletion.label}</strong>
                      <span>{completionStatusText(item.participantCompletion)}</span>
                      {#if item.participantCompletion.viewerCanToggle}
                        <button
                          class="vote-chip"
                          type="button"
                          on:click={() => toggleHistoryCompletion(item.id, 'participants')}
                        >
                          {completionButtonLabel(item.participantCompletion)}
                        </button>
                      {/if}
                    </div>
                  </div>
                </CollapsibleActivityCard>
              </div>
            {/each}
          </div>
        {/if}
      </section>

      <section class="card-rail-section">
        <div class="section-head">
          <div class="section-copy">
            <h3>Self planned history</h3>
            <p>Past activity the collective created directly.</p>
          </div>
        </div>

        {#if selfPlannedHistory.length === 0}
          <div class="empty-card">No self-planned activity has moved into history yet.</div>
        {:else}
          <div class="card-rail">
            {#each selfPlannedHistory as item (item.id)}
              <div class="rail-card">
                <CollapsibleActivityCard
                  activity={item.activity}
                  badgeLabel="Completed"
                  badgeClass="complete"
                  readOnly={true}
                >
                  <div class="completion-grid single-column">
                    <div class="completion-card">
                      <strong>{item.participantCompletion.label}</strong>
                      <span>{completionStatusText(item.participantCompletion)}</span>
                      {#if item.participantCompletion.viewerCanToggle}
                        <button
                          class="vote-chip"
                          type="button"
                          on:click={() => toggleHistoryCompletion(item.id, 'participants')}
                        >
                          {completionButtonLabel(item.participantCompletion)}
                        </button>
                      {/if}
                    </div>
                  </div>
                </CollapsibleActivityCard>
              </div>
            {/each}
          </div>
        {/if}
      </section>
    </div>
  {/if}
</section>

<style>
  .phase-surface,
  .card-rail-section,
  .history-stack,
  .composer-card,
  .mechanics-card,
  .surface-stack,
  .number-grid,
  .completion-grid {
    display: grid;
    gap: 12px;
  }

  .request-header-row,
  .composer-actions,
  .vote-summary-row,
  .section-actions,
  .history-meta-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }

  .request-header-row,
  .composer-actions,
  .section-actions,
  .history-meta-row {
    justify-content: space-between;
  }

  .section-head,
  .card-rail,
  .action-picker-grid,
  .tab-row,
  .completion-card {
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

  .tab-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tab-button {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    font-weight: 700;
    text-align: left;
  }

  .tab-button.active-tab {
    border-color: color-mix(in srgb, var(--brand) 45%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 50%, var(--panel));
    color: var(--text-main);
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
    max-height: calc(100vh - 24px);
    overflow-y: auto;
  }

  .action-picker-actions {
    display: flex;
    justify-content: flex-end;
  }

  .composer-card,
  .empty-card,
  .mechanics-card,
  .completion-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .completion-card {
    background: var(--panel);
  }

  .single-column {
    grid-template-columns: minmax(0, 1fr);
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
    .tab-row,
    .completion-grid {
      grid-template-columns: 1fr;
    }

    .action-picker-actions {
      justify-content: flex-start;
    }
  }
</style>