<script lang="ts">
  import ProjectActivityCalendarCard from '$lib/components/cards/project-detail/ProjectActivityCalendarCard.svelte';
  import type {
    ProjectActivityRoleInput,
    ProjectPageData,
    ProjectServiceRequestInput,
    ProjectServiceRequestStatus
  } from '$lib/types/detail';
  import { formatRelativeTime } from '$lib/utils/time';

  type ActivityForm = {
    title: string;
    scheduledAt: string;
    endsAt: string;
    locationLabel: string;
    roleRequirements: ProjectActivityRoleInput[];
    linkedPlanPhaseId: string | null;
    note: string;
  };

  export let data: ProjectPageData;
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

  let showIncomingRequests = false;
  let selectedActivityId = '';

  function requestStatusLabel(status: ProjectServiceRequestStatus) {
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'declined':
        return 'Declined';
      default:
        return 'Open';
    }
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

  async function openCalendarComposer() {
    if (data.lifecycle.phaseFive.viewerCanCreateActivities) {
      await openPersonalActivityComposer();
      return;
    }

    await openPersonalServiceRequestComposer();
  }

  async function openCalendarComposerForDay(isoDay: string) {
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
    selectedActivityId = '';
    serviceRequestForm.scheduledAt = '';
    serviceRequestForm.endsAt = '';
    await openPersonalServiceRequestComposer();
  }

  $: usesCalendar = data.lifecycle.personalService?.usesCalendar ?? true;
  $: personalRequestMode = data.lifecycle.personalService?.requestMode ?? 'calendar';
  $: allowsDirectRequests = personalRequestMode === 'direct' || personalRequestMode === 'both';
  $: requestScheduleRequired = data.lifecycle.requestSystem?.requiresSchedule ?? false;
  $: calendarCanCreate = usesCalendar && data.lifecycle.phaseFive.viewerCanCreateActivities;
  $: calendarCreateActive = data.lifecycle.phaseFive.viewerCanCreateActivities
    ? showPersonalActivityComposer
    : showPersonalServiceRequestComposer;
  $: calendarSelectedDayIso = usesCalendar
    ? data.lifecycle.phaseFive.viewerCanCreateActivities
      ? activityForm.scheduledAt
      : serviceRequestForm.scheduledAt ?? ''
    : '';
  $: if (!showPersonalServiceRequestComposer) {
    selectedActivityId = '';
  }
</script>

