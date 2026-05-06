<script lang="ts">
  import CollapsibleActivityCard from '$lib/components/cards/project-detail/CollapsibleActivityCard.svelte';
  import ProjectValueCard from '$lib/components/cards/project-detail/ProjectValueCard.svelte';
  import ProjectActivityRolesEditor from '$lib/components/forms/project-detail/ProjectActivityRolesEditor.svelte';
  import RoundPlusButton from '$lib/components/shared/RoundPlusButton.svelte';
  import { isPersonalServiceProject } from '$lib/features/projects/projectMode';
  import type {
    ProjectActivityRoleInput,
    ProjectImportanceVoteValue,
    ProjectPageData,
    ProjectServiceRequestStatus
  } from '$lib/types/detail';
  import { formatRelativeTime } from '$lib/utils/time';

  type ActivityForm = {
    title: string;
    scheduledAt: string;
    endsAt: string;
    locationLabel: string;
    roleRequirements: ProjectActivityRoleInput[];
    maximumParticipants: number;
    linkedPlanPhaseId: string | null;
    note: string;
  };

  export let data: ProjectPageData;
  export let draftValue = '';
  export let showValueComposer = false;
  export let showPersonalActivityComposer = false;
  export let serviceRequestForm: { title: string; body: string };
  export let activityForm: ActivityForm;
  export let activityComposerElement: HTMLElement | null = null;
  export let activityStartInputElement: HTMLInputElement | null = null;
  export let activityEndInputElement: HTMLInputElement | null = null;
  export let highlightedActivityId: string | null = null;
  export let importanceOptions: Array<{ value: ProjectImportanceVoteValue; label: string }> = [];
  export let submitValue: () => void | Promise<void> = () => {};
  export let submitServiceRequest: () => void | Promise<void> = () => {};
  export let updateRequestStatus: (requestId: string, status: ProjectServiceRequestStatus) => void | Promise<void> = () => {};
  export let openPersonalActivityComposer: () => void | Promise<void> = () => {};
  export let submitActivity: () => void | Promise<void> = () => {};
  export let changecommitment: (activityId: string, roleLabel: string | null) => void | Promise<void> = () => {};
  export let vote: (valueId: string, voteValue: ProjectImportanceVoteValue) => void | Promise<void> = () => {};

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

  function minimumParticipantsForRoles(roleRequirements: ProjectActivityRoleInput[]) {
    return roleRequirements.reduce(
      (total, role) => total + Math.max(1, Number(role.requiredCount) || 1),
      0
    );
  }

  function closePersonalActivityComposer() {
    showPersonalActivityComposer = false;
  }

  $: minimumParticipants = minimumParticipantsForRoles(activityForm.roleRequirements);
</script>

