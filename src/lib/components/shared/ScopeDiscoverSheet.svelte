<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import SurfaceIcon from '$lib/components/cards/shared/SurfaceIcon.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import IconMenuButton from '$lib/components/shared/IconMenuButton.svelte';
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import { getDiscoverScopes } from '$lib/services/queries/scopes';
  import type { DiscoverScopeItem } from '$lib/types/bootstrap';

  export let open = false;

  type ScopeKind = 'channel' | 'community';
  type DiscoverFilter = 'all' | ScopeKind;
  type DiscoverRow = DiscoverScopeItem & { kind: ScopeKind };

  const dispatch = createEventDispatcher<{ close: void; navigate: { href: string } }>();

  const filters: { value: DiscoverFilter; label: string; icon?: 'channel' | 'community' }[] = [
    { value: 'all', label: 'All' },
    { value: 'channel', label: 'Channels', icon: 'channel' },
    { value: 'community', label: 'Communities', icon: 'community' }
  ];

  let query = '';
  let activeFilter: DiscoverFilter = 'all';
  let channels: DiscoverRow[] = [];
  let communities: DiscoverRow[] = [];
  let loading = false;
  let loadError = '';
  let requestId = 0;
  let searchTimer: ReturnType<typeof setTimeout> | null = null;

  $: if (!open) {
    query = '';
    activeFilter = 'all';
    if (searchTimer) {
      clearTimeout(searchTimer);
      searchTimer = null;
    }
  }

  $: if (open) {
    scheduleLoad(query.trim());
  }

  function scheduleLoad(needle: string) {
    if (searchTimer) {
      clearTimeout(searchTimer);
    }
    searchTimer = setTimeout(() => {
      if (!open) {
        return;
      }
      void load(needle);
    }, needle ? 180 : 0);
  }

  async function load(needle = '') {
    const current = ++requestId;
    const showSpinner = channels.length === 0 && communities.length === 0;
    if (showSpinner) {
      loading = true;
    }
    loadError = '';
    try {
      const [channelItems, communityItems] = await Promise.all([
        getDiscoverScopes('channel', needle),
        getDiscoverScopes('community', needle)
      ]);
      if (current !== requestId) {
        return;
      }
      channels = channelItems.map((item) => ({ ...item, kind: 'channel' as const }));
      communities = communityItems.map((item) => ({ ...item, kind: 'community' as const }));
    } catch {
      if (current === requestId) {
        loadError = 'Could not load channels and communities.';
      }
    } finally {
      if (current === requestId) {
        loading = false;
      }
    }
  }

  function byMemberCount(left: DiscoverRow, right: DiscoverRow) {
    return right.memberCount - left.memberCount;
  }

  $: visibleItems =
    activeFilter === 'channel' ? channels : activeFilter === 'community' ? communities : [...channels, ...communities].sort(byMemberCount);

  $: searchNeedle = query.trim().toLowerCase();
  $: filteredItems = searchNeedle
    ? visibleItems.filter(
        (item) =>
          item.label.toLowerCase().includes(searchNeedle) ||
          item.slug.toLowerCase().includes(searchNeedle)
      )
    : visibleItems;

  $: emptyNoun =
    activeFilter === 'channel'
      ? 'channels'
      : activeFilter === 'community'
        ? 'communities'
        : 'channels or communities';

  function memberLabel(count: number) {
    return `${count} ${count === 1 ? 'member' : 'members'}`;
  }

  function handleClose() {
    dispatch('close');
  }

  function handleNavigate(item: DiscoverRow) {
    dispatch('navigate', { href: item.href });
    dispatch('close');
  }
</script>

<OverlaySheet bind:open title="Discover" on:close={handleClose}>
  <svelte:fragment slot="toolbar">
    <div class="sheet-toolbar">
      <label class="sr-only" for="scope-discover-search">Search {emptyNoun}</label>
      <input
        id="scope-discover-search"
        bind:value={query}
        placeholder={`Search ${emptyNoun}`}
        type="search"
      />
      <IconMenuButton
        bind:value={activeFilter}
        ariaLabel="Filter channels and communities"
        defaultValue="all"
        options={filters}
        portaled
        showOptionIcons
        showTriggerLabel
      >
        <FeedToolbarIcon name="filter" />
      </IconMenuButton>
    </div>
  </svelte:fragment>

  <div class="scope-list">
    {#if loading}
      <p class="empty-row">Loading…</p>
    {:else if loadError}
      <p class="empty-row">{loadError}</p>
    {:else if filteredItems.length === 0}
      <p class="empty-row">{query.trim() ? 'No matches.' : `No ${emptyNoun} yet.`}</p>
    {:else}
      {#each filteredItems as item (`${item.kind}:${item.slug}`)}
        <a class="scope-row" href={item.href} on:click={() => handleNavigate(item)}>
          <span class="scope-icon">
            <SurfaceIcon icon={item.kind} size="sm" />
          </span>
          <span class="scope-copy">
            <strong>{item.label}</strong>
            <span class="scope-meta">
              {memberLabel(item.memberCount)}{#if item.visibility === 'private'} · Private{/if}
            </span>
          </span>
          {#if item.viewerIsMember}
            <span class="badge">Joined</span>
          {/if}
        </a>
      {/each}
    {/if}
  </div>
</OverlaySheet>

<style>
  .sheet-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px 8px;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 70%, transparent);
  }

  .sheet-toolbar input {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 36px;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border-radius: 999px;
    background: var(--panel-strong);
  }

  .scope-copy {
    display: grid;
    gap: 2px;
    min-width: 0;
    flex: 1 1 auto;
  }

  .scope-copy strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
  }

  .scope-meta {
    color: var(--text-soft);
    font-size: 12px;
  }

  .badge {
    flex-shrink: 0;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 10px;
    font-weight: 700;
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
