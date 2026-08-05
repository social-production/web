<script lang="ts">
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import SurfaceTypeLabel from '$lib/components/cards/shared/SurfaceTypeLabel.svelte';
  import type { PublicProjectActivityItem } from '$lib/types/feed';
  import { surfaceTypeAccent } from '$lib/utils/surfaceType';
  import { formatMarkerScheduleRange } from '$lib/utils/time';

  let { item }: { item: PublicProjectActivityItem } = $props();

  const accent = $derived(surfaceTypeAccent('project', item.projectMode));
  const scheduleTime = $derived(formatMarkerScheduleRange(item.scheduledAt, item.endsAt ?? null));
  const locationLine = $derived(item.locationLabel.trim());
  const footerLine = $derived(`${item.distanceKm.toFixed(1)} km`);
</script>

<FeedSurface href={item.href} tone="public" {accent}>
  <div class="header-row">
    <SurfaceTypeLabel kind="project" projectMode={item.projectMode} />
  </div>
  {#if item.parentTitle}
    <p class="parent-title">{item.parentTitle}</p>
  {/if}
  <a class="title" data-sveltekit-preload-data="off" href={item.href}>{item.title}</a>
  {#if scheduleTime}
    <p class="detail-row time">{scheduleTime}</p>
  {/if}
  {#if locationLine}
    <p class="detail-row location">{locationLine}</p>
  {/if}
  {#if footerLine}
    <p class="detail-row footer">{footerLine}</p>
  {/if}
</FeedSurface>

<style>
  .header-row {
    margin-bottom: 6px;
  }

  .parent-title {
    margin: 0 0 4px;
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 600;
  }

  .title {
    display: block;
    font-size: 16px;
    font-weight: 800;
    color: var(--text-main);
    text-decoration: none;
    line-height: 1.35;
  }

  .detail-row {
    margin: 4px 0 0;
    font-size: 12px;
    line-height: 1.4;
  }

  .detail-row.time {
    color: var(--text-main);
    font-weight: 600;
  }

  .detail-row.location,
  .detail-row.footer {
    color: var(--text-muted);
  }

  .detail-row.footer {
    font-size: 11px;
  }
</style>
