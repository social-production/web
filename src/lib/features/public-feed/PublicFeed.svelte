<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import PageHeader from '$lib/components/shared/PageHeader.svelte';
  import PublicFeedCard from '$lib/components/cards/public-feed/PublicFeedCard.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import IconMenuButton from '$lib/components/shared/IconMenuButton.svelte';
  import { getHomeFeed } from '$lib/services/queries/feeds';
  import { getSettings, updateSettings } from '$lib/services/queries/account';
  import type {
    FeedSortPreference,
    FeedWindowPreference,
    PublicFeedFilterPreference,
    PublicFeedPreferences,
    PublicFeedScopePreference
  } from '$lib/types/account';
  import type { PublicFeedItem } from '$lib/types/feed';

  export let items: PublicFeedItem[];

  type PublicScope = PublicFeedScopePreference;
  type PublicFilter = PublicFeedFilterPreference;
  type FeedSort = FeedSortPreference;
  type FeedWindow = FeedWindowPreference;

  const defaultPreferences: PublicFeedPreferences = {
    scope: 'global',
    filter: 'all',
    sort: 'popular',
    window: 'all'
  };

  const scopeOptions = [
    { value: 'home', label: 'Home' },
    { value: 'global', label: 'Global' }
  ];

  const filterOptions = [
    { value: 'all', label: 'All items' },
    { value: 'projects', label: 'Projects', icon: 'project' as const },
    { value: 'threads', label: 'Threads', icon: 'thread' as const },
    { value: 'events', label: 'Events', icon: 'event' as const }
  ];

  const sortOptions = [
    { value: 'popular', label: 'Most popular' },
    { value: 'recent', label: 'Most recent' }
  ];

  const windowOptions = [
    { value: '12h', label: 'Last 12 hours' },
    { value: '1d', label: '1 day' },
    { value: '7d', label: '7 days' },
    { value: '1m', label: '1 month' },
    { value: '1y', label: '1 year' },
    { value: 'all', label: 'All time' }
  ];

  let activeScope: PublicScope = defaultPreferences.scope;
  let activeFilter: PublicFilter = defaultPreferences.filter;
  let activeSort: FeedSort = defaultPreferences.sort;
  let activeWindow: FeedWindow = defaultPreferences.window;
  let preferencesReady = false;
  let isHydratingPreferences = false;
  let lastHydratedViewerId = '';
  let lastPersistedPreferences = preferenceSignature(defaultPreferences);
  let homeItems: PublicFeedItem[] = [];
  let homeItemsLoading = false;
  let homeItemsRequestId = 0;

  function preferenceSignature(preferences: PublicFeedPreferences) {
    return [preferences.scope, preferences.filter, preferences.sort, preferences.window].join(':');
  }

  function currentPreferences(): PublicFeedPreferences {
    return {
      scope: activeScope,
      filter: activeFilter,
      sort: activeSort,
      window: activeWindow
    };
  }

  function applyPreferences(preferences?: Partial<PublicFeedPreferences> | null) {
    const next: PublicFeedPreferences = {
      ...defaultPreferences,
      ...(preferences ?? {})
    };

    isHydratingPreferences = true;
    activeScope = next.scope;
    activeFilter = next.filter;
    activeSort = next.sort;
    activeWindow = next.window;
    lastPersistedPreferences = preferenceSignature(next);
    isHydratingPreferences = false;
  }

  async function hydratePreferences() {
    const settings = await getSettings();
    applyPreferences(settings?.publicFeedPreferences);
    preferencesReady = true;
  }

  async function loadHomeItems() {
    if (!$page.data.bootstrap?.viewer) {
      homeItems = [];
      return;
    }

    const requestId = ++homeItemsRequestId;
    homeItemsLoading = true;

    try {
      const nextItems = await getHomeFeed();

      if (requestId === homeItemsRequestId) {
        homeItems = nextItems;
      }
    } finally {
      if (requestId === homeItemsRequestId) {
        homeItemsLoading = false;
      }
    }
  }

  async function persistPreferences() {
    if (!preferencesReady || isHydratingPreferences || !$page.data.bootstrap?.viewer) {
      return;
    }

    const preferences = currentPreferences();
    const signature = preferenceSignature(preferences);

    if (signature === lastPersistedPreferences) {
      return;
    }

    await updateSettings({ publicFeedPreferences: preferences });
    lastPersistedPreferences = signature;
  }

  function handlePreferencesChange() {
    void persistPreferences();
  }

  function matchesScope(
    item: PublicFeedItem,
    scope: PublicScope,
    followedChannelSlugs: Set<string>,
    followedCommunitySlugs: Set<string>,
    viewerHasPlatformMembership: boolean
  ) {
    if (scope === 'global') {
      return true;
    }

    return (
      item.channelTags.some((tag) =>
        tag.slug === 'platform' ? viewerHasPlatformMembership : followedChannelSlugs.has(tag.slug)
      ) ||
      item.communityTags.some((tag) => followedCommunitySlugs.has(tag.slug))
    );
  }

  function slugSet(links: Array<{ slug: string }> | undefined) {
    return new Set<string>((links ?? []).map((link) => link.slug));
  }

  function matchesFilter(item: PublicFeedItem, filter: PublicFilter) {
    if (filter === 'all') {
      return true;
    }

    if (filter === 'projects') {
      return item.kind === 'project';
    }

    if (filter === 'threads') {
      return item.kind === 'thread';
    }

    return item.kind === 'event';
  }

  function itemTimestamp(item: PublicFeedItem) {
    return +(new Date(item.lastActivityAt));
  }

  function timeWindowMs(window: FeedWindow) {
    switch (window) {
      case '12h':
        return 12 * 60 * 60 * 1000;
      case '1d':
        return 24 * 60 * 60 * 1000;
      case '7d':
        return 7 * 24 * 60 * 60 * 1000;
      case '1m':
        return 30 * 24 * 60 * 60 * 1000;
      case '1y':
        return 365 * 24 * 60 * 60 * 1000;
      default:
        return Number.POSITIVE_INFINITY;
    }
  }

  function matchesWindow(item: PublicFeedItem, window: FeedWindow, referenceTime: number) {
    if (window === 'all') {
      return true;
    }

    return referenceTime - itemTimestamp(item) <= timeWindowMs(window);
  }

  function compareItems(left: PublicFeedItem, right: PublicFeedItem, sort: FeedSort) {
    if (sort === 'popular') {
      return right.voteCount - left.voteCount || itemTimestamp(right) - itemTimestamp(left);
    }

    return itemTimestamp(right) - itemTimestamp(left);
  }

  $: viewerId = $page.data.bootstrap?.viewer?.id ?? '';
  $: if (viewerId !== lastHydratedViewerId) {
    lastHydratedViewerId = viewerId;
    preferencesReady = false;
    applyPreferences($page.data.settings?.publicFeedPreferences);
    preferencesReady = true;
  }
  $: followedChannelSlugs = slugSet($page.data.bootstrap?.directory.channels as Array<{ slug: string }> | undefined);
  $: followedCommunitySlugs = slugSet($page.data.bootstrap?.directory.communities as Array<{ slug: string }> | undefined);
  $: viewerHasPlatformMembership = !!$page.data.bootstrap?.directory.platform?.viewerIsMember;
  $: if (!$page.data.bootstrap?.viewer && activeScope === 'home') {
    activeScope = 'global';
  }
  $: if (activeScope === 'home' && preferencesReady && $page.data.bootstrap?.viewer) {
    void loadHomeItems();
  }
  $: referenceTime = Date.now();
  $: sourceItems = activeScope === 'home' ? homeItems : items;
  $: visibleItems = sourceItems
    .filter((item) => activeScope === 'home' || matchesScope(item, activeScope, followedChannelSlugs, followedCommunitySlugs, viewerHasPlatformMembership))
    .filter((item) => matchesFilter(item, activeFilter))
    .filter((item) => matchesWindow(item, activeWindow, referenceTime))
    .slice()
    .sort((left, right) => compareItems(left, right, activeSort));

  onMount(() => {
    void hydratePreferences();
  });
