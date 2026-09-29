<script lang="ts">
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import type { ProjectActivityItem, ProjectActivityRole } from '$lib/types/detail';
  import { formatLocalDateTimeRange } from '$lib/utils/time';
  import { searchPeopleSuggestions } from '$lib/services/queries/account';

  export let activity: ProjectActivityItem;
  export let expanded = false;
  export let highlighted = false;
  export let readOnly = false;
  export let historyMode = false;
  export let badgeLabel: string | null = null;
  export let badgeClass: 'complete' | 'upcoming' | 'current' | 'locked' | null = null;
  export let historyRatingSummary: string | null = null;
  export let historyRatingMuted = false;
  export let changecommitment: (activityId: string, roleLabel: string | null) => void = () => {};
  export let viewerCanSuggest = false;
  export let onSuggestRole: (activityId: string, roleId: string, userId: string) => void | Promise<void> = () => {};
  export let onDeclineRoleSuggestion: (activityId: string, roleId: string) => void | Promise<void> = () => {};

  let suggestRoleId: string | null = null;
  let suggestQuery = '';
  let suggestResults: Array<{ id: string; username: string }> = [];
  let suggestTimer: ReturnType<typeof setTimeout> | null = null;

  function timeLabel() {
    return formatLocalDateTimeRange(activity.startAt, activity.endAt);
  }

  function datePartLabel() {
    const start = activity.startAt?.trim() ?? '';
    if (!start) {
      return '';
    }
    const startDate = new Date(start);
    if (Number.isNaN(startDate.getTime())) {
      return '';
    }
    return startDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  function clockLabel() {
    const start = activity.startAt?.trim() ?? '';
    if (!start) {
      return '';
    }
    const startDate = new Date(start);
    if (Number.isNaN(startDate.getTime())) {
      return timeLabel();
    }
    const startTime = startDate.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit'
    });
    const end = activity.endAt?.trim() ?? '';
    const endDate = end ? new Date(end) : null;
    if (!endDate || Number.isNaN(endDate.getTime())) {
      return startTime;
    }
    const endTime = endDate.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit'
    });
    return `${startTime}–${endTime}`;
  }

  function factLine() {
    return [placeLabel(), datePartLabel(), clockLabel()].filter(Boolean).join(' · ');
  }

  function placeLabel() {
    if (activity.isOnline) {
      return activity.locationLabel && activity.locationLabel !== 'Online'
        ? `Online · ${activity.locationLabel}`
        : 'Online';
    }
    return activity.locationLabel || '';
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

  function handleSuggestQuery(roleId: string, value: string) {
    suggestRoleId = roleId;
    suggestQuery = value;
    if (suggestTimer) {
      clearTimeout(suggestTimer);
    }
    if (!value.trim()) {
      suggestResults = [];
      return;
    }
    suggestTimer = setTimeout(() => {
      void searchPeopleSuggestions(value.trim()).then((items) => {
        suggestResults = items;
      });
    }, 200);
  }

  let sheetOpen = false;
  let openedFromHighlight = false;

  $: neededParticipants = Math.max(
    0,
    (activity.minimumParticipants ?? 0) - (activity.committedCount ?? 0)
  );
  $: resolvedBadgeLabel =
    badgeLabel ??
    (activity.rolesLocked
      ? 'Ended'
      : activity.isActive
        ? 'Active'
        : neededParticipants > 0
          ? `Needs ${neededParticipants} more`
          : 'Pending roles');
  $: resolvedBadgeClass = badgeClass ?? (activity.rolesLocked ? 'locked' : activity.isActive ? 'complete' : 'upcoming');
  $: signupTone =
    activity.committedCount <= 0
      ? 'empty'
      : activity.committedCount >= activity.minimumParticipants
        ? 'met'
        : 'partial';
  $: hasOpenRolesForViewer =
    !readOnly &&
    !activity.rolesLocked &&
    !activity.viewerAssignedRoleLabel &&
    activity.roles.some(
      (role) =>
        !role.isViewerAssigned &&
        (role.maximumCount == null || role.filledCount < role.maximumCount)
    );

  $: {
    const shouldOpen = expanded || highlighted;
    if (shouldOpen && !openedFromHighlight) {
      sheetOpen = true;
    }
    openedFromHighlight = shouldOpen;
  }

  function openActivitySheet(event: MouseEvent) {
    if (event.target instanceof Element && event.target.closest('a')) {
      return;
    }
    event.preventDefault();
    sheetOpen = true;
  }
</script>

<div
  class:expanded={sheetOpen}
  class:highlighted
  class:history-mode={historyMode}
  class={`activity-card-shell signup-${signupTone}`}
  data-participation-target={hasOpenRolesForViewer ? 'activity-signup' : undefined}
>
  <button id={`activity-${activity.id}`} class="collapse-toggle" type="button" on:click={openActivitySheet}>
    <span class="activity-head">
      <strong>{activity.title}</strong>
      <span class={`phase-badge ${resolvedBadgeClass}`}>{resolvedBadgeLabel}</span>
    </span>
    {#if factLine()}
      <span class="live-fact">{factLine()}</span>
    {/if}
    <span class="activity-foot">
      <span>{activity.committedCount}/{activity.minimumParticipants} committed</span>
      {#if historyMode && historyRatingSummary}
        <span class:history-rating-muted={historyRatingMuted}>{historyRatingSummary}</span>
      {/if}
      <span class="creator-tag">{activity.authorUsername}</span>
    </span>
  </button>

  <OverlaySheet activity bind:open={sheetOpen} elevated title={activity.title}>
    {#if sheetOpen}
      <div class="activity-body">
        <div class="activity-facts">
          {#if placeLabel()}
            <p class="live-fact">{placeLabel()}</p>
          {/if}
          {#if clockLabel()}
            <p class="live-fact">{clockLabel()}</p>
          {/if}
          {#if datePartLabel()}
            <p class="live-fact">{datePartLabel()}</p>
          {/if}
        </div>
        {#if historyMode}
          <section class="history-activity-record">
            <h4 class="history-activity-record-heading">Activity record</h4>
            <div class="history-activity-record-body">
              {#if activity.note}
                <p class="history-record-note">{activity.note}</p>
              {/if}
              <div class="history-record-meta">
                {#if activity.linkedPlanPhaseLabel}
                  <span>Stage: {activity.linkedPlanPhaseLabel}</span>
                {/if}
                {#if activity.isOnline}
                  <span class="online-badge">Online</span>
                  {#if activity.locationLabel && activity.locationLabel !== 'Online'}
                    <span>{activity.locationLabel}</span>
                  {/if}
                {:else if activity.locationLabel}
                  <span>{activity.locationLabel}</span>
                {/if}
                <span>Minimum {activity.minimumParticipants} needed</span>
                {#if activity.maximumParticipants && activity.maximumParticipants > activity.minimumParticipants}
                  <span>Up to {activity.maximumParticipants} total</span>
                {/if}
                <span>{activity.committedCount}/{activity.minimumParticipants} committed</span>
              </div>
              <div class="role-list">
                {#each activity.roles as role}
                  <div class="role-row">
                    <div class="role-row-head">
                      <strong>{role.label}</strong>
                      <span>{role.filledCount} joined</span>
                    </div>
                    <p class="role-limits">
                      Minimum {role.requiredCount}
                      {#if role.maximumCount != null}
                        · Maximum {role.maximumCount}
                      {/if}
                    </p>
                    {#if roleAssignees(role).length > 0}
                      <div class="assignee-list">
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
                  </div>
                {/each}
              </div>
            </div>
          </section>
          <slot />
          <div class="expanded-footer">
            <span>Created by</span>
            <a class="creator-link creator-tag" href={`/profile/${activity.authorUsername}`}>{activity.authorUsername}</a>
          </div>
        {:else}
          <div class="sheet-status">
            <span class={`phase-badge ${resolvedBadgeClass}`}>{resolvedBadgeLabel}</span>
            <span>{activity.committedCount}/{activity.minimumParticipants} committed</span>
          </div>
          {#if activity.note}
            <p class="activity-note">{activity.note}</p>
          {/if}
          <div class="activity-footer low-key">
            <span>Minimum {activity.minimumParticipants} needed</span>
            {#if activity.maximumParticipants && activity.maximumParticipants > activity.minimumParticipants}
              <span>Up to {activity.maximumParticipants} total</span>
            {/if}
            {#if activity.linkedPlanPhaseLabel}
              <span>Stage: {activity.linkedPlanPhaseLabel}</span>
            {/if}
          </div>
          <div class="role-list">
            {#each activity.roles as role}
              <div class="role-row">
                <div class="role-row-head">
                  <strong>{role.label}</strong>
                  <span>{role.filledCount} joined</span>
                </div>
                <p class="role-limits">
                  Minimum {role.requiredCount}
                  {#if role.maximumCount != null}
                    · Maximum {role.maximumCount}
                  {/if}
                </p>
                {#if roleAssignees(role).length > 0}
                  <div class="assignee-list">
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
                {#if role.suggestedUser}
                  <span class="suggested-chip">suggested: @{role.suggestedUser.username}</span>
                  {#if role.isViewerSuggested && role.id}
                    <button class="text-button" type="button" on:click={() => onDeclineRoleSuggestion(activity.id, role.id ?? '')}>
                      Decline
                    </button>
                  {/if}
                {:else if viewerCanSuggest && role.id && !role.isViewerAssigned}
                  <button class="text-button" type="button" on:click={() => (suggestRoleId = role.id ?? null)}>
                    Suggest someone
                  </button>
                  {#if suggestRoleId === role.id}
                    <input
                      placeholder="Search username"
                      type="text"
                      value={suggestQuery}
                      on:input={(event) =>
                        handleSuggestQuery(role.id ?? '', (event.currentTarget as HTMLInputElement).value)}
                    />
                    {#each suggestResults as person}
                      <button
                        class="text-button"
                        type="button"
                        on:click={() => {
                          void onSuggestRole(activity.id, role.id ?? '', person.id);
                          suggestRoleId = null;
                          suggestQuery = '';
                          suggestResults = [];
                        }}
                      >
                        @{person.username}
                      </button>
                    {/each}
                  {/if}
                {/if}
                {#if !readOnly && activity.rolesLocked}
                  <span class="roles-locked-copy">Roles locked — activity ended</span>
                {:else if !readOnly}
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
            <span>Created by</span>
            <a class="creator-link creator-tag" href={`/profile/${activity.authorUsername}`}>{activity.authorUsername}</a>
          </div>
        {/if}
      </div>
    {/if}
  </OverlaySheet>
</div>

<style>
  .activity-card-shell {
    border: 1px solid var(--panel-border);
    border-left-width: 4px;
    border-radius: 0;
    background: var(--panel-strong);
    overflow: hidden;
  }

  .activity-card-shell.signup-empty {
    border-left-color: #ef4444;
  }

  .activity-card-shell.signup-partial {
    border-left-color: var(--status-yellow);
  }

  .activity-card-shell.signup-met {
    border-left-color: var(--brand);
  }

  .activity-card-shell:hover,
  .activity-card-shell.highlighted {
    border-top-color: color-mix(in srgb, var(--brand) 45%, var(--panel-border));
    border-right-color: color-mix(in srgb, var(--brand) 45%, var(--panel-border));
    border-bottom-color: color-mix(in srgb, var(--brand) 45%, var(--panel-border));
  }

  :global(.card-rail:has(.activity-card-shell)),
  :global(.surface-stack:has(.activity-card-shell)) {
    gap: 0;
  }

  :global(.rail-card + .rail-card > .activity-card-shell),
  :global(.surface-stack > * + * > .activity-card-shell) {
    margin-top: -1px;
  }

  .collapse-toggle {
    width: 100%;
    padding: 14px 14px 12px;
    border: 0;
    background: transparent;
    text-align: left;
    display: grid;
    gap: 3px;
    cursor: pointer;
    color: inherit;
    font: inherit;
  }

  .activity-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
  }

  .activity-head strong {
    color: var(--text-main);
    font-size: 16px;
    line-height: 1.3;
    min-width: 0;
  }

  .activity-facts {
    display: grid;
    gap: 2px;
  }

  .live-fact {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
    font-weight: 400;
    line-height: 1.45;
  }

  .activity-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--panel-border);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .history-rating-muted {
    color: var(--text-soft);
    font-style: italic;
  }

  .creator-tag {
    color: var(--text-main);
    font-size: 11px;
    font-weight: 700;
  }

  .creator-link {
    text-decoration: none;
  }

  .sheet-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .activity-note {
    margin: 0;
    color: var(--text-main);
    font-size: 15px;
    line-height: 1.5;
  }

  .activity-body {
    display: grid;
    gap: 16px;
  }

  .activity-body > p {
    margin: 0;
    color: var(--text-main);
    font-size: 15px;
    line-height: 1.5;
  }

  .history-mode .activity-body > p,
  .history-mode .activity-body .low-key,
  .history-mode .role-row strong,
  .history-mode .role-row span {
    color: var(--text-soft);
    font-size: 12px;
  }

  .history-activity-record {
    display: grid;
    gap: 8px;
    padding-bottom: 12px;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 70%, transparent);
  }

  .history-activity-record-heading {
    margin: 0;
    color: var(--brand-strong);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .history-activity-record-body {
    display: grid;
    gap: 10px;
    color: var(--text-soft);
    font-size: 12px;
  }

  .history-record-note {
    margin: 0;
    line-height: 1.45;
    color: var(--text-main);
    font-size: 13px;
  }

  .history-activity-record-body p {
    margin: 0;
    line-height: 1.45;
  }

  .history-record-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    font-size: 12px;
  }

  .role-list {
    display: grid;
    gap: 8px;
  }

  .role-row {
    display: grid;
    gap: 8px;
    padding: 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .role-row-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }

  .role-row-head strong {
    color: var(--text-main);
    font-size: 14px;
  }

  .role-row-head span,
  .role-limits {
    margin: 0;
    color: var(--text-soft);
    font-size: 12px;
  }

  .assignee-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .activity-footer {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .activity-footer span {
    padding: 4px 8px;
    border-radius: 999px;
    background: var(--panel-strong);
    border: 1px solid var(--panel-border);
  }

  .expanded-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 4px;
    padding-top: 12px;
    color: var(--text-soft);
    font-size: 13px;
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

  .activity-body .vote-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 48px;
    margin-top: 4px;
    border: 0;
    border-radius: var(--radius-sm);
    background: var(--brand);
    color: var(--page-bg);
    font-size: 15px;
    font-weight: 700;
  }

  .activity-body .vote-chip.selected {
    background: var(--panel);
    color: var(--danger, #c0392b);
    box-shadow: inset 0 0 0 1px var(--panel-border);
  }

  .activity-body .vote-chip:disabled {
    background: var(--panel);
    color: var(--text-soft);
    box-shadow: inset 0 0 0 1px var(--panel-border);
    cursor: not-allowed;
  }

  .activity-body .vote-chip:hover:not(:disabled):not(.selected) {
    border-color: transparent;
    background: var(--brand);
    color: var(--page-bg);
    filter: brightness(0.96);
  }

  .suggested-chip {
    display: inline-flex;
    padding: 4px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--brand-soft) 70%, var(--panel));
    color: var(--brand-strong);
    font-size: 11px;
    font-weight: 700;
  }

  .text-button {
    justify-self: start;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--brand-strong);
    font-size: 13px;
    font-weight: 700;
    text-align: left;
    cursor: pointer;
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

  .phase-badge.locked {
    border-color: var(--panel-border);
    background: var(--panel);
    color: var(--text-soft);
  }

  .roles-locked-copy {
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 600;
  }

  .low-key {
    color: var(--text-soft);
    font-size: 12px;
  }
</style>
