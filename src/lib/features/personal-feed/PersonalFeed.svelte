<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import PersonalFeedCard from '$lib/components/cards/personal-feed/PersonalFeedCard.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import IconMenuButton from '$lib/components/shared/IconMenuButton.svelte';
  import InfiniteFeedSentinel from '$lib/components/shared/InfiniteFeedSentinel.svelte';
  import { getPersonalFeedPage } from '$lib/services/queries/feeds';
  import { getSettings } from '$lib/services/queries/account';
  import { updateSettings } from '$lib/services/commands/account';
  import {
    DEFAULT_FEED_PAGE_SIZE,
    appendUniqueById
  } from '$lib/types/pagination';
  import type {
    FeedSortPreference,
    FeedWindowPreference,
    PersonalFeedFilterPreference,
    PersonalFeedPreferences,
    PersonalFeedScopePreference
  } from '$lib/types/account';
  import type { PersonalFeedItem } from '$lib/types/feed';
  import { mergeFeedEngagement } from '$lib/utils/feedSignals';
  import {
    normalizeFeedWindow,
    resolveFeedCorePreferences,
    resolveLoaderFeedSync,
    toFeedSortPreference
  } from '$lib/utils/feedQuery';

  export let items: PersonalFeedItem[];

  type PersonalScope = PersonalFeedScopePreference;
  type PersonalFilter = PersonalFeedFilterPreference;
  type FeedSort = FeedSortPreference;
  type FeedWindow = FeedWindowPreference;

  const defaultPreferences: PersonalFeedPreferences = {
    scope: 'popular',
    filter: 'all',
    sort: 'trending',
    window: 'all'
  };

  const scopeOptions = [
    { value: 'following', label: 'Following only' },
    { value: 'popular', label: 'Following + popular' }
  ];

  const filterOptions = [
    { value: 'all', label: 'All items' },
    { value: 'activity', label: 'Public activity' },
    { value: 'posts', label: 'Posts', icon: 'post' as const },
    { value: 'events', label: 'Events', icon: 'event' as const },
    { value: 'help_requests', label: 'Help requests', icon: 'help-request' as const }
  ];

  const sortOptions = [
    { value: 'trending', label: 'Trending' },
    { value: 'recent', label: 'Most recent' }
  ];

  const windowOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This week' },
    { value: 'month', label: 'This month' },
    { value: 'all', label: 'All time' }
  ];

  let feedItems: PersonalFeedItem[] = items;
  let feedItemsLoading = false;
  let feedItemsLoadingMore = false;
  let feedHasMore = items.length >= DEFAULT_FEED_PAGE_SIZE;
  let feedOffset = items.length;
  let feedItemsRequestId = 0;
  let lastLoadedQuery = '';
  let lastSyncedItems = items;

  let activeScope: PersonalScope = defaultPreferences.scope;
  let activeFilter: PersonalFilter = defaultPreferences.filter;
  let activeSort: FeedSort = defaultPreferences.sort;
  let activeWindow: FeedWindow = defaultPreferences.window;
  let preferencesReady = false;
  let isHydratingPreferences = false;
  let lastHydratedViewerId = '';
  let lastPersistedPreferences = preferenceSignature(defaultPreferences);

  function preferenceSignature(preferences: PersonalFeedPreferences) {
    return [preferences.scope, preferences.filter, preferences.sort, preferences.window].join(':');
  }

  function currentPreferences(): PersonalFeedPreferences {
    return {
      scope: activeScope,
      filter: activeFilter,
      sort: activeSort,
      window: activeWindow
    };
  }

  function normalizePersonalFilter(value: string | null | undefined): PersonalFilter {
    const normalized = (value ?? '').trim().toLowerCase();
    if (
      normalized === 'activity' ||
      normalized === 'posts' ||
      normalized === 'events' ||
      normalized === 'help_requests'
    ) {
      return normalized;
    }
    return 'all';
  }

  function applyPreferences(preferences?: Partial<PersonalFeedPreferences> | null) {
    const next: PersonalFeedPreferences = {
      ...defaultPreferences,
      ...(preferences ?? {})
    };

    isHydratingPreferences = true;
    activeScope = next.scope === 'following' ? 'following' : 'popular';
    activeFilter = normalizePersonalFilter(next.filter);
    activeSort = toFeedSortPreference(next.sort);
    activeWindow = normalizeFeedWindow(next.window);
    lastPersistedPreferences = preferenceSignature({
      scope: activeScope,
      filter: activeFilter,
      sort: activeSort,
      window: activeWindow
    });
    isHydratingPreferences = false;
  }

  async function hydratePreferences() {
    const settings = $page.data.settings ?? (await getSettings());
    if (!settings?.personalFeedPreferences) {
      return;
    }
    const signature = preferenceSignature({
      ...defaultPreferences,
      ...settings.personalFeedPreferences
    });
    if (signature === preferenceSignature(currentPreferences())) {
      return;
    }
    applyPreferences(settings.personalFeedPreferences);
  }

  function feedQuerySignature() {
    const apiFilter =
      activeFilter === 'events' || activeFilter === 'help_requests' ? activeFilter : 'all';
    return `${activeScope}:${activeSort}:${activeWindow}:${apiFilter}:${activeFilter}`;
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

    await updateSettings({ personalFeedPreferences: preferences });
    lastPersistedPreferences = signature;
  }

  function handlePreferencesChange() {
    void persistPreferences();
    syncFeedQueryToUrl();
    lastLoadedQuery = '';
    feedItems = [];
    void loadFeedItems();
  }

  function handleFeedQueryChange() {
    lastLoadedQuery = '';
    void persistPreferences();
    syncFeedQueryToUrl();
    feedItems = [];
    void loadFeedItems();
  }

  async function loadFeedItems() {
    if (!$page.data.bootstrap?.viewer) {
      feedItems = [];
      feedHasMore = false;
      feedOffset = 0;
      return;
    }

    const apiFilter =
      activeFilter === 'events' || activeFilter === 'help_requests' ? activeFilter : 'all';
    const query = feedQuerySignature();
    if (query === lastLoadedQuery && feedItems.length > 0) {
      return;
    }

    const requestId = ++feedItemsRequestId;
    feedItemsLoading = true;
    feedItemsLoadingMore = false;
    feedHasMore = true;
    feedOffset = 0;

    try {
      const pageResult = await getPersonalFeedPage({
        scope: activeScope,
        sort: activeSort,
        window: activeWindow,
        filter: apiFilter,
        limit: DEFAULT_FEED_PAGE_SIZE,
        offset: 0
      });
      if (requestId === feedItemsRequestId) {
        feedItems = pageResult.items;
        feedOffset = pageResult.items.length;
        feedHasMore = pageResult.hasMore;
        lastLoadedQuery = query;
      }
    } finally {
      if (requestId === feedItemsRequestId) {
        feedItemsLoading = false;
      }
    }
  }

  async function loadMoreFeedItems() {
    if (!$page.data.bootstrap?.viewer || feedItemsLoading || feedItemsLoadingMore || !feedHasMore) {
      return;
    }

    const apiFilter =
      activeFilter === 'events' || activeFilter === 'help_requests' ? activeFilter : 'all';
    const requestId = ++feedItemsRequestId;
    feedItemsLoadingMore = true;

    try {
      const pageResult = await getPersonalFeedPage({
        scope: activeScope,
        sort: activeSort,
        window: activeWindow,
        filter: apiFilter,
        limit: DEFAULT_FEED_PAGE_SIZE,
        offset: feedOffset
      });
      if (requestId !== feedItemsRequestId) {
        return;
      }
      feedItems = appendUniqueById(feedItems, pageResult.items);
      feedOffset += pageResult.items.length;
      feedHasMore = pageResult.hasMore;
    } finally {
      if (requestId === feedItemsRequestId) {
        feedItemsLoadingMore = false;
      }
    }
  }

  function matchesScope(item: PersonalFeedItem, scope: PersonalScope) {
    if (scope === 'popular') {
      return true;
    }

    return item.feedSource !== 'discovery';
  }

  function matchesFilter(item: PersonalFeedItem, filter: PersonalFilter) {
    if (filter === 'all' || filter === 'events' || filter === 'help_requests') {
      return true;
    }

    if (filter === 'activity') {
      return item.kind === 'activity' || item.kind === 'comment-activity';
    }

    if (filter === 'posts') {
      return item.kind === 'post';
    }

    return true;
  }

  function itemTimestamp(item: PersonalFeedItem) {
    return +(new Date(item.createdAt));
  }

  function matchesWindow(_item: PersonalFeedItem, _window: FeedWindow, _referenceTime: number) {
    return true;
  }

  function compareItems(_left: PersonalFeedItem, _right: PersonalFeedItem, _sort: FeedSort) {
    return 0;
  }

  $: if (items !== lastSyncedItems && !feedItemsLoading) {
    lastSyncedItems = items;
    const syncMode = resolveLoaderFeedSync({
      surface: 'personal',
      activeScope,
      activeSort,
      activeFilter,
      activeWindow,
      hasClientQuery: Boolean(lastLoadedQuery),
      hasClientItems: feedItems.length > 0
    });
    if (syncMode === 'merge') {
      feedItems = mergeFeedEngagement(feedItems, items);
    } else if (syncMode === 'replace') {
      feedItems = items;
    }
  }

  $: viewerId = $page.data.bootstrap?.viewer?.id ?? '';
  $: if (viewerId !== lastHydratedViewerId) {
    lastHydratedViewerId = viewerId;
    if (!preferencesReady) {
      applyPreferences($page.data.settings?.personalFeedPreferences);
    }
    if (!preferencesReady) {
      preferencesReady = true;
    }
  }

  $: referenceTime = Date.now();
  $: visibleItems = feedItems
    .filter((item) => matchesScope(item, activeScope))
    .filter((item) => matchesFilter(item, activeFilter))
    .filter((item) => matchesWindow(item, activeWindow, referenceTime))
    .slice()
    .sort((left, right) => compareItems(left, right, activeSort));

  let lastHydratedUrl = '';
  let isSyncingFeedUrl = false;

  async function syncFeedQueryToUrl() {
    const params = new URLSearchParams($page.url.searchParams);

    if (activeScope === 'popular') {
      params.delete('scope');
    } else {
      params.set('scope', activeScope);
    }

    if (activeFilter === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', activeFilter);
    }

    if (activeSort === 'trending') {
      params.delete('sort');
    } else {
      params.set('sort', activeSort);
    }

    if (activeWindow === 'all') {
      params.delete('window');
    } else {
      params.set('window', activeWindow);
    }

    const nextSearch = params.toString();
    const nextUrlSearch = nextSearch ? `?${nextSearch}` : '';
    if (nextUrlSearch === $page.url.search) {
      lastHydratedUrl = $page.url.search;
      return;
    }

    // Use goto+replaceState so SvelteKit's page URL is updated. Shallow replaceState
    // leaves sveltekit:pageurl stale, so browser Back would restore an unfiltered feed.
    isSyncingFeedUrl = true;
    lastHydratedUrl = nextUrlSearch;
    try {
      await goto(`${$page.url.pathname}${nextUrlSearch}`, {
        replaceState: true,
        noScroll: true,
        keepFocus: true
      });
    } finally {
      lastHydratedUrl = $page.url.search;
      isSyncingFeedUrl = false;
    }
  }

  function normalizePersonalScope(value: string | null | undefined): PersonalScope {
    const normalized = (value ?? '').trim().toLowerCase();
    return normalized === 'following' || normalized === 'popular' ? normalized : defaultPreferences.scope;
  }

  function hydrateFromUrl(saved = $page.data.settings?.personalFeedPreferences) {
    const params = $page.url.searchParams;
    const core = resolveFeedCorePreferences({
      params,
      saved,
      defaults: defaultPreferences,
      normalizeScope: normalizePersonalScope,
      normalizeFilter: normalizePersonalFilter
    });
    activeScope = core.scope as PersonalScope;
    activeFilter = core.filter as PersonalFilter;
    activeSort = core.sort as FeedSort;
    activeWindow = core.window as FeedWindow;
  }

  $: if (preferencesReady && !isSyncingFeedUrl && $page.url.search !== lastHydratedUrl) {
    lastHydratedUrl = $page.url.search;
    hydrateFromUrl($page.data.settings?.personalFeedPreferences);
    lastLoadedQuery = '';
    void loadFeedItems();
  }

  onMount(() => {
    void (async () => {
      applyPreferences($page.data.settings?.personalFeedPreferences);
      lastHydratedUrl = $page.url.search;
      hydrateFromUrl($page.data.settings?.personalFeedPreferences);
      preferencesReady = true;
      syncFeedQueryToUrl();
      lastLoadedQuery = '';
      await loadFeedItems();
    })();
  });
