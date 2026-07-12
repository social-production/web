<script lang="ts">
  import { tick } from 'svelte';
  import CollapsibleServiceRequestCard from '$lib/components/cards/project-detail/CollapsibleServiceRequestCard.svelte';
  import CollapsibleActivityCard from '$lib/components/cards/project-detail/CollapsibleActivityCard.svelte';
  import ProjectActivityCalendarCard from '$lib/components/cards/project-detail/ProjectActivityCalendarCard.svelte';
  import DirectUsePolicyNotice from '$lib/components/shared/DirectUsePolicyNotice.svelte';
  import ActivityHistorySection from '$lib/features/projects/detail/components/ActivityHistorySection.svelte';
  import VoteCardFooter from '$lib/components/shared/VoteCardFooter.svelte';
  import { focusEndedActivityCard } from '$lib/features/projects/detail/lifecycle/projectLifecycleNavigation';
  import {
    formatProjectVoteRequirement,
    formatProjectVoteSummary
  } from '$lib/utils/projectVotes';
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
  };

  type RequestSettingsForm = {
    enabled: boolean;
    requestMode: 'calendar' | 'direct' | 'both';
    reason: string;
  };

  type ComparableRequestSettings = Omit<RequestSettingsForm, 'reason'>;

  type ServiceTab = 'live' | 'history';
  type RequestSettingsVote = NonNullable<
    NonNullable<ProjectPageData['lifecycle']['requestSystem']>['settingsChangeRequests']
  >[number];

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
  export let updateRequestStatus: (requestId: string, status: ProjectServiceRequestStatus) => void | Promise<void> = () => {};
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

  function localDateTimeValue(value: string) {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function firstAvailabilityForDay(isoDay: string) {
    const dayStart = new Date(`${isoDay}T00:00:00`).getTime();
    const dayEnd = new Date(`${isoDay}T23:59:59`).getTime();

    return data.lifecycle.phaseFive.activities.find((activity) => {
      const activityStart = new Date(activity.startAt).getTime();
      const activityEnd = new Date(activity.endAt).getTime();

      return activityStart <= dayEnd && activityEnd >= dayStart;
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
      reason: ''
    };
  }

  function resolveRequestSettings(
    settings?: ComparableRequestSettings | NonNullable<ProjectPageData['lifecycle']['requestSystem']>['settings'] | null
  ): ComparableRequestSettings {
    return {
      enabled: settings?.enabled ?? true,
      requestMode: settings?.requestMode ?? 'calendar'
    };
  }

  function requestSettingsMatch(
    left: ComparableRequestSettings,
    right: ComparableRequestSettings
  ) {
    return left.enabled === right.enabled && left.requestMode === right.requestMode;
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

    if (data.lifecycle.phaseFive.viewerCanCreateActivities) {
      await openPersonalActivityComposer();
      return;
    }

    await openPersonalServiceRequestComposer();
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
      return;
    }

    selectedActivityId = slot.id;
    serviceRequestForm.scheduledAt = localDateTimeValue(slot.startAt);
    serviceRequestForm.endsAt = localDateTimeValue(slot.endAt);

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

    const slot = activityById(activityId);

    if (!slot) {
      return;
    }

    selectedActivityId = slot.id;
    serviceRequestForm.scheduledAt = localDateTimeValue(slot.startAt);
    serviceRequestForm.endsAt = localDateTimeValue(slot.endAt);

    activeTab = 'live';
    await openPersonalServiceRequestComposer();
  }

  function closePersonalActivityComposer() {
    showPersonalActivityComposer = false;
  }

  function closePersonalServiceRequestComposer() {
    selectedActivityId = '';
    showPersonalServiceRequestComposer = false;
  }

  async function openDirectRequestComposer() {
    activeTab = 'live';
    selectedActivityId = '';
    serviceRequestForm.scheduledAt = '';
    serviceRequestForm.endsAt = '';
    await openPersonalServiceRequestComposer();
  }

  async function openGeneralRequestComposer() {
    activeTab = 'live';
    await openPersonalServiceRequestComposer();
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
      reason: '',
      enabled: requestSettingsForm.enabled,
      requestMode: requestSettingsForm.requestMode,
      allowOffScheduleRequests: requestSettingsForm.requestMode === 'both'
    });

    showRequestSettingsComposer = false;
  }

  let activeTab: ServiceTab = 'live';
  let selectedActivityId = '';
  let historyHighlightResetHandle: ReturnType<typeof setTimeout> | null = null;
  let showRequestSettingsComposer = false;
  let showRequestSettingsVote = false;
  let requestSettingsForm: RequestSettingsForm = createRequestSettingsForm();
  let requestSettingsComposerElement: HTMLDivElement | null = null;

  $: usesCalendar = data.lifecycle.personalService?.usesCalendar ?? true;
  $: personalRequestMode = data.lifecycle.personalService?.requestMode ?? 'calendar';
  $: allowsDirectRequests = personalRequestMode === 'direct' || personalRequestMode === 'both';
  $: requestScheduleRequired = data.lifecycle.requestSystem?.requiresSchedule ?? false;
  $: showRequestScheduleFields =
    requestScheduleRequired || !!serviceRequestForm.scheduledAt || !!selectedActivityId;
  $: calendarCanCreate = usesCalendar && data.lifecycle.phaseFive.viewerCanCreateActivities;
  $: calendarCreateActive = data.lifecycle.phaseFive.viewerCanCreateActivities
    ? showPersonalActivityComposer
    : showPersonalServiceRequestComposer;
  $: calendarSelectedDayIso = usesCalendar
    ? data.lifecycle.phaseFive.viewerCanCreateActivities
      ? activityForm.scheduledAt
      : serviceRequestForm.scheduledAt ?? ''
    : '';
  $: sortedRequests = [...(data.lifecycle.requestSystem?.requests ?? [])].sort(
    (left, right) => +new Date(right.createdAt) - +new Date(left.createdAt)
  );
  $: requestSettingsVotes = data.lifecycle.requestSystem?.settingsChangeRequests ?? [];
  $: requestSettingsVoteCount = requestSettingsVotes.length;
  $: requestHistory = data.lifecycle.phaseFive.history.filter((item) => item.source === 'request');
  $: selfPlannedHistory = data.lifecycle.phaseFive.history.filter(
    (item) => item.source === 'self-planned'
  );
  $: calendarActivities = [
    ...data.lifecycle.phaseFive.activities,
    ...data.lifecycle.phaseFive.history
      .filter((item) => item.historyState !== 'request-only' && item.activity.statusTone === 'green')
      .map((item) => item.activity)
  ];
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
  $: if (requestSettingsVoteCount === 0) {
    showRequestSettingsVote = false;
  }
  $: if (highlightedActivityId || highlightedRequestId) {
    activeTab = 'live';
  }
