<script lang="ts">
  import { tick } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import CollapsibleServiceRequestCard from '$lib/components/cards/project-detail/CollapsibleServiceRequestCard.svelte';
  import ActivityAgendaList from '$lib/components/cards/project-detail/ActivityAgendaList.svelte';
  import ProjectActivityCalendarCard from '$lib/components/cards/project-detail/ProjectActivityCalendarCard.svelte';
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import PhaseWorkToolbar from '$lib/components/shared/PhaseWorkToolbar.svelte';
  import RoundPlusButton from '$lib/components/shared/RoundPlusButton.svelte';
  import DirectUsePolicyNotice from '$lib/components/shared/DirectUsePolicyNotice.svelte';
  import ActivityHistorySection from '$lib/features/projects/detail/components/ActivityHistorySection.svelte';
  import { focusEndedActivityCard } from '$lib/features/projects/detail/lifecycle/projectLifecycleNavigation';
  import { getDisplayTimezone, listDisplayTimezones } from '$lib/stores/timezoneStore';
  import type {
    ProjectActivityRoleInput,
    ProjectApprovalVote,
    ProjectPageData,
    ProjectServiceHistoryCompletionChoice,
    ProjectServiceHistoryCompletionRole,
    ProjectServiceRequestInput,
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
    inputTimeZone?: string;
  };

  type RequestSettingsForm = {
    enabled: boolean;
    requestMode: 'calendar' | 'direct' | 'both';
    allowOffScheduleRequests: boolean;
    reason: string;
  };

  type ComparableRequestSettings = Omit<RequestSettingsForm, 'reason'>;

  type ServiceTab = 'live' | 'history';

  export let data: ProjectPageData;
  export let highlightedActivityId: string | null = null;
  export let highlightedRequestId: string | null = null;
  export let highlightedHistoryId: string | null = null;
  export let showPersonalActivityComposer = false;
  export let showPersonalServiceRequestComposer = false;
  export let serviceRequestForm: ProjectServiceRequestInput;
  export let activityForm: ActivityForm;
  export let activityComposerElement: HTMLElement | null = null;
  export let serviceRequestComposerElement: HTMLElement | null = null;
  export let activityStartInputElement: HTMLInputElement | null = null;
  export let activityEndInputElement: HTMLInputElement | null = null;
  export let updateRequestStatus: (
    requestId: string,
    status: ProjectServiceRequestStatus,
    holdSlot?: boolean,
    reason?: string | null
  ) => void | Promise<void> = () => {};
  export let createAvailabilityRule: (input: {
    weekday: number;
    startTime: string;
    endTime: string;
    timezone?: string;
    note?: string;
  }) => void | Promise<void> = () => {};
  export let deleteAvailabilityRule: (ruleId: string) => void | Promise<void> = () => {};
  export let openPersonalActivityComposer: () => void | Promise<void> = () => {};
  export let openPersonalServiceRequestComposer: () => void | Promise<void> = () => {};
  export let openPersonalServiceRequestComposerForDay: (isoDay: string) => void | Promise<void> = () => {};
  export let submitActivity: () => void | Promise<void> = () => {};
  export let submitServiceRequest: () => void | Promise<void> = () => {};
  export let requestServiceRequestSettingsChange: (
    input: ProjectServiceRequestSettingsChangeInput
  ) => void | Promise<void> = () => {};
  export let voteOnRequestSettingsChange: (
    requestId: string,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  $: void voteOnRequestSettingsChange;
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

  /** Wall time of an instant in `timeZone`, in datetime-local form, so a locked slot submits the same instant. */
  function zonedDateTimeValue(value: string, timeZone: string) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(new Date(value));
    const bag: Record<string, string> = {};
    for (const part of parts) bag[part.type] = part.value;
    return `${bag.year}-${bag.month}-${bag.day}T${bag.hour}:${bag.minute}`;
  }

  function prefillRequestFromSlot(slot: { id: string; startAt: string; endAt: string }) {
    const zone = getDisplayTimezone();
    selectedActivityId = slot.id;
    serviceRequestForm.inputTimeZone = zone;
    serviceRequestForm.scheduledAt = zonedDateTimeValue(slot.startAt, zone);
    serviceRequestForm.endsAt = zonedDateTimeValue(slot.endAt, zone);
  }

  const WEEKDAYS = [
    { value: 0, label: 'Monday' },
    { value: 1, label: 'Tuesday' },
    { value: 2, label: 'Wednesday' },
    { value: 3, label: 'Thursday' },
    { value: 4, label: 'Friday' },
    { value: 5, label: 'Saturday' },
    { value: 6, label: 'Sunday' }
  ];

  function firstAvailabilityForDay(isoDay: string) {
    const dayStart = new Date(`${isoDay}T00:00:00`).getTime();
    const dayEnd = new Date(`${isoDay}T23:59:59`).getTime();

    return (data.lifecycle.personalService?.availabilitySlots ?? []).find((slot) => {
      if (slot.held) {
        return false;
      }

      const slotStart = new Date(slot.startAt).getTime();
      const slotEnd = new Date(slot.endAt).getTime();
      return slotStart <= dayEnd && slotEnd >= dayStart;
    });
  }

  function activityById(activityId: string) {
    return data.lifecycle.phaseFive.activities.find((activity) => activity.id === activityId);
  }

  function createRequestSettingsForm(): RequestSettingsForm {
    const settings = data.lifecycle.requestSystem?.settings;

    return {
      enabled: settings?.enabled ?? true,
      requestMode: settings?.requestMode ?? 'calendar',
      allowOffScheduleRequests: settings?.allowOffScheduleRequests ?? false,
      reason: ''
    };
  }

  function resolveRequestSettings(
    settings?: ComparableRequestSettings | NonNullable<ProjectPageData['lifecycle']['requestSystem']>['settings'] | null
  ): ComparableRequestSettings {
    return {
      enabled: settings?.enabled ?? true,
      requestMode: settings?.requestMode ?? 'calendar',
      allowOffScheduleRequests: settings?.allowOffScheduleRequests ?? false
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

  async function openCalendarComposer() {
    activeTab = 'live';

    if (previewDayIso) {
      await openCalendarComposerForDay(previewDayIso);
      return;
    }

    if (data.lifecycle.phaseFive.viewerCanCreateActivities) {
      await openPersonalActivityComposer();
      return;
    }

    await openPersonalServiceRequestComposer();
  }

  async function selectCalendarDay(isoDay: string) {
    previewDayIso = isoDay;
  }

  async function openCalendarComposerForDay(isoDay: string) {
    activeTab = 'live';

    if (data.lifecycle.phaseFive.viewerCanCreateActivities) {
      selectedActivityId = '';
      activityForm.scheduledAt = `${isoDay}T18:00`;
      activityForm.endsAt = `${isoDay}T19:00`;
      await openPersonalActivityComposer();
      return;
    }

    const slot = firstAvailabilityForDay(isoDay);

    if (!slot) {
      if (!allowOffScheduleRequests) {
        return;
      }

      selectedActivityId = '';
      serviceRequestForm.scheduledAt = `${isoDay}T18:00`;
      serviceRequestForm.endsAt = `${isoDay}T19:00`;
      await openPersonalServiceRequestComposerForDay(isoDay);
      return;
    }

    prefillRequestFromSlot(slot);

    await openPersonalServiceRequestComposerForDay(isoDay);
  }

  async function openCalendarComposerForActivity(activityId: string) {
    const historyItem = historyItemByActivityId(activityId);

    if (historyItem && historyItem.historyState !== 'request-only') {
      historyOpen = true;
      await focusHistoryCard(historyItem.id);
      return;
    }

    if (!usesCalendar || data.lifecycle.phaseFive.viewerCanCreateActivities) {
      return;
    }

    const slot = (data.lifecycle.personalService?.availabilitySlots ?? []).find((entry) => entry.id === activityId);

    if (!slot || slot.held) {
      return;
    }

    prefillRequestFromSlot(slot);

    activeTab = 'live';
    await openPersonalServiceRequestComposer();
  }

  function closePersonalActivityComposer() {
    showPersonalActivityComposer = false;
    availabilityKind = 'one-off';
  }

  async function submitWeeklyRule() {
    if (!weeklyStart || !weeklyEnd || weeklyEnd <= weeklyStart) {
      return;
    }

    const timezone = weeklyTimezone || getDisplayTimezone();

    await createAvailabilityRule({
      weekday: weeklyWeekday,
      startTime: weeklyStart,
      endTime: weeklyEnd,
      timezone: timezone || 'UTC',
      note: weeklyNote
    });
    weeklyNote = '';
    showPersonalActivityComposer = false;
  }

  function closePersonalServiceRequestComposer() {
    selectedActivityId = '';
    showPersonalServiceRequestComposer = false;
    clearComposeParam();
  }

  /** Drop `compose=request` so a reload or back doesn't reopen the form. */
  function clearComposeParam() {
    const url = new URL($page.url);
    if (!url.searchParams.has('compose')) return;
    url.searchParams.delete('compose');
    void goto(`${url.pathname}${url.search}${url.hash}`, {
      replaceState: true,
      noScroll: true,
      keepFocus: true
    });
  }

  function addPreferredTime() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isoDay = `${tomorrow.getFullYear()}-${`${tomorrow.getMonth() + 1}`.padStart(2, '0')}-${`${tomorrow.getDate()}`.padStart(2, '0')}`;
    serviceRequestForm.inputTimeZone = serviceRequestForm.inputTimeZone || getDisplayTimezone();
    serviceRequestForm.scheduledAt = `${isoDay}T18:00`;
    serviceRequestForm.endsAt = `${isoDay}T19:00`;
  }

  async function openDirectRequestComposer() {
    activeTab = 'live';
    selectedActivityId = '';
    if (personalRequestMode === 'calendar') {
      if (!serviceRequestForm.scheduledAt) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isoDay = `${tomorrow.getFullYear()}-${`${tomorrow.getMonth() + 1}`.padStart(2, '0')}-${`${tomorrow.getDate()}`.padStart(2, '0')}`;
        serviceRequestForm.scheduledAt = `${isoDay}T18:00`;
        serviceRequestForm.endsAt = `${isoDay}T19:00`;
      }
    } else {
      serviceRequestForm.scheduledAt = '';
      serviceRequestForm.endsAt = '';
    }
    await openPersonalServiceRequestComposer();
  }

  async function openGeneralRequestComposer() {
    activeTab = 'live';
    await openPersonalServiceRequestComposer();
  }

  async function openRequestForDay(isoDay: string) {
    activeTab = 'live';
    const slot = firstAvailabilityForDay(isoDay);

    if (!slot) {
      selectedActivityId = '';
      serviceRequestForm.scheduledAt = `${isoDay}T18:00`;
      serviceRequestForm.endsAt = `${isoDay}T19:00`;
      await openPersonalServiceRequestComposerForDay(isoDay);
      return;
    }

    prefillRequestFromSlot(slot);
    await openPersonalServiceRequestComposerForDay(isoDay);
  }

  async function openDockedServiceRequest() {
    if (!usesCalendar || personalRequestMode === 'direct') {
      await openDirectRequestComposer();
      return;
    }

    if (previewDayIso) {
      await openRequestForDay(previewDayIso);
      return;
    }

    if (personalRequestMode === 'both' || allowOffScheduleRequests) {
      await openDirectRequestComposer();
      return;
    }

    await openGeneralRequestComposer();
  }

  async function openDockedRequestSettings() {
    requestSettingsForm = createRequestSettingsForm();
    showRequestSettingsComposer = true;
  }

  function closeRequestSettingsComposer() {
    showRequestSettingsComposer = false;
    requestSettingsForm = createRequestSettingsForm();
  }

  async function submitRequestSettingsChange() {
    if (!requestSettingsCanSubmit) {
      return;
    }

    await requestServiceRequestSettingsChange({
      reason: '',
      enabled: requestSettingsForm.enabled,
      requestMode: requestSettingsForm.requestMode,
      allowOffScheduleRequests: requestSettingsForm.allowOffScheduleRequests
    });

    showRequestSettingsComposer = false;
  }

  let activeTab: ServiceTab = 'live';
  let selectedActivityId = '';
  let historyHighlightResetHandle: ReturnType<typeof setTimeout> | null = null;
  let showRequestSettingsComposer = false;
  let requestSettingsForm: RequestSettingsForm = createRequestSettingsForm();
  let requestSettingsComposerElement: HTMLDivElement | null = null;

  let availabilityKind: 'one-off' | 'weekly' = 'one-off';
  let weeklyWeekday = 1;
  let weeklyStart = '09:00';
  let weeklyTimezone = getDisplayTimezone();
  let weeklyEnd = '12:00';
  let weeklyNote = '';
  let previewDayIso = '';
  let showRequestsSheet = false;
  let decliningRequestId = '';
  let declineReason = '';

  function startDecline(requestId: string) {
    decliningRequestId = requestId;
    declineReason = '';
  }

  async function confirmDecline(requestId: string) {
    await updateRequestStatus(requestId, 'declined', false, declineReason);
    decliningRequestId = '';
    declineReason = '';
  }

  function isPending(status: ProjectServiceRequestStatus) {
    return status === 'open' || status === 'planned';
  }

  $: usesCalendar = data.lifecycle.personalService?.usesCalendar ?? true;
  $: personalRequestMode = data.lifecycle.personalService?.requestMode ?? 'calendar';
  $: allowOffScheduleRequests = data.lifecycle.requestSystem?.settings.allowOffScheduleRequests ?? false;
  $: availabilityRules = data.lifecycle.personalService?.availabilityRules ?? [];
  $: showServiceRequestAction =
    Boolean(data.lifecycle.requestSystem?.enabled) &&
    Boolean(data.lifecycle.requestSystem?.viewerCanSubmitRequests);
  $: requestScheduleRequired = data.lifecycle.requestSystem?.requiresSchedule ?? false;
  $: showRequestScheduleFields =
    requestScheduleRequired || !!serviceRequestForm.scheduledAt || !!selectedActivityId;
  $: calendarCanCreate = usesCalendar && data.lifecycle.phaseFive.viewerCanCreateActivities;
  $: calendarCreateActive = data.lifecycle.phaseFive.viewerCanCreateActivities
    ? showPersonalActivityComposer
    : showPersonalServiceRequestComposer;
  $: calendarSelectedDayIso = usesCalendar
    ? previewDayIso ||
      (data.lifecycle.phaseFive.viewerCanCreateActivities
        ? activityForm.scheduledAt
        : serviceRequestForm.scheduledAt ?? '')
    : '';
  $: sortedRequests = [...(data.lifecycle.requestSystem?.requests ?? [])].sort(
    (left, right) => +new Date(right.createdAt) - +new Date(left.createdAt)
  );
  $: showRequestsAction =
    (data.lifecycle.requestSystem?.viewerCanReviewRequests ?? false) || sortedRequests.length > 0;
  $: requestHistory = data.lifecycle.phaseFive.history.filter((item) => item.source === 'request');
  $: selfPlannedHistory = data.lifecycle.phaseFive.history.filter(
    (item) => item.source === 'self-planned'
  );
  $: calendarActivities = (data.lifecycle.personalService?.availabilitySlots ?? []).map((slot) => ({
    id: slot.id,
    title: slot.held
      ? data.lifecycle.phaseFive.viewerCanCreateActivities
        ? `${slot.title} (taken)`
        : 'Taken'
      : slot.title,
    authorUsername: data.authorUsername,
    scheduledAt: slot.scheduledAt,
    startAt: slot.startAt,
    endAt: slot.endAt,
    isOnline: true,
    locationLabel: data.locationLabel,
    minimumParticipants: 0,
    committedCount: slot.bookings.length,
    viewerAssignedRoleLabel: null,
    linkedPlanPhaseLabel: null,
    statusTone: slot.statusTone === 'muted' ? 'yellow' : slot.statusTone,
    roles: [],
    note: slot.bookings.map((booking) => `@${booking.requesterUsername}`).join(', '),
    isActive: !slot.held
  }));
  $: requestsOff = Boolean(data.lifecycle.requestSystem) && !data.lifecycle.requestSystem?.enabled;
  $: viewerReviewsRequests = data.lifecycle.requestSystem?.viewerCanReviewRequests ?? false;
  $: futureOpenSlotCount = (data.lifecycle.personalService?.availabilitySlots ?? []).filter(
    (slot) => !slot.held && slot.source !== 'request' && new Date(slot.endAt).getTime() > Date.now()
  ).length;
  $: acceptedRequestCount = sortedRequests.filter(
    (request) =>
      request.status === 'accepted' &&
      (!request.endsAt || new Date(request.endsAt).getTime() > Date.now())
  ).length;
  $: currentRequestSettings = resolveRequestSettings(data.lifecycle.requestSystem?.settings);
  $: draftRequestSettings = resolveRequestSettings(requestSettingsForm);
  $: requestSettingsChanged = !requestSettingsMatch(currentRequestSettings, draftRequestSettings);
  $: requestSettingsCanSubmit = requestSettingsChanged;
  $: if (!showPersonalServiceRequestComposer) {
    selectedActivityId = '';
  }
  $: if (!showRequestSettingsComposer) {
    requestSettingsForm = createRequestSettingsForm();
  }
  let composeHandled = '';
  $: composeKey = $page.url.searchParams.get('compose') === 'request' ? $page.url.search : '';
  $: if (composeKey && composeKey !== composeHandled && showServiceRequestAction) {
    composeHandled = composeKey;
    void openDockedServiceRequest();
  }

  $: if (highlightedActivityId || highlightedRequestId) {
    activeTab = 'live';
    if (highlightedRequestId) {
      showRequestsSheet = true;
    }
  }