<section class="phase-surface">
  {#if isPersonalServiceProject(data.projectMode)}
    {#if data.lifecycle.personalService}
      <div class="plan-grid single-column">
        <div class="meta-card">
          <strong>Availability</strong>
          <p>{data.lifecycle.personalService.availabilitySummary}</p>
        </div>
        {#if data.lifecycle.personalService.travelRadiusLabel}
          <div class="meta-card">
            <strong>Travel radius</strong>
            <p>{data.lifecycle.personalService.travelRadiusLabel}</p>
          </div>
        {/if}
      </div>
    {/if}

    {#if data.lifecycle.requestSystem?.enabled}
      <div class="mechanics-card request-card-shell">
        <div class="request-header-row">
          <div>
            <h3>Open requests</h3>
            <p>{data.lifecycle.requestSystem.requestCount} active request{data.lifecycle.requestSystem.requestCount === 1 ? '' : 's'}</p>
          </div>
          {#if data.lifecycle.requestSystem.viewerCanSubmitRequests}
            <span class="phase-badge current">Requests open</span>
          {/if}
        </div>

        {#if data.lifecycle.requestSystem.viewerCanSubmitRequests}
          <div class="composer-card">
            <input bind:value={serviceRequestForm.title} maxlength="120" placeholder="Request title" />
            <textarea bind:value={serviceRequestForm.body} rows="3" placeholder="What help is needed, and when?"></textarea>
            <div class="composer-actions">
              <button class="primary-button" type="button" on:click={submitServiceRequest}>Send request</button>
            </div>
          </div>
        {/if}

        <div class="surface-stack">
          {#if data.lifecycle.requestSystem.requests.length === 0}
            <div class="empty-card">No requests yet.</div>
          {:else}
            {#each data.lifecycle.requestSystem.requests as request}
              <article class="surface-card request-card">
                <div class="request-header-row">
                  <div>
                    <strong>{request.title}</strong>
                    <span>{formatRelativeTime(request.createdAt)}</span>
                  </div>
                  <span class={`phase-badge ${request.status === 'accepted' ? 'complete' : request.status === 'declined' ? 'locked' : 'upcoming'}`}>
                    {requestStatusLabel(request.status)}
                  </span>
                </div>
                <p>{request.body}</p>
                {#if data.lifecycle.requestSystem.viewerCanReviewRequests && request.status === 'open'}
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
      </div>
    {/if}

    {#if data.lifecycle.phaseFive.viewerCanCreateActivities}
      <div class="composer-toggle-row">
        <RoundPlusButton
          active={showPersonalActivityComposer}
          ariaLabel="Add activity"
          action={() => (showPersonalActivityComposer ? (showPersonalActivityComposer = false) : openPersonalActivityComposer())}
        />
      </div>

      {#if showPersonalActivityComposer}
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
          <input bind:value={activityForm.locationLabel} maxlength="120" placeholder="Location" />

          <ProjectActivityRolesEditor bind:roles={activityForm.roleRequirements} />

          <div class="number-grid">
            <div class="count-field">
              <span class="count-field-label">
                <span class="field-inline-label">Minimum people:</span>
                <span class="count-note">Calculated from the role counts above.</span>
              </span>
              <div class="count-readout">
                <strong>{minimumParticipants}</strong>
              </div>
            </div>
            <label class="count-field">
              <span class="count-field-label">
                <span class="field-inline-label">Maximum people:</span>
              </span>
              <input class="count-input" bind:value={activityForm.maximumParticipants} min={minimumParticipants} type="number" />
            </label>
          </div>
          <textarea bind:value={activityForm.note} rows="3" placeholder="What needs to happen and why?"></textarea>
          <div class="composer-actions">
            <button class="secondary-button" type="button" on:click={closePersonalActivityComposer}>Cancel</button>
            <button class="primary-button" type="button" on:click={submitActivity}>Create activity</button>
          </div>
        </div>
      {/if}
    {/if}

    <div class="surface-stack">
      {#if data.lifecycle.phaseFive.activities.length === 0}
        <div class="empty-card">No activity scheduled yet.</div>
      {:else}
        {#each data.lifecycle.phaseFive.activities as activity (activity.id)}
          <CollapsibleActivityCard
            activity={activity}
            highlighted={highlightedActivityId === activity.id}
            changecommitment={changecommitment}
          />
        {/each}
      {/if}
    </div>
  {:else}
    {#if data.lifecycle.phaseOne.viewerCanAddValue}
      <div class="composer-toggle-row">
        <RoundPlusButton active={showValueComposer} ariaLabel="Add value proposal" action={() => (showValueComposer = !showValueComposer)} />
      </div>

      {#if showValueComposer}
        <div class="composer-card">
          <input bind:value={draftValue} maxlength="160" placeholder="Add a value, for example: should make use of unused space" />
          <div class="composer-actions">
            <button class="secondary-button" type="button" on:click={() => (showValueComposer = false)}>Cancel</button>
            <button class="primary-button" type="button" on:click={submitValue}>Add value</button>
          </div>
        </div>
      {/if}
    {/if}

    <div class="surface-stack compact-stack">
      {#if data.lifecycle.phaseOne.values.length === 0}
        <div class="empty-card">No values added yet.</div>
      {:else}
        {#each data.lifecycle.phaseOne.values as value}
          <ProjectValueCard canVote={data.lifecycle.phaseOne.viewerCanVoteOnValues} options={importanceOptions} {value} {vote} />
        {/each}
      {/if}
    </div>
  {/if}
</section>

<style>
  .phase-surface,
  .surface-stack,
  .composer-card,
  .plan-grid,
  .mechanics-card,
  .request-card-shell,
  .meta-card {
    display: grid;
    gap: 12px;
  }

  .request-header-row,
  .binary-row,
  .composer-actions,
  .composer-toggle-row,
  .number-grid {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .composer-toggle-row {
    justify-content: center;
  }

  .plan-grid,
  .number-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
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

  .count-readout,
  .count-input {
    width: 100%;
    min-height: 48px;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
    box-sizing: border-box;
  }

  .count-readout {
    display: flex;
    align-items: center;
  }

  .count-readout strong {
    color: var(--text-main);
    font-size: 18px;
    line-height: 1;
  }

  .single-column {
    grid-template-columns: 1fr;
  }

  .request-header-row {
    justify-content: space-between;
  }

  .composer-card,
  .empty-card,
  .surface-card,
  .mechanics-card,
  .meta-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
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

  .compact-stack {
    gap: 10px;
  }

  @media (max-width: 760px) {
    .plan-grid,
    .number-grid {
      grid-template-columns: 1fr;
    }
  }
</style>