<script lang="ts" context="module">
  let scopeSheetSeq = 0;
</script>

<script lang="ts">
  import ScopeChip from '$lib/components/cards/shared/ScopeChip.svelte';
  import ScopeSheet from '$lib/components/shared/ScopeSheet.svelte';
  import type { SurfaceIconId } from '$lib/utils/surfaceType';
  import type { TagRef } from '$lib/types/feed';

  export let tags: TagRef[] = [];
  export let columns: number | null = null;
  /** Collapsed chip count. `null` shows every tag (detail headers). */
  export let maxVisible: number | null = 1;

  const sheetId = `scope-sheet-${++scopeSheetSeq}`;

  let sheetOpen = false;

  $: hiddenCount = maxVisible == null ? 0 : Math.max(0, tags.length - maxVisible);
  $: visibleTags = maxVisible == null ? tags : tags.slice(0, maxVisible);

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

  function openOverflow(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    sheetOpen = true;
  }
</script>

{#if tags.length > 0}
  <div
    class:grid-layout={!!columns}
    class="tag-list"
    style:--tag-columns={columns ? `${columns}` : undefined}
  >
    {#each visibleTags as tag}
      <ScopeChip href={hrefFor(tag)} icon={iconFor(tag)} label={tag.label} />
    {/each}
    {#if maxVisible != null && hiddenCount > 0}
      <button
        type="button"
        class="tag-overflow-btn"
        aria-haspopup="dialog"
        aria-expanded={sheetOpen}
        aria-label={`Show ${hiddenCount} more tags`}
        on:click={openOverflow}
      >
        +{hiddenCount}
      </button>
    {/if}
  </div>

  <ScopeSheet bind:open={sheetOpen} labelledById={sheetId} {tags} />
{/if}

<style>
  .tag-list {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: nowrap;
    min-width: 0;
    max-width: 100%;
  }

  .tag-list.grid-layout {
    display: grid;
    grid-template-columns: repeat(var(--tag-columns), max-content);
    justify-content: end;
    flex-wrap: wrap;
  }

  .tag-overflow-btn {
    flex: 0 0 auto;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
  }

  .tag-list :global(.scope-chip) {
    min-width: 0;
    max-width: 11rem;
  }

  @media (max-width: 760px) {
    .tag-list {
      width: auto;
      min-width: 0;
      gap: 4px;
    }

    .tag-list.grid-layout {
      display: flex;
      flex-wrap: nowrap;
      justify-content: flex-end;
    }

    .tag-list :global(.scope-chip) {
      flex: 0 1 auto;
      max-width: min(7.5rem, 42vw);
    }
  }
</style>