</script>

<section class="feed-page">
  <PageHeader
    title="Public"
    description="Public keeps the shared network stream: tagged projects, threads, and open standalone events."
  />

  <section class="toolbar-card">
    <div class="controls-row">
      <IconMenuButton
        bind:value={activeScope}
        ariaLabel="Choose public feed scope"
        defaultValue="global"
        options={scopeOptions}
        on:change={handlePreferencesChange}
      >
        <FeedToolbarIcon name={activeScope === 'home' ? 'home' : 'globe'} />
      </IconMenuButton>

      <IconMenuButton
        bind:value={activeFilter}
        ariaLabel="Filter public feed"
        defaultValue="all"
        options={filterOptions}
        showOptionIcons
        on:change={handlePreferencesChange}
      >
        <FeedToolbarIcon name="filter" />
      </IconMenuButton>

      <IconMenuButton
        bind:value={activeSort}
        ariaLabel="Sort public feed by"
        options={sortOptions}
        on:change={handlePreferencesChange}
      >
        <FeedToolbarIcon name="sort" />
      </IconMenuButton>

      <IconMenuButton
        bind:value={activeWindow}
        ariaLabel="Public feed time window"
        defaultValue="all"
        options={windowOptions}
        on:change={handlePreferencesChange}
      >
        <FeedToolbarIcon name="clock" />
      </IconMenuButton>
    </div>
  </section>

  <div class="stack">
    {#if homeItemsLoading && activeScope === 'home'}
      <section class="empty-card">
        <p>Loading your home feed...</p>
      </section>
    {:else if visibleItems.length === 0}
      <section class="empty-card">
        <p>{activeScope === 'home' ? 'No items from your followed channels, communities, or platform membership match this filter yet.' : 'No public items match this filter yet.'}</p>
      </section>
    {:else}
      {#each visibleItems as item}
        <PublicFeedCard item={item} />
      {/each}
    {/if}
  </div>
</section>

<style>
  .feed-page,
  .stack {
    display: grid;
  }

  .feed-page {
    gap: 12px;
  }

  .stack {
    gap: 0;
    min-width: 0;
    overflow-x: clip;
  }

  .stack :global(.surface:last-child) {
    border-bottom: none;
  }

  .toolbar-card {
    padding: 12px 4px;
    border: none;
    border-bottom: 1px solid var(--panel-border);
    border-radius: 0;
    background: transparent;
  }

  .controls-row {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 6px;
    width: 100%;
    overflow-x: auto;
  }

  .empty-card {
    padding: 20px 4px;
    border: none;
    border-bottom: 1px solid var(--panel-border);
    border-radius: 0;
    background: transparent;
  }

  .empty-card p {
    color: var(--text-soft);
  }
</style>
