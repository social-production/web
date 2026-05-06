<script lang="ts">
  import Tablet from '$lib/components/cards/shared/Tablet.svelte';
  import type { TagRef } from '$lib/types/feed';

  export let tags: TagRef[] = [];
  export let columns: number | null = null;

  function variantFor(tag: TagRef) {
    if (tag.kind === 'community') {
      return 'community';
    }

    return tag.slug === 'platform' ? 'platform' : 'channel';
  }
</script>

{#if tags.length > 0}
  <div class:grid-layout={!!columns} class="tag-list" style:--tag-columns={columns ? `${columns}` : undefined}>
    {#each tags as tag}
      <Tablet label={tag.label} variant={variantFor(tag)} />
    {/each}
  </div>
{/if}

<style>
  .tag-list {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .tag-list.grid-layout {
    display: grid;
    grid-template-columns: repeat(var(--tag-columns), max-content);
    justify-content: end;
  }

  @media (max-width: 760px) {
    .tag-list.grid-layout {
      justify-content: start;
    }
  }
</style>