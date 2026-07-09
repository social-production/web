<script lang="ts">
  import ActivityCreationWizard from '$lib/components/shared/ActivityCreationWizard.svelte';
  import CollapsibleActivityCard from '$lib/components/cards/project-detail/CollapsibleActivityCard.svelte';
  import ProjectActivityCalendarCard from '$lib/components/cards/project-detail/ProjectActivityCalendarCard.svelte';
  import { formatRelativeTime } from '$lib/utils/time';
  import type { ProjectActivityRoleInput, ProjectPageData } from '$lib/types/detail';

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
  export let serviceRequestForm: { title: string; body: string };
  export let showComposer = false;
  export let highlightedActivityId: string | null = null;
  export let activityComposerElement: HTMLElement | null = null;
  export let openComposer: () => void | Promise<void> = () => {};
  export let openComposerForDay: (isoDay: string) => void | Promise<void> = () => {};
  export let focusActivityCard: (activityId: string) => void | Promise<void> = () => {};
  export let submitActivity: () => void | Promise<void> = () => {};
  export let submitServiceRequest: () => void | Promise<void> = () => {};
  export let changecommitment: (activityId: string, roleLabel: string | null) => void | Promise<void> = () => {};

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
</script>

<section id="participation-activities" class="phase-surface">
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
            <article id={`request-card-${request.id}`} class="surface-card request-card">
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
  .request-card-shell {
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
  h3 {
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

  .primary-button {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
    background: var(--brand);
    color: var(--page-bg);
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

  [id^='activity-card-'] {
    scroll-margin-top: 92px;
  }

  textarea {
    min-height: 110px;
    resize: vertical;
  }
</style>