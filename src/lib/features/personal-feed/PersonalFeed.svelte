<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import PageHeader from '$lib/components/shared/PageHeader.svelte';
  import PersonalFeedCard from '$lib/components/cards/personal-feed/PersonalFeedCard.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import IconMenuButton from '$lib/components/shared/IconMenuButton.svelte';
  import { getPersonalFeed } from '$lib/services/queries/feeds';
  import { getSettings, updateSettings } from '$lib/services/queries/account';
  import type {
    FeedSortPreference,
    FeedWindowPreference,
    PersonalFeedFilterPreference,
    PersonalFeedPreferences,
    PersonalFeedScopePreference
  } from '$lib/types/account';
  import type { PersonalFeedItem } from '$lib/types/feed';

  export let items: PersonalFeedItem[];

  type PersonalScope = PersonalFeedScopePreference;
  type PersonalFilter = PersonalFeedFilterPreference;
  type FeedSort = FeedSortPreference;
  type FeedWindow = FeedWindowPreference;

  const defaultPreferences: PersonalFeedPreferences = {
    scope: 'popular',
    filter: 'all',
    sort: 'popular',
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

  let feedItems: PersonalFeedItem[] = items;
  let feedItemsLoading = false;
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

  function applyPreferences(preferences?: Partial<PersonalFeedPreferences> | null) {
    const next: PersonalFeedPreferences = {
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
    applyPreferences(settings?.personalFeedPreferences);
    preferencesReady = true;
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
  }

  function handleFeedQueryChange() {
    lastLoadedQuery = '';
    void persistPreferences();
    void loadFeedItems();
  }

  async function loadFeedItems() {
    if (!$page.data.bootstrap?.viewer) {
      feedItems = [];
      return;
    }

    const query = `${activeScope}:${activeSort}`;
    if (query === lastLoadedQuery) {
      return;
    }

    const requestId = ++feedItemsRequestId;
    feedItemsLoading = true;

    try {
      const nextItems = await getPersonalFeed({ scope: activeScope, sort: activeSort });
      if (requestId === feedItemsRequestId) {
        feedItems = nextItems;
        lastLoadedQuery = query;
      }
    } finally {
      if (requestId === feedItemsRequestId) {
        feedItemsLoading = false;
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
    if (filter === 'all') {
      return true;
    }

    if (filter === 'activity') {
      return item.kind === 'activity' || item.kind === 'comment-activity';
    }

    if (filter === 'posts') {
      return item.kind === 'post' || item.kind === 'help-request';
    }

    return item.kind === 'activity' && item.subjectKind === 'event';
  }

  function itemVoteCount(item: PersonalFeedItem) {
    if (item.kind === 'post' || item.kind === 'activity') {
      return item.voteCount;
    }

    return 0;
  }

  function itemTimestamp(item: PersonalFeedItem) {
    return +(new Date(item.createdAt));
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

  function matchesWindow(item: PersonalFeedItem, window: FeedWindow, referenceTime: number) {
    if (window === 'all') {
      return true;
    }

    return referenceTime - itemTimestamp(item) <= timeWindowMs(window);
  }

  function compareItems(left: PersonalFeedItem, right: PersonalFeedItem, sort: FeedSort) {
    if (sort === 'popular') {
      return itemVoteCount(right) - itemVoteCount(left) || itemTimestamp(right) - itemTimestamp(left);
    }

    return itemTimestamp(right) - itemTimestamp(left);
  }

  $: if (items !== lastSyncedItems && !feedItemsLoading) {
    lastSyncedItems = items;
    const query = `${activeScope}:${activeSort}`;
    if (query === 'popular:popular') {
      feedItems = items;
      lastLoadedQuery = query;
    } else {
      lastLoadedQuery = '';
      void loadFeedItems();
    }
  }

  $: viewerId = $page.data.bootstrap?.viewer?.id ?? '';
  $: if (viewerId !== lastHydratedViewerId) {
    lastHydratedViewerId = viewerId;
    preferencesReady = false;
    applyPreferences($page.data.settings?.personalFeedPreferences);
    preferencesReady = true;
  }

  $: referenceTime = Date.now();
  $: visibleItems = feedItems
    .filter((item) => matchesScope(item, activeScope))
    .filter((item) => matchesFilter(item, activeFilter))
    .filter((item) => matchesWindow(item, activeWindow, referenceTime))
    .slice()
    .sort((left, right) => compareItems(left, right, activeSort));

  onMount(() => {
    void (async () => {
      await hydratePreferences();
      await loadFeedItems();
    })();
  });
</script>

<section class="feed-page">
  <PageHeader
    title="Personal"
    description="This timeline follows people instead of tags. Use it for direct social posting and followed-user public activity."
  />

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
      {#each visibleItems as item}
        <PersonalFeedCard item={item} />
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