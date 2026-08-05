<script lang="ts">
  import MapPanel from '$lib/features/map/MapPanel.svelte';
  import { onDestroy, onMount } from 'svelte';

  onMount(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  });

  onDestroy(() => {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  });
</script>

<section class="map-page">
  <MapPanel embedded={false} />
</section>

<style>
  .map-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    overscroll-behavior: none;
  }

  .map-page :global(.map-panel) {
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
  }
</style>