<section class="phase-surface">
  {#if data.lifecycle.requestSystem?.viewerCanReviewRequests}
    <div class="mechanics-card request-card-shell">
      <button
        class="request-toggle"
        type="button"
        aria-expanded={showIncomingRequests}
        on:click={() => (showIncomingRequests = !showIncomingRequests)}
      >
        <div>
          <h3>Incoming requests</h3>
          <p>These requests stay private between you and the requester.</p>
        </div>
        <div class="request-toggle-meta">
          <span class="phase-badge current">{data.lifecycle.requestSystem.requestCount} open</span>
          <span class="toggle-symbol">{showIncomingRequests ? '-' : '+'}</span>
        </div>
      </button>

      {#if showIncomingRequests}
        <div class="surface-stack">
          {#if data.lifecycle.requestSystem.requests.length === 0}
            <div class="empty-card">No requests yet.</div>
          {:else}
            {#each data.lifecycle.requestSystem.requests as request}
              <article class="surface-card request-card">
                <div class="request-header-row">
                  <div>
                    <strong>{request.title}</strong>
                    <span>
                      {request.requesterUsername}
                      · {formatRequestedWindow(request.scheduledAt, request.endsAt)}
                      · {formatRelativeTime(request.createdAt)}
                    </span>
                  </div>
                  <span class={`phase-badge ${request.status === 'accepted' ? 'complete' : request.status === 'declined' ? 'locked' : 'upcoming'}`}>
                    {requestStatusLabel(request.status)}
                  </span>
                </div>
                <p>{request.body}</p>
                {#if request.status === 'open'}
                  <div class="binary-row">
                    <button class="vote-chip" type="button" on:click={() => updateRequestStatus(request.id, 'accepted')}>
                      Accept
                    </button>
                    <button class="vote-chip negative" type="button" on:click={() => updateRequestStatus(request.id, 'declined')}>
                      Decline
                    </button>
                  </div>
                {/if}
              </article>
            {/each}
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  <div class="empty-card helper-card">
    <p>
      {#if usesCalendar && data.lifecycle.phaseFive.viewerCanCreateActivities}
        Add available times to the calendar. People can request from those time blocks.
      {:else if usesCalendar}
        Pick an available slot on the calendar to request a time. Your request stays private between you and the creator.
      {:else if data.lifecycle.requestSystem?.viewerCanSubmitRequests}
        Use the request button to describe what you need. The creator will review it privately and reply in messages.
      {:else}
        This service takes direct written requests instead of calendar booking.
      {/if}
    </p>
  </div>

  {#if usesCalendar}
    <ProjectActivityCalendarCard
      activities={data.lifecycle.phaseFive.activities}
      canCreate={calendarCanCreate}
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
  {:else if data.lifecycle.requestSystem?.viewerCanSubmitRequests}
    <div class="composer-actions request-action-row">
      <button class="primary-button" type="button" on:click={openPersonalServiceRequestComposer}>New request</button>
    </div>
  {/if}

  {#if data.lifecycle.phaseFive.viewerCanCreateActivities && showPersonalActivityComposer}
    <div bind:this={activityComposerElement} class="composer-card">
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

  {#if data.lifecycle.requestSystem?.viewerCanSubmitRequests && showPersonalServiceRequestComposer}
    <div bind:this={serviceRequestComposerElement} class="composer-card">
      <div class="request-header-row">
        <div>
          <h3>Request service</h3>
          <p>
            {#if requestScheduleRequired}
              Start from the selected available time and add the details for the creator.
            {:else}
              Describe what you need so the creator can review the request and reply in messages.
            {/if}
          </p>
        </div>
      </div>
      <input bind:value={serviceRequestForm.title} maxlength="120" placeholder="Request title" />
      {#if requestScheduleRequired}
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
        placeholder={requestScheduleRequired
          ? 'What do you need help with?'
          : 'What do you need, and what should the creator expect?'}
      ></textarea>
      <div class="composer-actions">
        <button class="secondary-button" type="button" on:click={closePersonalServiceRequestComposer}>Cancel</button>
        <button class="primary-button" type="button" on:click={submitServiceRequest}>Send request</button>
      </div>
    </div>
  {/if}
</section>

<style>
  .phase-surface,
  .surface-stack,
  .composer-card,
  .mechanics-card,
  .request-card-shell {
    display: grid;
    gap: 12px;
  }

  .request-header-row,
  .binary-row,
  .composer-actions,
  .number-grid {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .number-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .request-header-row {
    justify-content: space-between;
  }

  .request-toggle,
  .request-toggle-meta {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .request-toggle {
    width: 100%;
    justify-content: space-between;
    padding: 0;
    border: 0;
    background: transparent;
    text-align: left;
  }

  .request-toggle-meta {
    justify-content: flex-end;
  }

  .composer-card,
  .empty-card,
  .surface-card,
  .mechanics-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .helper-card {
    background: var(--panel);
  }

  .request-action-row {
    justify-content: flex-start;
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

  .vote-chip.negative {
    border-color: color-mix(in srgb, var(--tablet-community-bg) 40%, var(--panel-border));
    color: var(--tablet-community-text);
  }

  .phase-badge {
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel);
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
  }

  .phase-badge.current,
  .phase-badge.complete {
    border-color: color-mix(in srgb, var(--brand) 40%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 75%, var(--panel));
    color: var(--brand-strong);
  }

  .phase-badge.locked {
    border-color: var(--tablet-community-bg);
    background: color-mix(in srgb, var(--tablet-community-bg) 16%, var(--panel));
    color: var(--tablet-community-text);
  }

  .phase-badge.upcoming {
    border-color: color-mix(in srgb, var(--accent-warm) 40%, var(--panel-border));
    color: var(--accent-warm-strong);
  }

  .toggle-symbol {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel);
    color: var(--text-main);
    font-size: 16px;
    font-weight: 700;
    line-height: 1;
  }

  input,
  textarea {
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

  @media (max-width: 760px) {
    .number-grid {
      grid-template-columns: 1fr;
    }
  }
</style>