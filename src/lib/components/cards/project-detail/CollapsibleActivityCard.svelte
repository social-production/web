<script lang="ts">
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import type { ProjectActivityItem, ProjectActivityRole } from '$lib/types/detail';
  import { formatLocalDateTimeRange, formatLocalTimezoneAbbreviation } from '$lib/utils/time';
  import { getDisplayTimezone } from '$lib/stores/timezoneStore';
  import { isoDayInZone } from '$lib/utils/calendarDay';
  import { searchPeopleSuggestions } from '$lib/services/queries/account';
  import { showToast } from '$lib/stores/toast';
  import { openPlaceOnMap } from '$lib/stores/mapFocus';
  import { buildShareUrl } from '$lib/utils/sharePrefill';
  import { shareLink } from '$lib/utils/share';

  export let activity: ProjectActivityItem;
  export let expanded = false;
  export let highlighted = false;
  export let readOnly = false;
  export let historyMode = false;
  /** Agenda row under the calendar: fixed two-line row with time, title, place and a fill chip. */
  export let agenda = false;
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

  // Days and times follow the viewer's Display timezone, not the browser's.
  function sameLocalDay(start: Date, end: Date) {
    const zone = getDisplayTimezone();
    return isoDayInZone(start, zone) === isoDayInZone(end, zone);
  }

  function dateLine() {
    const start = activity.startAt?.trim() ? new Date(activity.startAt) : null;
    const end = activity.endAt?.trim() ? new Date(activity.endAt) : null;
    if (!start || Number.isNaN(start.getTime())) {
      return timeLabel();
    }
    const timeZone = getDisplayTimezone();
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone
    };
    const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', timeZone };
    const zone = formatLocalTimezoneAbbreviation(start, timeZone);
    const startDate = start.toLocaleDateString(undefined, dateOptions);
    const startTime = start.toLocaleTimeString(undefined, timeOptions);
    const suffix = zone ? ` ${zone}` : '';
    if (!end || Number.isNaN(end.getTime())) {
      return `${startDate} · ${startTime}${suffix}`;
    }
    const endTime = end.toLocaleTimeString(undefined, timeOptions);
    if (sameLocalDay(start, end)) {
      return `${startDate} · ${startTime}–${endTime}${suffix}`;
    }
    const endDate = end.toLocaleDateString(undefined, dateOptions);
    return `${startDate}, ${startTime} – ${endDate}, ${endTime}${suffix}`;
  }

  $: agendaZone = activity.startAt?.trim()
    ? formatLocalTimezoneAbbreviation(new Date(activity.startAt), getDisplayTimezone())
    : '';

  function clockTime(value: string | null | undefined) {
    const date = value?.trim() ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: getDisplayTimezone()
    });
  }

  function shortDay(value: string | null | undefined) {
    const date = value?.trim() ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      timeZone: getDisplayTimezone()
    });
  }

  // For activities that run past midnight: the end day, e.g. "Sat 18".
  function multiDayEnd(startValue: string | null | undefined, endValue: string | null | undefined) {
    const start = startValue?.trim() ? new Date(startValue) : null;
    const end = endValue?.trim() ? new Date(endValue) : null;
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
    if (sameLocalDay(start, end)) return '';
    return end.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      timeZone: getDisplayTimezone()
    }).replace(',', '');
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

  function mapHref() {
    return `https://www.openstreetmap.org/search?query=${encodeURIComponent(activity.locationLabel)}`;
  }

  function showOnMap(event: MouseEvent) {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    sheetOpen = false;
    openPlaceOnMap(activity.locationLabel);
  }

  async function shareActivity() {
    await shareLink({
      url: buildShareUrl(`${window.location.pathname}?activity=${activity.id}`),
      title: activity.title
    });
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
  // Total spots when every role has a maximum; null means open-ended.
  $: spotCapacity = activity.roles.every((role) => role.maximumCount != null)
    ? activity.roles.reduce((sum, role) => sum + (role.maximumCount ?? 0), 0)
    : null;
  $: spotsLeft = spotCapacity == null ? null : Math.max(0, spotCapacity - activity.committedCount);
  $: fillChipTone = activity.rolesLocked
    ? 'locked'
    : neededParticipants > 0
      ? 'need'
      : spotsLeft === 0
        ? 'full'
        : 'open';
  $: fillChipLabel = activity.rolesLocked
    ? 'Ended'
    : neededParticipants > 0
      ? `Need ${neededParticipants}`
      : spotsLeft === 0
        ? 'Full'
        : spotsLeft != null
          ? `${spotsLeft} ${spotsLeft === 1 ? 'spot' : 'spots'} left`
          : `${activity.committedCount} going`;
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
  class:agenda
  class={`activity-card-shell signup-${signupTone}`}
  data-participation-target={hasOpenRolesForViewer ? 'activity-signup' : undefined}
>
  {#if agenda}
    <button
      id={`activity-${activity.id}`}
      class="agenda-row"
      type="button"
      title={activity.title}
      on:click={openActivitySheet}
    >
      <span class="agenda-time">
        {#if historyMode}
          <span>{shortDay(activity.startAt)}</span>
        {/if}
        <span>{clockTime(activity.startAt)}</span>
        {#if !historyMode}
          <span class="agenda-end">{clockTime(activity.endAt)}{agendaZone ? ` ${agendaZone}` : ''}</span>
        {/if}
      </span>
      <span class="agenda-main">
        <strong>{activity.title}</strong>
        <span>
          {#if multiDayEnd(activity.startAt, activity.endAt)}
            Until {multiDayEnd(activity.startAt, activity.endAt)} ·
          {/if}
          {placeLabel() || 'Place to be confirmed'}
          {#if historyMode && historyRatingSummary}
            · {historyRatingSummary}
          {/if}
        </span>
      </span>
      {#if historyMode}
        <span class={`agenda-chip ${resolvedBadgeClass === 'complete' ? 'open' : resolvedBadgeClass === 'locked' ? 'locked' : 'need'}`}>
          {resolvedBadgeLabel}
        </span>
      {:else}
        <span class={`agenda-chip ${activity.agendaChip?.tone ?? fillChipTone}`}>
          {activity.agendaChip?.label ?? fillChipLabel}
        </span>
      {/if}
    </button>
  {:else}
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
  {/if}

  <OverlaySheet activity bind:open={sheetOpen} elevated title={activity.title}>
    {#if sheetOpen}
      <div class="activity-body">
        {#if placeLabel()}
          {#if !activity.isOnline && activity.locationLabel}
            <a class="sheet-place map-link" href={mapHref()} title="Show on map" on:click={showOnMap}>
              {placeLabel()}
            </a>
          {:else}
            <p class="sheet-place">{placeLabel()}</p>
          {/if}
        {/if}
        {#if activity.isOnline && activity.meetingUrl}
          <a class="meeting-link" href={activity.meetingUrl} target="_blank" rel="noopener noreferrer">
            Join meeting
          </a>
        {:else if activity.isOnline && activity.hasMeetingUrl}
          <p class="activity-stage">Members see the meeting link.</p>
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
                    <!-- One button: Take role, then the same spot becomes Leave role. -->
                    <button
                      class:selected={role.isViewerAssigned}
                      aria-pressed={role.isViewerAssigned}
                      class="signup"
                      data-participation-action={!role.isViewerAssigned && roleHasOpenCapacity(role) ? 'take-role' : undefined}
                      disabled={!role.isViewerAssigned && !roleHasOpenCapacity(role)}
                      type="button"
                      on:click={() => changecommitment(activity.id, role.isViewerAssigned ? null : role.label)}
                    >
                      {commitmentButtonLabel(role)}
                    </button>
                  {/if}
                </div>
              {/each}
            </div>
          </section>
        {/if}
        <button class="text-button share-activity" type="button" title="Copy a link to this activity" on:click={shareActivity}>
          Share activity
        </button>
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

  .activity-card-shell.agenda {
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  /* Time | title + place | status. The time column sizes to its text, so times never clip. */
  .agenda-row {
    width: 100%;
    min-height: 64px;
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr) max-content;
    align-items: center;
    gap: 14px;
    padding: 10px 14px 10px 16px;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  /* Status stripe: red nobody yet, yellow below the minimum, green minimum met or full. */
  .activity-card-shell.agenda:not(.history-mode).signup-empty .agenda-row {
    box-shadow: inset 3px 0 0 #ef4444;
  }

  .activity-card-shell.agenda:not(.history-mode).signup-partial .agenda-row {
    box-shadow: inset 3px 0 0 var(--status-yellow);
  }

  .activity-card-shell.agenda:not(.history-mode).signup-met .agenda-row {
    box-shadow: inset 3px 0 0 var(--brand);
  }

  .agenda-row:hover,
  .agenda-row:focus-visible,
  .activity-card-shell.agenda.highlighted .agenda-row {
    background: var(--brand-soft);
  }

  .agenda-time {
    display: grid;
    gap: 2px;
    min-width: 64px;
    padding-right: 14px;
    border-right: 1px solid var(--panel-border);
    white-space: nowrap;
    font-size: 13px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }

  .agenda-time .agenda-end {
    font-size: 12px;
  }

  .agenda-end,
  .agenda-main span {
    color: var(--text-muted, var(--text-main));
    font-weight: 500;
  }

  .agenda-main {
    display: grid;
    gap: 2px;
    min-width: 0;
    line-height: 1.3;
  }

  /* Titles get two lines before shortening; the place line stays on one. */
  .agenda-main strong {
    display: -webkit-box;
    overflow: hidden;
    font-size: 15px;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow-wrap: anywhere;
  }

  .agenda-main span {
    overflow: hidden;
    font-size: 13px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .agenda-chip {
    padding: 3px 9px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .agenda-chip.need {
    background: var(--need-soft);
    color: var(--need-strong);
  }

  .agenda-chip.full,
  .agenda-chip.locked {
    background: var(--panel-soft);
    color: var(--text-soft);
    box-shadow: inset 0 0 0 1px var(--panel-border);
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
    flex: 0 0 auto;
    width: auto;
    min-width: 96px;
    height: auto;
    min-height: 40px;
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

  .signup.selected:hover:not(:disabled) {
    background: color-mix(in srgb, var(--danger) 12%, var(--panel-strong));
    color: var(--danger);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--danger) 45%, transparent);
  }

  .signup:not(.selected):hover:not(:disabled) {
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
    opacity: 1;
    color: var(--text-main);
    background: var(--panel-strong);
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

  .map-link,
  .meeting-link {
    color: var(--brand-strong);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .meeting-link {
    font-size: 14px;
    font-weight: 700;
  }
</style>
