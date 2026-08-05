<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import SurfaceTypeLabel from '$lib/components/cards/shared/SurfaceTypeLabel.svelte';
  import type { ProjectMode, SubjectKind } from '$lib/types/feed';
  import { surfaceTypeAccent } from '$lib/utils/surfaceType';
  import { formatMarkerScheduleRange } from '$lib/utils/time';

  export let id: string;
  export let title: string;
  export let href: string;
  export let distanceKm: number;
  export let entityType: 'event' | 'project' | 'help_request' | 'activity';
  export let activitySource: 'event' | 'project' | null = null;
  export let projectMode: ProjectMode | null = null;
  export let parentTitle: string | null = null;
  export let subtitle: string | null = null;
  export let displayLabel = '';
  export let scheduledAt: string | null = null;
  export let endsAt: string | null = null;
  export let signupCount: number | null = null;
  export let slotsNeeded: number | null = null;
  export let committedCount: number | null = null;
  export let minimumParticipants: number | null = null;
  export let isPast = false;
  export let isLast = false;
  export let highlighted = false;

  const dispatch = createEventDispatcher<{
    close: void;
    hover: { id: string };
    leave: void;
    select: { id: string };
  }>();

  function mapEntityKind(type: typeof entityType, source: typeof activitySource): SubjectKind {
    if (type === 'activity' && source === 'project') return 'project';
    if (type === 'activity' && source === 'event') return 'event';
    if (type === 'project') return 'project';
    if (type === 'help_request') return 'help-request';
    return 'event';
  }

  function handleCardClick(event: MouseEvent) {
    const anchor = (event.target as HTMLElement | null)?.closest('a[href]');
    dispatch('select', { id });
    if (anchor) {
      dispatch('close');
    }
  }

  $: kind = mapEntityKind(entityType, activitySource);
  $: accent = surfaceTypeAccent(kind, projectMode ?? 'productive');
  $: scheduleTime = formatMarkerScheduleRange(scheduledAt, endsAt);
  $: isActivity = entityType === 'activity';
  $: statusLine =
    entityType === 'project' && activitySource == null && subtitle?.trim()
      ? subtitle.trim()
      : '';
  $: locationLine = displayLabel.trim();
  $: signupLine =
    entityType === 'help_request' && slotsNeeded != null
      ? `${signupCount ?? 0}/${slotsNeeded} signed up`
      : entityType === 'activity' && minimumParticipants != null
        ? `${committedCount ?? 0}/${minimumParticipants} committed`
        : '';
  $: footerLine = [`${distanceKm.toFixed(1)} km`, signupLine].filter(Boolean).join(' · ');
</script>

<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div
  class="map-discovery-card"
  class:past={isPast}
  class:highlighted
  on:click={handleCardClick}
  on:mouseenter={() => dispatch('hover', { id })}
  on:mouseleave={() => dispatch('leave')}
>
  <FeedSurface {href} tone="public" {accent} {isLast}>
    <div class="header-row">
      <SurfaceTypeLabel {kind} projectMode={projectMode ?? 'productive'} />
    </div>
    {#if isActivity && parentTitle?.trim()}
      <p class="parent-title" class:past={isPast}>{parentTitle}</p>
    {/if}
    <a class="title" class:past={isPast} data-sveltekit-preload-data="off" {href}>{title}</a>
    {#if statusLine}
      <p class="detail-row status" class:past={isPast}>{statusLine}</p>
    {/if}
    {#if scheduleTime}
      <p class="detail-row time" class:past={isPast}>{scheduleTime}</p>
    {/if}
    {#if locationLine}
      <p class="detail-row location" class:past={isPast}>{locationLine}</p>
    {/if}
    {#if footerLine}
      <p class="detail-row footer" class:past={isPast}>{footerLine}</p>
    {/if}
  </FeedSurface>
</div>

<style>
  .map-discovery-card.past {
    opacity: 0.72;
  }

  .map-discovery-card.highlighted {
    outline: 2px solid color-mix(in srgb, var(--brand) 70%, transparent);
    outline-offset: -2px;
    border-radius: 12px;
  }

  .header-row {
    margin-bottom: 6px;
  }

  .parent-title {
    margin: 0 0 4px;
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 600;
  }

  .parent-title.past {
    opacity: 0.75;
  }

  .title {
    display: block;
    font-size: 15px;
    font-weight: 700;
    color: var(--text-main);
    text-decoration: none;
    line-height: 1.35;
  }

  .title.past {
    color: var(--text-muted);
    font-weight: 600;
  }

  .detail-row {
    margin: 4px 0 0;
    font-size: 12px;
    line-height: 1.4;
  }

  .detail-row.status {
    color: var(--text-main);
    font-weight: 600;
  }

  .detail-row.time {
    color: var(--text-main);
    font-weight: 600;
  }

  .detail-row.location {
    color: var(--text-muted);
  }

  .detail-row.footer {
    color: var(--text-muted);
    font-size: 11px;
  }

  .detail-row.past {
    opacity: 0.75;
  }
</style>
