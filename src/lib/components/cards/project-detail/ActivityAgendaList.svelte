<script lang="ts">
  import CollapsibleActivityCard from './CollapsibleActivityCard.svelte';
  import type { ProjectActivityItem } from '$lib/types/detail';

  /** Upcoming activities under a calendar, as fixed-height agenda rows grouped by day. */
  export let activities: ProjectActivityItem[] = [];
  export let highlightedActivityId: string | null = null;
  export let readOnly = false;
  export let changecommitment: (activityId: string, roleLabel: string | null) => void = () => {};
  export let viewerCanSuggest = false;
  export let onSuggestRole: (
    activityId: string,
    roleId: string,
    userId: string
  ) => void | Promise<void> = () => {};
  export let onDeclineRoleSuggestion: (
    activityId: string,
    roleId: string
  ) => void | Promise<void> = () => {};

  type AgendaDay = { key: string; label: string; items: ProjectActivityItem[] };

  $: days = groupByDay(activities);

  function dayHeading(date: Date) {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const base = date.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    if (date.toDateString() === today.toDateString()) return `Today · ${base}`;
    if (date.toDateString() === tomorrow.toDateString()) return `Tomorrow · ${base}`;
    return base;
  }

  function groupByDay(items: ProjectActivityItem[]): AgendaDay[] {
    const sorted = [...items].sort(
      (a, b) => (new Date(a.startAt).getTime() || 0) - (new Date(b.startAt).getTime() || 0)
    );
    const grouped: AgendaDay[] = [];
    for (const item of sorted) {
      const start = new Date(item.startAt);
      const valid = !Number.isNaN(start.getTime());
      const key = valid ? start.toDateString() : 'unscheduled';
      let day = grouped.find((entry) => entry.key === key);
      if (!day) {
        day = { key, label: valid ? dayHeading(start) : 'Date to be confirmed', items: [] };
        grouped.push(day);
      }
      day.items.push(item);
    }
    return grouped;
  }
</script>

<div class="agenda">
  {#each days as day (day.key)}
    <section class="agenda-day" aria-label={day.label}>
      <h4 class="agenda-day-label">{day.label}</h4>
      <div class="agenda-rows">
        {#each day.items as activity (activity.id)}
          <div id={`activity-card-${activity.id}`} class="rail-card">
            <CollapsibleActivityCard
              agenda
              {activity}
              {readOnly}
              expanded={highlightedActivityId === activity.id}
              highlighted={highlightedActivityId === activity.id}
              {changecommitment}
              {viewerCanSuggest}
              {onSuggestRole}
              {onDeclineRoleSuggestion}
            />
          </div>
        {/each}
      </div>
    </section>
  {/each}
</div>

<style>
  .agenda {
    display: grid;
    gap: 10px;
  }

  .agenda-day-label {
    margin: 0 0 4px;
    color: var(--text-muted, var(--text-main));
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .agenda-rows {
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm, 10px);
    background: var(--panel-strong);
    overflow: hidden;
  }

  .agenda-rows > .rail-card + .rail-card {
    border-top: 1px solid var(--panel-border);
  }
</style>
