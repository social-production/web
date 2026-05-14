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
      <a class="tag-link" href={hrefFor(tag)}>
        <Tablet label={tag.label} variant={variantFor(tag)} />
      </a>
    {/each}
  </div>
{/if}

<style>
  .tag-list {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .tag-link {
    display: inline-flex;
    border-radius: 999px;
    cursor: pointer;
    text-decoration: none;
  }

  .tag-link:hover :global(.tablet),
  .tag-link:focus-visible :global(.tablet) {
    transform: translateY(-1px);
    filter: brightness(1.08);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--text-main) 16%, transparent);
  }

  .tag-link:focus-visible {
    outline: none;
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