<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';

  export let disabled = false;
  export let loading = false;

  const dispatch = createEventDispatcher<{ loadMore: void }>();

  let sentinelEl: HTMLDivElement | null = null;
  let observer: IntersectionObserver | null = null;

  function observe() {
    observer?.disconnect();
    if (!sentinelEl || typeof IntersectionObserver === 'undefined') {
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        if (disabled || loading) {
          return;
        }
        if (entries.some((entry) => entry.isIntersecting)) {
          dispatch('loadMore');
        }
      },
      { root: null, rootMargin: '240px 0px', threshold: 0 }
    );
    observer.observe(sentinelEl);
  }

  onMount(() => {
    observe();
  });

  onDestroy(() => {
    observer?.disconnect();
    observer = null;
  });

  $: if (sentinelEl) {
    observe();
  }
</script>

<div bind:this={sentinelEl} class="infinite-feed-sentinel" aria-hidden="true">
  {#if loading}
    <p class="loading-copy">Loading more…</p>
  {/if}
</div>

<style>
  .infinite-feed-sentinel {
    min-height: 1px;
  }

  .loading-copy {
    margin: 0;
    padding: 12px 4px 4px;
    color: var(--text-soft);
    font-size: 13px;
    text-align: center;
  }
</style>
