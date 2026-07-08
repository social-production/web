<script lang="ts">
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import type { ProjectActivityItem, ProjectActivityRole } from '$lib/types/detail';
  import { formatLocalDateTimeRange } from '$lib/utils/time';

  export let activity: ProjectActivityItem;
  export let expanded = false;
  export let highlighted = false;
  export let readOnly = false;
  export let badgeLabel: string | null = null;
  export let badgeClass: 'complete' | 'upcoming' | 'current' | 'locked' | null = null;
  export let changecommitment: (activityId: string, roleLabel: string | null) => void = () => {};

  let openAssigneeRole: string | null = null;

  function timeLabel() {
    return formatLocalDateTimeRange(activity.startAt, activity.endAt);
  }

  function roleHasOpenCapacity(role: ProjectActivityRole) {
    return role.maximumCount == null || role.filledCount < role.maximumCount;
  }

  function commitmentButtonLabel(role: ProjectActivityRole) {
    if (role.isViewerAssigned) {
      return 'Leave role';
    }

    return roleHasOpenCapacity(role) ? 'Take role' : 'Role full';
  }

  function roleAssignees(role: ProjectActivityRole) {
    return role.assignees ?? [];
  }

  function toggleAssigneePopover(role: ProjectActivityRole) {
    if (role.filledCount === 0) {
      return;
    }

    openAssigneeRole = openAssigneeRole === role.label ? null : role.label;
  }

  function closeAssigneePopover() {
    openAssigneeRole = null;
  }

  let open = expanded;

  $: resolvedBadgeLabel = badgeLabel ?? (activity.isActive ? 'Active' : 'Pending roles');
  $: resolvedBadgeClass = badgeClass ?? (activity.isActive ? 'complete' : 'upcoming');
  $: hasOpenRolesForViewer =
    !readOnly &&
    !activity.viewerAssignedRoleLabel &&
    activity.roles.some(
      (role) =>
        !role.isViewerAssigned &&
        (role.maximumCount == null || role.filledCount < role.maximumCount)
    );

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
  data-participation-target={hasOpenRolesForViewer ? 'activity-signup' : undefined}
>
  <summary class="collapse-toggle">
    <div class="activity-header">
      <div class="activity-copy">
        <strong>{activity.title}</strong>
        <span>{timeLabel()}</span>
      </div>
      <span class={`phase-badge ${resolvedBadgeClass}`}>
        {resolvedBadgeLabel}
      </span>
    </div>
    <div class="activity-footer">
      {#if activity.isOnline}
        <span class="online-badge">Online</span>
        {#if activity.locationLabel && activity.locationLabel !== 'Online'}
          <span>{activity.locationLabel}</span>
        {/if}
      {:else}
        <span>{activity.locationLabel}</span>
      {/if}
      <span class="commitment-summary">
        <span>{activity.committedCount}/{activity.minimumParticipants} committed</span>
        {#if activity.maximumParticipants && activity.maximumParticipants > activity.minimumParticipants}
          <span>Up to {activity.maximumParticipants} total</span>
        {/if}
        {#if !open}
          <a class="creator-link creator-tag" href={`/profile/${activity.authorUsername}`}>{activity.authorUsername}</a>
        {/if}
      </span>
    </div>
  </summary>

  {#if open}
    <div class="activity-body">
      <p>{activity.note}</p>
      <div class="activity-footer low-key">
        <span>Minimum {activity.minimumParticipants} needed</span>
        {#if activity.maximumParticipants && activity.maximumParticipants > activity.minimumParticipants}
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
            <div
              class="role-count-wrap"
              aria-label="People in this role"
              role="group"
              on:mouseenter={() => {
                if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
                  openAssigneeRole = role.label;
                }
              }}
              on:mouseleave={() => {
                if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
                  closeAssigneePopover();
                }
              }}
            >
              {#if role.filledCount > 0}
                <button
                  aria-expanded={openAssigneeRole === role.label}
                  class="role-count-button"
                  type="button"
                  on:click={() => toggleAssigneePopover(role)}
                >
                  {role.filledCount} joined
                </button>
                {#if openAssigneeRole === role.label}
                  <div class="assignee-popover" role="tooltip">
                    {#each roleAssignees(role) as assignee (assignee.username)}
                      <a class="assignee-row" href={`/profile/${assignee.username}`}>
                        <AvatarBadge
                          size="sm"
                          username={assignee.username}
                          imageUrl={assignee.profileImageUrl ?? null}
                        />
                        <span>{assignee.username}</span>
                      </a>
                    {/each}
                  </div>
                {/if}
              {:else}
                <span>0 joined</span>
              {/if}
            </div>
            <span>
              Minimum {role.requiredCount}
              {#if role.maximumCount != null}
                · Maximum {role.maximumCount}
              {/if}
            </span>
            {#if !readOnly}
              <button
                class:selected={activity.viewerAssignedRoleLabel === role.label}
                class="vote-chip"
                data-participation-action={!role.isViewerAssigned && roleHasOpenCapacity(role) ? 'take-role' : undefined}
                disabled={!role.isViewerAssigned && !roleHasOpenCapacity(role)}
                type="button"
                on:click={() =>
                  changecommitment(
                    activity.id,
                    activity.viewerAssignedRoleLabel === role.label ? null : role.label
                  )}
              >
                {commitmentButtonLabel(role)}
              </button>
            {/if}
          </div>
        {/each}
      </div>
      <slot />
      <div class="expanded-footer">
        <a class="creator-link creator-tag" href={`/profile/${activity.authorUsername}`}>{activity.authorUsername}</a>
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

  .creator-link {
    text-decoration: none;
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
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 10px;
  }

  .role-card {
    position: relative;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    display: grid;
    gap: 8px;
  }

  .role-count-wrap {
    position: relative;
    display: inline-flex;
  }

  .role-count-button {
    border: none;
    padding: 0;
    background: transparent;
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .assignee-popover {
    position: absolute;
    top: calc(100% + 2px);
    left: 0;
    z-index: 8;
    display: grid;
    gap: 6px;
    min-width: 180px;
    padding: 8px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    box-shadow: 0 10px 28px color-mix(in srgb, #000 18%, transparent);
  }

  .assignee-popover::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 0;
    right: 0;
    height: 6px;
  }

  .assignee-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 6px;
    border-radius: var(--radius-sm);
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
  }

  .assignee-row:hover {
    background: var(--brand-soft);
    color: var(--brand-strong);
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

  .online-badge {
    padding: 4px 8px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--brand) 35%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 70%, var(--panel));
    color: var(--brand-strong);
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