</script>

<section class="phase-surface">
  {#if usesCalendar}
    <ProjectActivityCalendarCard
      activities={calendarActivities}
      canCreate={calendarCanCreate || (data.lifecycle.requestSystem?.viewerCanSubmitRequests ?? false)}
      createActive={calendarCreateActive}
      selectedDayIso={calendarSelectedDayIso}
      selectedActivityId={selectedActivityId}
      daySelect={openCalendarComposerForDay}
      createAction={openCalendarComposer}
      activitySelect={openCalendarComposerForActivity}
    />

    {#if data.lifecycle.requestSystem?.viewerCanSubmitRequests && allowsDirectRequests && !requestScheduleRequired}
      <div class="composer-actions request-action-row">
        <button class="secondary-button" type="button" on:click={openDirectRequestComposer}>New direct request</button>
      </div>
    {/if}
  {:else}
    <div class="empty-card helper-card">
      <p>This service is currently running through direct written requests instead of listed availability.</p>
    </div>

    {#if data.lifecycle.requestSystem?.viewerCanSubmitRequests}
      <div class="composer-actions request-action-row">
        <button class="primary-button" type="button" on:click={openGeneralRequestComposer}>New request</button>
      </div>
    {/if}
  {/if}

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
              <p class="field-help">Scheduled slots start from listed times. Message requests let people write in without choosing a listed slot.</p>
            {/if}

            {#if !requestSettingsChanged}
              <p class="field-help">Choose a different request setup before saving.</p>
            {/if}

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
                Save settings
              </button>
            </div>
          </div>
        {/if}

        {#if data.lifecycle.requestSystem?.viewerCanSubmitRequests && showPersonalServiceRequestComposer}
          <div bind:this={serviceRequestComposerElement} class="composer-card">
            <DirectUsePolicyNotice variant="request" context="service" />
            <div class="request-header-row">
              <div>
                <h3>Request service</h3>
                <p>
                  {#if showRequestScheduleFields}
                    Start from the selected available time and add the details for the creator.
                  {:else}
                    Describe what you need so the creator can review the request and reply in messages.
                  {/if}
                </p>
              </div>
            </div>
            <input bind:value={serviceRequestForm.title} maxlength="120" placeholder="Request title" />
            {#if showRequestScheduleFields}
              <div class="number-grid">
                <label>
                  <span class="field-inline-label">Start time</span>
                  <input bind:value={serviceRequestForm.scheduledAt} type="datetime-local" />
                </label>
                <label>
                  <span class="field-inline-label">Finish time</span>
                  <input bind:value={serviceRequestForm.endsAt} type="datetime-local" />
                </label>
              </div>
            {/if}
            <textarea
              bind:value={serviceRequestForm.body}
              rows="3"
              placeholder={showRequestScheduleFields
                ? 'What do you need help with?'
                : 'What do you need, and what should the creator expect?'}
            ></textarea>
            <div class="composer-actions">
              <button class="secondary-button" type="button" on:click={closePersonalServiceRequestComposer}>
                Cancel
              </button>
              <button class="primary-button" type="button" on:click={submitServiceRequest}>Send request</button>
            </div>
          </div>
        {/if}

        {#if data.lifecycle.requestSystem.viewerCanReviewRequests}
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
                    expanded={highlightedRequestId === request.id}
                    highlighted={highlightedRequestId === request.id}
                  >
                    {#if request.status === 'open'}
                      <div class="binary-row review-actions">
                        <button class="vote-chip" type="button" on:click={() => updateRequestStatus(request.id, 'accepted')}>
                          Accept
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
                  </CollapsibleServiceRequestCard>
                </div>
              {/each}
            </div>
          {/if}
        {:else if data.lifecycle.requestSystem.enabled}
          <div class="empty-card">Requests stay private between each requester and the service creator.</div>
        {:else}
          <div class="empty-card">Requests are currently turned off.</div>
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

      {#if data.lifecycle.phaseFive.viewerCanCreateActivities && showPersonalActivityComposer}
        <div bind:this={activityComposerElement} class="composer-card">
          <DirectUsePolicyNotice variant="request" context="service" />
          <div class="request-header-row">
            <div>
              <h3>Add availability</h3>
              <p>These slots are what other users can request.</p>
            </div>
          </div>
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
          <div class="composer-actions">
            <button class="secondary-button" type="button" on:click={closePersonalActivityComposer}>Cancel</button>
            <button class="primary-button" type="button" on:click={submitActivity}>Add availability</button>
          </div>
        </div>
      {/if}

      {#if data.lifecycle.phaseFive.activities.length === 0}
        <div class="empty-card">
          {#if usesCalendar}
            No future availability or accepted request activity is scheduled yet.
          {:else}
            This service is currently running without listed activity slots.
          {/if}
        </div>
      {:else}
        <div class="card-rail">
          {#each data.lifecycle.phaseFive.activities as activity (activity.id)}
            <div id={`activity-card-${activity.id}`} class="rail-card">
              <CollapsibleActivityCard
                activity={activity}
                expanded={highlightedActivityId === activity.id}
                highlighted={highlightedActivityId === activity.id}
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
  .surface-stack,
  .card-rail-section,
  .history-stack,
  .composer-card {
    display: grid;
    gap: 12px;
  }

  .request-header-row,
  .binary-row,
  .composer-actions,
  .number-grid,
  .section-actions,
  .vote-summary-row {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .request-header-row,
  .section-actions {
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
    max-height: min(34rem, 72vh);
    overflow-y: auto;
    align-items: start;
    padding-right: 2px;
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

  .settings-panel {
    scroll-margin-top: 92px;
  }

  .request-action-row {
    justify-content: flex-start;
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

  strong,
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
    .number-grid {
      grid-template-columns: 1fr;
    }
  }
</style>