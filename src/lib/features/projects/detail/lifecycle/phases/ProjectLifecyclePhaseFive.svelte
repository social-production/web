<script lang="ts">
  import CollapsibleActivityCard from '$lib/components/cards/project-detail/CollapsibleActivityCard.svelte';
  import ProjectActivityCalendarCard from '$lib/components/cards/project-detail/ProjectActivityCalendarCard.svelte';
  import ProjectActivityRolesEditor from '$lib/components/forms/project-detail/ProjectActivityRolesEditor.svelte';
  import { formatRelativeTime } from '$lib/utils/time';
  import type { ProjectActivityRoleInput, ProjectPageData } from '$lib/types/detail';

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
  export let activityForm: ActivityForm;
  export let serviceRequestForm: { title: string; body: string };
  export let showComposer = false;
  export let highlightedActivityId: string | null = null;
  export let activityComposerElement: HTMLElement | null = null;
  export let activityStartInputElement: HTMLInputElement | null = null;
  export let activityEndInputElement: HTMLInputElement | null = null;
  export let openComposer: () => void | Promise<void> = () => {};
  export let openComposerForDay: (isoDay: string) => void | Promise<void> = () => {};
  export let focusActivityCard: (activityId: string) => void | Promise<void> = () => {};
  export let submitActivity: () => void | Promise<void> = () => {};
  export let submitServiceRequest: () => void | Promise<void> = () => {};
  export let changecommitment: (activityId: string, roleLabel: string | null) => void | Promise<void> = () => {};

  function minimumParticipantsForRoles(roleRequirements: ProjectActivityRoleInput[]) {
    return roleRequirements.reduce(
      (total, role) => total + Math.max(1, Number(role.requiredCount) || 1),
      0
    );
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

  $: minimumParticipants = minimumParticipantsForRoles(activityForm.roleRequirements);
</script>

<section class="phase-surface">
  {#if data.lifecycle.requestSystem?.enabled}
    <div class="mechanics-card request-card-shell">
      <div class="request-header-row">
        <div>
          <h3>Service requests</h3>
          <p>{data.lifecycle.requestSystem.requestCount} active request{data.lifecycle.requestSystem.requestCount === 1 ? '' : 's'}</p>
        </div>
        <span class="phase-badge current">Requests open</span>
      </div>

      {#if data.lifecycle.requestSystem.viewerCanSubmitRequests}
        <div class="composer-card">
          <input bind:value={serviceRequestForm.title} maxlength="120" placeholder="Request title" />
          <textarea bind:value={serviceRequestForm.body} rows="3" placeholder="What service is being requested?"></textarea>
          <div class="composer-actions">
            <button class="primary-button" type="button" on:click={submitServiceRequest}>Create request</button>
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
              </div>
              <p>{request.body}</p>
            </article>
          {/each}
        {/if}
      </div>
    </div>
  {/if}

  <ProjectActivityCalendarCard
    activities={data.lifecycle.phaseFive.activities}
    canCreate={data.lifecycle.phaseFive.viewerCanCreateActivities}
    createActive={showComposer}
    selectedDayIso={activityForm.scheduledAt}
    daySelect={openComposerForDay}
    createAction={toggleActivityComposer}
    activitySelect={focusActivityCard}
  />

  {#if data.lifecycle.phaseFive.viewerCanCreateActivities && showComposer}
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
      <textarea bind:value={activityForm.note} rows="3" placeholder="What should happen in this activity?"></textarea>
      <div class="composer-actions">
        <button class="secondary-button" type="button" on:click={closeComposer}>Cancel</button>
        <button class="primary-button" type="button" on:click={submitActivity}>Create activity</button>
      </div>
    </div>
  {/if}

  <div class="surface-stack">
    {#if data.lifecycle.phaseFive.activities.length === 0}
      <div class="empty-card">No activities scheduled yet.</div>
    {:else}
      {#each data.lifecycle.phaseFive.activities as activity (activity.id)}
        <div id={`activity-card-${activity.id}`}>
          <CollapsibleActivityCard
            activity={activity}
            highlighted={highlightedActivityId === activity.id}
            changecommitment={changecommitment}
          />
        </div>
      {/each}
    {/if}
  </div>
</section>

<style>
  .phase-surface,
  .surface-stack,
  .composer-card,
  .mechanics-card,
  .request-card-shell,
  .number-grid {
    display: grid;
    gap: 12px;
  }

  .request-header-row,
  .composer-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
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

  .phase-badge {
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: color-mix(in srgb, var(--brand-soft) 75%, var(--panel));
    color: var(--brand-strong);
    font-size: 11px;
    font-weight: 700;
  }

  .primary-button,
  .secondary-button {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
  }

  .primary-button {
    background: var(--brand);
    color: var(--page-bg);
  }

  .secondary-button {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    color: var(--text-soft);
  }

  .number-grid {
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

  @media (max-width: 760px) {
    .number-grid {
      grid-template-columns: 1fr;
    }
  }
</style>