</script>

<section class="phase-surface">
  {#if requestsOff}
    <div class="requests-off-banner" role="status">Not taking requests.</div>
  {/if}
  {#if usesCalendar}
    <ProjectActivityCalendarCard
      activities={calendarActivities}
      canCreate={false}
      createActive={calendarCreateActive}
      createButtonLabel="Add availability"
      createAriaLabel="Add availability"
      selectedDayIso={calendarSelectedDayIso}
      selectedActivityId={selectedActivityId}
      daySelect={selectCalendarDay}
      createAction={openCalendarComposer}
      activitySelect={openCalendarComposerForActivity}
    />
  {:else}
    <div class="empty-card helper-card">
      <p>This service is currently running through direct written requests instead of listed availability.</p>
    </div>
  {/if}

  <PhaseWorkToolbar>
    {#if calendarCanCreate}
      <RoundPlusButton
        standout
        label="Add availability"
        ariaLabel="Add availability"
        participationAction="add-availability"
        action={() => openCalendarComposer()}
      />
    {/if}
    {#if showRequestsAction}
      <RoundPlusButton
        label="Requests"
        ariaLabel="Open service requests"
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
    {#if showServiceRequestAction}
      <RoundPlusButton
        standout
        label="Request service"
        ariaLabel="Request this service"
        participationAction="request-service"
        action={() => openDockedServiceRequest()}
      />
    {/if}
  </PhaseWorkToolbar>

    {#if data.lifecycle.requestSystem}
      <OverlaySheet bind:open={showRequestsSheet} title="Requests" labelledById="personal-requests-sheet">
      <section class="card-rail-section">
        <p class="field-help">{data.lifecycle.requestSystem.settings.summary}</p>

        {#if sortedRequests.length === 0}
          <div class="empty-card">
            {#if requestsOff}
              Not taking requests.
            {:else if viewerReviewsRequests}
              No requests yet.
            {:else}
              You have not requested this service yet.
            {/if}
          </div>
        {:else}
          <div class="card-rail">
            {#each sortedRequests as request (request.id)}
              <div id={`request-card-${request.id}`} class="rail-card">
                <CollapsibleServiceRequestCard
                  request={request}
                  expanded={highlightedRequestId === request.id}
                  highlighted={highlightedRequestId === request.id}
                >
                  {#if isPending(request.status) && viewerReviewsRequests}
                    {#if decliningRequestId === request.id}
                      <textarea
                        bind:value={declineReason}
                        rows="2"
                        maxlength="500"
                        placeholder="Reason (optional)"
                      ></textarea>
                      <div class="binary-row review-actions">
                        <button class="vote-chip" type="button" on:click={() => (decliningRequestId = '')}>
                          Back
                        </button>
                        <button class="vote-chip negative" type="button" on:click={() => confirmDecline(request.id)}>
                          Decline request
                        </button>
                      </div>
                    {:else}
                      <div class="binary-row review-actions">
                        <button class="vote-chip" type="button" on:click={() => updateRequestStatus(request.id, 'accepted')}>
                          Accept
                        </button>
                        <button class="vote-chip negative" type="button" on:click={() => startDecline(request.id)}>
                          Decline
                        </button>
                      </div>
                    {/if}
                  {:else if isPending(request.status)}
                    <div class="binary-row review-actions">
                      <button
                        class="vote-chip negative"
                        type="button"
                        on:click={() => updateRequestStatus(request.id, 'cancelled')}
                      >
                        Cancel request
                      </button>
                    </div>
                  {/if}
                  {#if request.conversationId}
                    <a class="conversation-link" href={`/messages?conversation=${request.conversationId}`}>Open conversation</a>
                  {/if}
                </CollapsibleServiceRequestCard>
              </div>
            {/each}
          </div>
        {/if}
      </section>
      </OverlaySheet>

      <OverlaySheet
        bind:open={showPersonalServiceRequestComposer}
        hideClose
        title="Request service"
        labelledById="personal-request-form-sheet"
        on:close={closePersonalServiceRequestComposer}
      >
        <div bind:this={serviceRequestComposerElement} class="composer-card">
          <DirectUsePolicyNotice variant="request" context="service" />
          <div class="request-header-row">
            <div>
              <p>
                Sending a request opens a one-to-one chat with the creator in Messages.
                {#if showRequestScheduleFields}
                  Start from the selected available time and add the details for the creator.
                {:else}
                  Describe what you need so the creator can review the request and reply.
                {/if}
              </p>
            </div>
          </div>
          <input bind:value={serviceRequestForm.title} maxlength="120" placeholder="Request title" />
          {#if showRequestScheduleFields}
            <label>
              <span class="field-inline-label">Timezone</span>
              <select
                bind:value={serviceRequestForm.inputTimeZone}
                disabled={Boolean(selectedActivityId)}
                on:focus={() => {
                  if (!serviceRequestForm.inputTimeZone) serviceRequestForm.inputTimeZone = getDisplayTimezone();
                }}
              >
                {#each listDisplayTimezones() as zone}
                  <option value={zone}>{zone}</option>
                {/each}
              </select>
            </label>
            <div class="number-grid">
              <label>
                <span class="field-inline-label">Start time</span>
                <input bind:value={serviceRequestForm.scheduledAt} disabled={Boolean(selectedActivityId)} type="datetime-local" />
              </label>
              <label>
                <span class="field-inline-label">Finish time</span>
                <input bind:value={serviceRequestForm.endsAt} disabled={Boolean(selectedActivityId)} type="datetime-local" />
              </label>
            </div>
          {:else}
            <button class="text-button add-time" type="button" on:click={addPreferredTime}>
              + Add a preferred time (optional)
            </button>
          {/if}
          <textarea
            bind:value={serviceRequestForm.body}
            rows="3"
            placeholder={showRequestScheduleFields
              ? 'What do you need help with?'
              : 'What do you need, and what should the creator expect?'}
          ></textarea>
          </div>
        <svelte:fragment slot="footer">
          <div class="sheet-actions">
            <button class="sheet-cancel" type="button" on:click={closePersonalServiceRequestComposer}>Cancel</button>
            <button class="sheet-submit" type="button" on:click={submitServiceRequest}>Request</button>
          </div>
        </svelte:fragment>
      </OverlaySheet>

      {#if data.lifecycle.requestSystem.viewerCanRequestSettingsChanges}
        <OverlaySheet
          bind:open={showRequestSettingsComposer}
          hideClose
          title="Request settings"
          labelledById="personal-request-settings-sheet"
          on:close={closeRequestSettingsComposer}
        >
          <div bind:this={requestSettingsComposerElement} class="composer-card">
            <div class="request-header-row">
              <div>
                <p>These settings apply immediately because the project creator is the only person running this service.</p>
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
              {#if requestSettingsForm.requestMode === 'calendar' || requestSettingsForm.requestMode === 'both'}
                <label class="checkbox-row">
                  <input bind:checked={requestSettingsForm.allowOffScheduleRequests} type="checkbox" />
                  <span>Allow off-schedule requests</span>
                </label>
              {/if}
              <p class="field-help">
                Scheduled slots start from listed times. Message requests let people write in without choosing a listed slot.
                {#if requestSettingsForm.requestMode !== 'direct'}
                  Off-schedule requests can ask for a time that is not already listed.
                {/if}
              </p>
            {/if}
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
                Save settings
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
            {#if usesCalendar}
              {futureOpenSlotCount} open slot{futureOpenSlotCount === 1 ? '' : 's'} · {acceptedRequestCount} accepted request{acceptedRequestCount === 1 ? '' : 's'}
            {:else}
              {data.lifecycle.phaseFive.activities.length} future activit{data.lifecycle.phaseFive.activities.length === 1 ? 'y' : 'ies'}
            {/if}
          </p>
        </div>
      </div>

      {#if data.lifecycle.phaseFive.viewerCanCreateActivities}
        <OverlaySheet
          bind:open={showPersonalActivityComposer}
          hideClose
          title="Add availability"
          labelledById="personal-availability-sheet"
          on:close={closePersonalActivityComposer}
        >
        <div bind:this={activityComposerElement} class="composer-card">
          <DirectUsePolicyNotice variant="request" context="service" />
          <div class="request-header-row">
            <div>
              <p>One-off slots and weekly hours are what other people can request.</p>
            </div>
          </div>
          <div class="binary-row">
            <button
              class="vote-chip"
              class:selected={availabilityKind === 'one-off'}
              type="button"
              on:click={() => (availabilityKind = 'one-off')}
            >
              One-off
            </button>
            <button
              class="vote-chip"
              class:selected={availabilityKind === 'weekly'}
              type="button"
              on:click={() => (availabilityKind = 'weekly')}
            >
              Weekly
            </button>
          </div>
          {#if availabilityKind === 'one-off'}
            <label>
              <span class="field-inline-label">Timezone</span>
              <select bind:value={activityForm.inputTimeZone}>
                {#each listDisplayTimezones() as zone}
                  <option value={zone}>{zone}</option>
                {/each}
              </select>
            </label>
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
          {:else}
            <label>
              <span class="field-inline-label">Timezone</span>
              <select bind:value={weeklyTimezone}>
                {#each listDisplayTimezones() as zone}
                  <option value={zone}>{zone}</option>
                {/each}
              </select>
            </label>
            <label>
              <span class="field-inline-label">Weekday</span>
              <select bind:value={weeklyWeekday}>
                {#each WEEKDAYS as day}
                  <option value={day.value}>{day.label}</option>
                {/each}
              </select>
            </label>
            <div class="number-grid">
              <label>
                <span class="field-inline-label">Start</span>
                <input bind:value={weeklyStart} type="time" />
              </label>
              <label>
                <span class="field-inline-label">End</span>
                <input bind:value={weeklyEnd} type="time" />
              </label>
            </div>
            <input bind:value={weeklyNote} maxlength="120" placeholder="Optional note" />
          {/if}
        </div>
        <svelte:fragment slot="footer">
          <div class="sheet-actions">
            <button class="sheet-cancel" type="button" on:click={closePersonalActivityComposer}>Cancel</button>
            {#if availabilityKind === 'one-off'}
              <button class="sheet-submit" type="button" on:click={submitActivity}>Add availability</button>
            {:else}
              <button class="sheet-submit" type="button" on:click={submitWeeklyRule}>Add weekly hours</button>
            {/if}
          </div>
        </svelte:fragment>
        </OverlaySheet>
      {/if}

      {#if data.lifecycle.phaseFive.viewerCanCreateActivities && availabilityRules.length > 0}
        <div class="rules-list">
          {#each availabilityRules as rule (rule.id)}
            <div class="rule-row">
              <span>{rule.weekdayLabel} {rule.startTime}–{rule.endTime} ({rule.timezone})</span>
              {#if rule.note}
                <span class="field-help">{rule.note}</span>
              {/if}
              <button class="text-button" type="button" on:click={() => deleteAvailabilityRule(rule.id)}>Remove</button>
            </div>
          {/each}
        </div>
      {/if}

      {#if data.lifecycle.phaseFive.activities.length === 0}
        {#if !usesCalendar}
          <div class="empty-card">This service is currently running without listed activity slots.</div>
        {:else if futureOpenSlotCount + acceptedRequestCount === 0}
          <div class="empty-card">No future availability or accepted request activity is scheduled yet.</div>
        {/if}
      {:else}
        <ActivityAgendaList
          activities={data.lifecycle.phaseFive.activities}
          {highlightedActivityId}
        />
      {/if}
    </section>
  {#if data.lifecycle.phaseFive.history.length > 0}
  <details class="history-section" bind:open={historyOpen}>
    <summary class="history-summary">
      <span>Past activity</span>
      <svg class="history-chevron" aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
        <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </summary>
    <div class="history-stack">
      <ActivityHistorySection
        title="Request history"
        description="Past accepted requests and request-based activity."
        items={requestHistory}
        emptyMessage="No request-based activity has moved into history yet."
        {highlightedHistoryId}
        {toggleHistoryCompletion}
        {saveActivityRating}
        {deleteActivityRating}
      />

      <ActivityHistorySection
        title="Self planned history"
        description="Past availability or directly created service activity."
        items={selfPlannedHistory}
        emptyMessage="No self-planned activity has moved into history yet."
        {highlightedHistoryId}
        {toggleHistoryCompletion}
        {saveActivityRating}
        {deleteActivityRating}
      />
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
    padding: 4px 0;
    cursor: pointer;
    list-style: none;
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .history-summary::-webkit-details-marker {
    display: none;
  }

  .history-chevron {
    transition: transform 0.15s ease;
  }

  :global(details[open]) > .history-summary .history-chevron {
    transform: rotate(180deg);
  }

  .phase-surface,
  .card-rail-section,
  .history-stack,
  .composer-card {
    display: grid;
    gap: 12px;
  }

  :global(.overlay-footer:has(.sheet-actions)) {
    gap: 0;
  }

  .sheet-actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    width: 100%;
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
  .binary-row,
  .number-grid {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .request-header-row {
    justify-content: space-between;
  }

  .section-head,
  .card-rail {
    display: grid;
    gap: 12px;
  }

  .section-head {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
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

  .composer-card,
  .empty-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .helper-card {
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

  .number-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .vote-chip.negative {
    color: var(--tablet-community-text);
  }

  .empty-card,
  p,
  span {
    color: var(--text-soft);
  }

  h3,
  .field-inline-label {
    color: var(--text-main);
  }

  h3 {
    font-size: 14px;
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

  .vote-chip {
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .vote-chip.selected {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .rules-list,
  .rule-row {
    display: grid;
    gap: 8px;
  }

  .rule-row {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    font-size: 12px;
    font-weight: 700;
  }

  .conversation-link,
  .add-time {
    justify-self: start;
  }

  .text-button {
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
  }

  .text-button {
    border: 0;
    background: transparent;
    cursor: pointer;
  }

  @media (max-width: 760px) {
    .section-head,
    .number-grid {
      grid-template-columns: 1fr;
    }
  }

  .requests-off-banner {
    padding: 10px 14px;
    border: 1px solid var(--status-yellow);
    border-radius: var(--radius-sm);
    background: var(--status-yellow-soft);
    color: var(--status-yellow-strong);
    font-size: 13px;
    font-weight: 700;
  }
</style>