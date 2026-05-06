<script lang="ts">
  import type { ProjectActivityItem, ProjectActivityRole } from '$lib/types/detail';

  export let activity: ProjectActivityItem;
  export let expanded = false;
  export let highlighted = false;
  export let changecommitment: (activityId: string, roleLabel: string | null) => void = () => {};

  function sameCalendarDay(left: Date, right: Date) {
    return (
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate()
    );
  }

  function formatDayDate(value: Date) {
    return value.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function formatTime(value: Date) {
    return value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function timeLabel() {
    const start = new Date(activity.startAt);
    const end = new Date(activity.endAt);

    if (sameCalendarDay(start, end)) {
      return `${formatDayDate(start)}, ${formatTime(start)} - ${formatTime(end)}`;
    }

    return `${formatDayDate(start)}, ${formatTime(start)} - ${formatDayDate(end)}, ${formatTime(end)}`;
  }

  function commitmentTarget() {
    return activity.maximumParticipants > activity.minimumParticipants
      ? activity.maximumParticipants
      : activity.minimumParticipants;
  }

  function requiredRoleCommitmentCount() {
    return activity.roles
      .filter((role) => !role.isExtraSlot)
      .reduce((total, role) => total + Math.min(role.filledCount, role.requiredCount), 0);
  }

  function extrasRole() {
    return activity.roles.find((role) => role.isExtraSlot) ?? null;
  }

  function commitmentButtonLabel(role: ProjectActivityRole) {
    if (role.isViewerAssigned) {
      return role.isExtraSlot ? 'Leave extra slot' : 'Leave role';
    }

    return role.isExtraSlot ? 'Take extra slot' : 'Take role';
  }

  let open = expanded;

  $: if (expanded || highlighted) {
    open = true;
  }
</script>

<details
  id={`activity-${activity.id}`}
  bind:open={open}
  class:expanded={open}
  class:highlighted
  class="activity-card-shell"
>
  <summary class="collapse-toggle">
    <div class="activity-header">
      <div class="activity-copy">
        <strong>{activity.title}</strong>
        <span>{timeLabel()}</span>
      </div>
      <span class={`phase-badge ${activity.isActive ? 'complete' : 'upcoming'}`}>
        {activity.isActive ? 'Active' : 'Pending roles'}
      </span>
    </div>
    <div class="activity-footer">
      <span>{activity.locationLabel}</span>
      <span class="commitment-summary">
        <span>{requiredRoleCommitmentCount()}/{activity.minimumParticipants} committed</span>
        {#if extrasRole()}
          <span>{extrasRole()?.filledCount}/{extrasRole()?.requiredCount} extras</span>
        {/if}
        {#if !open}
          <span class="creator-tag">{activity.authorUsername}</span>
        {/if}
      </span>
    </div>
  </summary>

  {#if open}
    <div class="activity-body">
      <p>{activity.note}</p>
      <div class="activity-footer low-key">
        <span>Minimum {activity.minimumParticipants} needed</span>
        {#if activity.maximumParticipants > activity.minimumParticipants}
          <span>Up to {activity.maximumParticipants} total</span>
        {/if}
        {#if activity.linkedPlanPhaseLabel}
          <span>Stage: {activity.linkedPlanPhaseLabel}</span>
        {/if}
      </div>
      <div class="role-grid">
        {#each activity.roles as role}
          <div class="role-card">
            <strong>{role.label}</strong>
            {#if role.isExtraSlot}
              <span>Optional extra capacity</span>
            {/if}
            <span>{role.filledCount}/{role.requiredCount} filled</span>
            <button
              class:selected={activity.viewerAssignedRoleLabel === role.label}
              class="vote-chip"
              type="button"
              on:click={() =>
                changecommitment(
                  activity.id,
                  activity.viewerAssignedRoleLabel === role.label ? null : role.label
                )}
            >
              {commitmentButtonLabel(role)}
            </button>
          </div>
        {/each}
      </div>
      <div class="expanded-footer">
        <span class="creator-tag">{activity.authorUsername}</span>
      </div>
    </div>
  {/if}
</details>

<style>
  .activity-card-shell {
    padding: 12px 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    display: grid;
    gap: 10px;
    transition: border-color 0.12s ease, box-shadow 0.12s ease;
  }

  .activity-card-shell:hover,
  .activity-card-shell.expanded,
  .activity-card-shell.highlighted {
    border-color: color-mix(in srgb, var(--brand) 40%, var(--panel-border));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 25%, transparent);
  }

  .collapse-toggle {
    width: 100%;
    list-style: none;
    padding: 0;
    border: 0;
    background: transparent;
    text-align: left;
    display: grid;
    gap: 10px;
    cursor: pointer;
  }

  .collapse-toggle::-webkit-details-marker {
    display: none;
  }

  .activity-header,
  .activity-footer {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .activity-copy {
    display: grid;
    gap: 3px;
  }

  .activity-copy strong {
    color: var(--text-main);
  }

  .activity-copy span,
  .activity-footer,
  .low-key {
    color: var(--text-soft);
    font-size: 12px;
  }

  .commitment-summary {
    display: grid;
    gap: 2px;
    justify-items: end;
    text-align: right;
  }

  .creator-tag {
    color: var(--text-main);
    font-size: 11px;
    font-weight: 700;
  }

  .activity-body {
    display: grid;
    gap: 10px;
  }

  .expanded-footer {
    display: flex;
    justify-content: flex-end;
  }

  .role-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .role-card {
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    display: grid;
    gap: 8px;
  }

  .vote-chip {
    padding: 7px 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
  }

  .vote-chip.selected {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .vote-chip:hover {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
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

  .phase-badge.complete {
    border-color: color-mix(in srgb, var(--brand) 40%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 75%, var(--panel));
    color: var(--brand-strong);
  }

  .phase-badge.upcoming {
    border-color: color-mix(in srgb, var(--status-yellow) 44%, var(--panel-border));
    background: color-mix(in srgb, var(--status-yellow-soft) 72%, var(--panel));
    color: var(--status-yellow-strong);
  }

  @media (max-width: 760px) {
    .commitment-summary {
      justify-items: start;
      text-align: left;
    }

    .role-grid {
      grid-template-columns: 1fr;
    }
  }
</style>