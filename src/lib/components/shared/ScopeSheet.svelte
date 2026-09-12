<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { page } from '$app/stores';
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import SurfaceIcon from '$lib/components/cards/shared/SurfaceIcon.svelte';
  import type { TagRef } from '$lib/types/feed';
  import type { SurfaceIconId } from '$lib/utils/surfaceType';

  export let open = false;
  export let title = 'Channels & communities';
  export let tags: TagRef[] = [];
  export let searchPlaceholder = 'Search channels and communities';
  export let emptyCopy = 'No tagged channels or communities.';
  export let labelledById = 'scope-sheet-title';

  const dispatch = createEventDispatcher<{ close: void }>();

  let query = '';

  $: if (!open) {
    query = '';
  }

  $: searchNeedle = query.trim().toLowerCase();
  $: filteredTags = [...tags]
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
    .filter((tag) => !searchNeedle || tag.label.toLowerCase().includes(searchNeedle));

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

  function kindLabel(tag: TagRef) {
    if (tag.slug === 'platform') {
      return 'Platform';
    }

    return tag.kind === 'community' ? 'Community' : 'Channel';
  }

  function handleClose() {
    open = false;
    dispatch('close');
  }
</script>

<OverlaySheet {open} {title} {labelledById} on:close={handleClose}>
  <svelte:fragment slot="toolbar">
    <div class="sheet-search">
      <label class="sr-only" for={`${labelledById}-search`}>Search channels and communities</label>
      <input
        id={`${labelledById}-search`}
        bind:value={query}
        placeholder={searchPlaceholder}
        type="search"
      />
    </div>
  </svelte:fragment>

  <div class="scope-list">
    {#if filteredTags.length === 0}
      <p class="empty-row">{query.trim() ? 'No matches.' : emptyCopy}</p>
    {:else}
      {#each filteredTags as tag (`${tag.kind}:${tag.slug}`)}
        <a
          class="scope-row"
          href={`${hrefFor(tag)}?from=${encodeURIComponent($page.url.pathname)}`}
          on:click={handleClose}
        >
          <span class="scope-icon">
            <SurfaceIcon icon={iconFor(tag)} size="md" />
          </span>
          <span class="scope-copy">
            <strong>{tag.label}</strong>
            <span>{kindLabel(tag)}</span>
          </span>
        </a>
      {/each}
    {/if}
  </div>
</OverlaySheet>

<style>
  .sheet-search {
    padding: 10px 16px 8px;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 70%, transparent);
  }

  .sheet-search input {
    width: 100%;
    min-height: 40px;
    padding: 0 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-main);
  }

  .scope-list {
    display: grid;
  }

  .scope-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    min-height: 52px;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 75%, transparent);
    color: inherit;
    text-decoration: none;
  }

  .scope-row:last-child {
    border-bottom: none;
  }

  .scope-row:hover {
    background: color-mix(in srgb, var(--panel-hover) 70%, transparent);
  }

  .scope-icon {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border-radius: 8px;
    background: var(--panel-strong);
    color: var(--text-soft);
  }

  .scope-copy {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .scope-copy strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
  }

  .scope-copy span {
    color: var(--text-soft);
    font-size: 12px;
  }

  .empty-row {
    margin: 0;
    padding: 20px 16px;
    color: var(--text-soft);
    font-size: 13px;
    text-align: center;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
