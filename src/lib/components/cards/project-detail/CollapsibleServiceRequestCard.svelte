<script lang="ts">
  import type { ProjectServiceRequestItem, ProjectServiceRequestStatus } from '$lib/types/detail';
  import { formatRelativeTime } from '$lib/utils/time';

  export let request: ProjectServiceRequestItem;
  export let expanded = false;
  export let highlighted = false;

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
    if (!request.scheduledAt || !request.endsAt) {
      return 'Requested time pending';
    }

    const start = new Date(request.scheduledAt);
    const end = new Date(request.endsAt);

    if (sameCalendarDay(start, end)) {
      return `${formatDayDate(start)}, ${formatTime(start)} - ${formatTime(end)}`;
    }

    return `${formatDayDate(start)}, ${formatTime(start)} - ${formatDayDate(end)}, ${formatTime(end)}`;
  }

  function statusLabel(status: ProjectServiceRequestStatus) {
    switch (status) {
      case 'planned':
        return 'Scheduled';
      case 'accepted':
        return 'Accepted';
      case 'declined':
        return 'Declined';
      default:
        return 'Open';
    }
  }

  function statusTone(status: ProjectServiceRequestStatus) {
    if (status === 'accepted') {
      return 'complete';
    }

    if (status === 'planned') {
      return 'current';
    }

    if (status === 'declined') {
      return 'locked';
    }

    return 'upcoming';
  }

  let open = expanded;

  $: if (expanded || highlighted) {
    open = true;
  }
</script>

<details
  id={`request-${request.id}`}
  bind:open={open}
  class:expanded={open}
  class:highlighted
  class="request-card-shell"
>
  <summary class="collapse-toggle">
    <div class="request-header">
      <div class="request-copy">
        <strong>{request.title}</strong>
        <span>{timeLabel()}</span>
      </div>
      <span class={`phase-badge ${statusTone(request.status)}`}>
        {statusLabel(request.status)}
      </span>
    </div>
    <div class="request-footer">
      <span class="request-meta">{request.requesterUsername} · {formatRelativeTime(request.createdAt)}</span>
    </div>
  </summary>

  {#if open}
    <div class="request-body">
      <p>{request.body}</p>
      <slot />
    </div>
  {/if}
</details>

<style>
  .request-card-shell {
    padding: 12px 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    display: grid;
    gap: 10px;
    transition: border-color 0.12s ease, box-shadow 0.12s ease;
  }

  .request-card-shell:hover,
  .request-card-shell.expanded,
  .request-card-shell.highlighted {
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

  .request-header,
  .request-footer {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .request-copy {
    display: grid;
    gap: 3px;
  }

  .request-copy strong {
    color: var(--text-main);
  }

  .request-copy span,
  .request-meta,
  .request-body p {
    color: var(--text-soft);
    font-size: 12px;
  }

  .request-footer {
    justify-content: flex-end;
  }

  .request-body {
    display: grid;
    gap: 10px;
  }

  .request-body p {
    margin: 0;
    line-height: 1.45;
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
    border-color: color-mix(in srgb, var(--status-yellow) 44%, var(--panel-border));
    background: color-mix(in srgb, var(--status-yellow-soft) 72%, var(--panel));
    color: var(--status-yellow-strong);
  }

  @media (max-width: 760px) {
    .request-footer {
      justify-content: flex-start;
    }
  }
</style>