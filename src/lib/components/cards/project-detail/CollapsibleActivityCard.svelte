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

  function sameLocalDay(start: Date, end: Date) {
    return (
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate()
    );
  }

  function dateLine() {
    const start = activity.startAt?.trim() ? new Date(activity.startAt) : null;
    const end = activity.endAt?.trim() ? new Date(activity.endAt) : null;
    if (!start || Number.isNaN(start.getTime())) {
      return timeLabel();
    }
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    };
    const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
    const startDate = start.toLocaleDateString(undefined, dateOptions);
    const startTime = start.toLocaleTimeString(undefined, timeOptions);
    if (!end || Number.isNaN(end.getTime())) {
      return `${startDate} · ${startTime}`;
    }
    const endTime = end.toLocaleTimeString(undefined, timeOptions);
    if (sameLocalDay(start, end)) {
      return `${startDate} · ${startTime}–${endTime}`;
    }
    const endDate = end.toLocaleDateString(undefined, dateOptions);
    return `${startDate}, ${startTime} – ${endDate}, ${endTime}`;
  }

  function factLine() {
    return [placeLabel(), dateLine()].filter(Boolean).join(' · ');
  }

  function roleCapacity(role: ProjectActivityRole) {
    const span =
      role.maximumCount != null && role.maximumCount !== role.requiredCount
        ? `${role.requiredCount}–${role.maximumCount}`
        : `${role.requiredCount}`;
    return `${role.filledCount} of ${span}`;
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
  $: noteText = activity.note.trim();
  $: showNote = Boolean(noteText);
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
        {#if placeLabel()}
          <p class="sheet-place">{placeLabel()}</p>
        {/if}
        {#if dateLine()}
          <p class="sheet-when">{dateLine()}</p>
        {/if}
        {#if activity.linkedPlanPhaseLabel}
          <p class="activity-stage">{activity.linkedPlanPhaseLabel}</p>
        {/if}

        {#if showNote}
          <section class="sheet-section">
            <h3>Description</h3>
            <p class="activity-note">{noteText}</p>
          </section>
        {/if}

        {#if activity.roles.length > 0}
          <section class="sheet-section">
            <h3>Roles</h3>
            <div class="role-list">
              {#each activity.roles as role}
                <div class="role-bar">
                  <div class="role-copy">
                    <strong>{role.label}</strong>
                    <span>{roleCapacity(role)}</span>
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
                    {#if !historyMode && role.suggestedUser}
                      <span class="suggested-chip">Suggested · {role.suggestedUser.username}</span>
                      {#if role.isViewerSuggested && role.id}
                        <button class="text-button" type="button" on:click={() => onDeclineRoleSuggestion(activity.id, role.id ?? '')}>
                          Decline
                        </button>
                      {/if}
                    {:else if !historyMode && viewerCanSuggest && role.id && !role.isViewerAssigned}
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
                            {person.username}
                          </button>
                        {/each}
                      {/if}
                    {/if}
                  </div>
                  {#if !historyMode && !readOnly && activity.rolesLocked}
                    <span class="roles-locked-copy">Locked</span>
                  {:else if !historyMode && !readOnly}
                    <button
                      class:selected={activity.viewerAssignedRoleLabel === role.label}
                      class="signup"
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
          </section>
        {/if}
        <slot />
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

  .sheet-place,
  .sheet-when,
  .activity-stage {
    margin: 0;
    color: var(--text-main);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
  }

  .sheet-when,
  .activity-stage {
    color: var(--text-soft);
    font-weight: 400;
  }

  .sheet-section {
    display: grid;
    gap: 8px;
  }

  .sheet-section h3 {
    margin: 0;
    color: var(--brand-strong);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .activity-note {
    margin: 0;
    color: var(--text-main);
    font-size: 15px;
    line-height: 1.5;
  }

  .activity-body {
    display: grid;
    gap: 8px;
  }

  .activity-body > .sheet-section {
    margin-top: 10px;
  }

  .role-list {
    display: grid;
    gap: 0;
    border-top: 1px solid var(--panel-border);
  }

  .role-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 0;
    border-bottom: 1px solid var(--panel-border);
    background: transparent;
  }

  .role-bar:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  .role-copy {
    display: grid;
    gap: 2px;
    flex: 1 1 auto;
    min-width: 0;
  }

  .role-copy strong {
    color: var(--text-main);
    font-size: 15px;
  }

  .role-copy > span {
    color: var(--text-soft);
    font-size: 13px;
  }

  .signup {
    display: grid;
    place-items: center;
    flex: 0 0 56px;
    width: 56px;
    height: 56px;
    padding: 4px;
    border: 0;
    border-radius: 12px;
    background: var(--brand);
    color: var(--page-bg);
    font-size: 11px;
    font-weight: 800;
    line-height: 1.05;
    text-align: center;
    cursor: pointer;
  }

  .signup.selected {
    background: var(--panel-strong);
    color: var(--text-main);
    box-shadow: inset 0 0 0 1px var(--panel-border);
  }

  .signup:hover:not(:disabled) {
    background: color-mix(in srgb, var(--brand) 78%, white);
    color: var(--page-bg);
    filter: none;
    transform: none;
  }

  .signup.selected:hover:not(:disabled) {
    background: var(--brand-soft);
    color: var(--brand-strong);
    filter: none;
    transform: none;
  }

  .signup:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .assignee-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
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

  .suggested-chip {
    justify-self: start;
    width: fit-content;
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
</style>
