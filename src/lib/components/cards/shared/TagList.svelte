<script lang="ts">
  import ScopeChip from '$lib/components/cards/shared/ScopeChip.svelte';
  import type { SurfaceIconId } from '$lib/utils/surfaceType';
  import type { TagRef } from '$lib/types/feed';

  export let tags: TagRef[] = [];
  export let columns: number | null = null;

  function iconFor(tag: TagRef): SurfaceIconId {
    if (tag.kind === 'community') {
      return 'community';
    }

    return tag.slug === 'platform' ? 'platform' : 'channel';
  }

  function hrefFor(tag: TagRef) {
    if (tag.slug === 'platform') {
      return '/platform';
    }

    return tag.kind === 'community' ? `/communities/${tag.slug}` : `/channels/${tag.slug}`;
  }
</script>

{#if tags.length > 0}
  <div class:grid-layout={!!columns} class="tag-list" style:--tag-columns={columns ? `${columns}` : undefined}>
    {#each tags as tag}
      <ScopeChip href={hrefFor(tag)} icon={iconFor(tag)} label={tag.label} />
    {/each}
  </div>
{/if}

<style>
  .tag-list {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .tag-list.grid-layout {
    display: grid;
    grid-template-columns: repeat(var(--tag-columns), max-content);
    justify-content: end;
  }

  @media (max-width: 760px) {
    .tag-list.grid-layout {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-start;
    }
  }
</style>
