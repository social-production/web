<script lang="ts">
  import { onMount } from 'svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import type { TagRef } from '$lib/types/feed';

  export let tags: TagRef[] = [];
  export let stage = '';
  /** Shows a lock mark, so private items without tags still get a labelled top row. */
  export let isPrivate = false;

  let compact = false;

  onMount(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const sync = () => {
      compact = media.matches;
    };
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  });
</script>

{#if tags.length > 0 || stage || isPrivate || $$slots.default}
  <div class="feed-card-top">
    {#if isPrivate || tags.length > 0}
      <div class="feed-card-tags">
        {#if isPrivate}
          <span class="feed-card-private" title="Private: only invited people and members see this">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14">
              <path
                d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linejoin="round"
              />
            </svg>
            {#if tags.length === 0}<span>Private</span>{/if}
          </span>
        {/if}
        {#if tags.length > 0}
          <TagList {tags} maxVisible={compact ? 1 : 3} plain />
        {/if}
      </div>
    {/if}
    <div class="feed-card-end">
      {#if stage}
        <span class="feed-card-stage">{stage}</span>
      {/if}
      <slot />
    </div>
  </div>
{/if}

<style>
  .feed-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
    margin-top: 0;
    padding-bottom: 6px;
  }

  .feed-card-tags {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    flex: 1 1 auto;
  }

  .feed-card-private {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 4px;
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .feed-card-end {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-left: auto;
    flex: 0 0 auto;
  }

  .feed-card-stage {
    flex: 0 0 auto;
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
  }
</style>
