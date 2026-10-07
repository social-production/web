<script lang="ts">
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import type { TagRef } from '$lib/types/feed';

  export let tags: TagRef[] = [];
  export let stage = '';
</script>

{#if tags.length > 0 || stage || $$slots.default}
  <div class="feed-card-top">
    {#if tags.length > 0}
      <div class="feed-card-tags">
        <TagList {tags} maxVisible={3} plain />
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
    margin-top: 4px;
    padding-bottom: 14px;
  }

  .feed-card-tags {
    min-width: 0;
    flex: 1 1 auto;
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
