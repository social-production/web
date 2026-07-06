<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import PageHeader from '$lib/components/shared/PageHeader.svelte';
  import PublicFeedCard from '$lib/components/cards/public-feed/PublicFeedCard.svelte';
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
      <select aria-label="Choose public feed scope" bind:value={activeScope} on:change={handlePreferencesChange}>
        <option value="home">Home</option>
        <option value="global">Global</option>
      </select>

      <select aria-label="Filter public feed" bind:value={activeFilter} on:change={handlePreferencesChange}>
        <option value="all">All items</option>
        <option value="projects">Projects</option>
        <option value="threads">Threads</option>
        <option value="events">Events</option>
      </select>

      <select aria-label="Sort public feed by" bind:value={activeSort} on:change={handlePreferencesChange}>
        <option value="popular">Most popular</option>
        <option value="recent">Most recent</option>
      </select>

      <select aria-label="Public feed time window" bind:value={activeWindow} on:change={handlePreferencesChange}>
        <option value="12h">Last 12 hours</option>
        <option value="1d">1 day</option>
        <option value="7d">7 days</option>
        <option value="1m">1 month</option>
        <option value="1y">1 year</option>
        <option value="all">All time</option>
      </select>
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
  }

  .toolbar-card {
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .controls-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    width: 100%;
  }

  .controls-row select {
    min-width: 0;
    height: 34px;
    padding: 0 10px;
    font-size: 12px;
  }

  .empty-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: 0;
    background: var(--panel);
  }

  .empty-card p {
    color: var(--text-soft);
  }

  @media (max-width: 760px) {
    .controls-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      width: 100%;
    }

    .controls-row select {
      height: 32px;
      font-size: 13px;
    }
  }
</style>