</script>

<section class="feed-page">
  <section class="toolbar-card">
    <div class="controls-row">
      <IconMenuButton
        bind:value={activeScope}
        ariaLabel="Choose personal feed scope"
        defaultValue="popular"
        options={scopeOptions}
        on:change={handleFeedQueryChange}
      >
        <FeedToolbarIcon name={activeScope === 'following' ? 'people' : 'trending'} />
      </IconMenuButton>

      <IconMenuButton
        bind:value={activeFilter}
        ariaLabel="Filter personal feed"
        defaultValue="all"
        options={filterOptions}
        showOptionIcons
        on:change={handlePreferencesChange}
      >
        <FeedToolbarIcon name="filter" />
      </IconMenuButton>

      <IconMenuButton
        bind:value={activeSort}
        ariaLabel="Sort personal feed by"
        options={sortOptions}
        on:change={handleFeedQueryChange}
      >
        <FeedToolbarIcon name="sort" />
      </IconMenuButton>

      <IconMenuButton
        bind:value={activeWindow}
        ariaLabel="Personal feed time window"
        defaultValue="all"
        options={windowOptions}
        on:change={handlePreferencesChange}
      >
        <FeedToolbarIcon name="clock" />
      </IconMenuButton>
    </div>
  </section>

  <div class="stack">
    {#if feedItemsLoading && visibleItems.length === 0}
      <section class="empty-card">
        <p>Loading personal feed…</p>
      </section>
    {:else if visibleItems.length === 0}
      <section class="empty-card">
        <p>{activeScope === 'following' ? 'No posts or activity from people you follow match this filter yet.' : 'No followed activity or popular public posts match this filter yet.'}</p>
      </section>
    {:else}
      {#each visibleItems as item (item.id)}
        <PersonalFeedCard item={item} />
      {/each}
      <InfiniteFeedSentinel
        disabled={!feedHasMore || feedItemsLoading}
        loading={feedItemsLoadingMore}
        on:loadMore={loadMoreFeedItems}
      />
      {#if !feedHasMore && visibleItems.length > 0}
        <p class="end-copy">You're caught up.</p>
      {/if}
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

  .end-copy {
    margin: 0;
    padding: 12px 4px 4px;
    color: var(--text-soft);
    font-size: 13px;
    text-align: center;
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