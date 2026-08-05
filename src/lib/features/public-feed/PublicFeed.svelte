<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import PublicFeedCard from '$lib/components/cards/public-feed/PublicFeedCard.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import IconMenuButton from '$lib/components/shared/IconMenuButton.svelte';
  import RadiusCombobox from '$lib/components/shared/RadiusCombobox.svelte';
  import {
    effectiveRadiusKm,
    normalizeRadiusFromUrl,
    radiusPresetOptions
  } from '$lib/location/radius';
  import { getHomeFeedPage, getPublicFeedPage, getRegionFeedPage } from '$lib/services/queries/feeds';
  import { getSettings, updateSettings } from '$lib/services/queries/account';
  import { searchLocations } from '$lib/services/queries/locations';
  import { readDefaultLocation, writeDefaultLocation } from '$lib/location/defaults';
  import {
    devicePositionErrorMessage,
    requestDevicePosition,
    setDeviceGeolocationEnabled
  } from '$lib/location/geolocation';
  import { displayTimezone } from '$lib/stores/timezoneStore';
  import { debounce } from '$lib/utils/debounce';
  import InfiniteFeedSentinel from '$lib/components/shared/InfiniteFeedSentinel.svelte';
  import {
    DEFAULT_FEED_PAGE_SIZE,
    appendUniqueById
  } from '$lib/features/feed/feedPagination';
  import type {
    FeedSortPreference,
    FeedWindowPreference,
    PublicFeedFilterPreference,
    PublicFeedPreferences,
    PublicFeedScopePreference
  } from '$lib/types/account';
  import type { PublicFeedItem } from '$lib/types/feed';
  import {
    normalizeFeedFilter,
    normalizeFeedWindow,
    resolveFeedCorePreferences,
    resolveLoaderFeedSync,
    toFeedSortPreference
  } from '$lib/utils/feedQuery';
  import { mergeFeedEngagement } from '$lib/utils/feedSignals';

  export let items: PublicFeedItem[];

  type PublicScope = PublicFeedScopePreference;
  type PublicFilter = PublicFeedFilterPreference;
  type FeedSort = FeedSortPreference;
  type FeedWindow = FeedWindowPreference;

  const defaultPreferences: PublicFeedPreferences = {
    scope: 'global',
    filter: 'all',
    sort: 'trending',
    window: 'all'
  };

  const scopeOptions = [
    { value: 'home', label: 'Home' },
    { value: 'global', label: 'Global' },
    { value: 'region', label: 'Region' }
  ];

  const filterOptions = [
    { value: 'all', label: 'All items' },
    { value: 'projects', label: 'Projects', icon: 'project' as const },
    { value: 'threads', label: 'Threads', icon: 'thread' as const },
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

  const radiusOptions = radiusPresetOptions;

  let activeScope: PublicScope = defaultPreferences.scope;
  let activeFilter: PublicFilter = defaultPreferences.filter;
  let activeSort: FeedSort = defaultPreferences.sort;
  let activeWindow: FeedWindow = defaultPreferences.window;
  let activeRadius = '25';
  let includeOnline = false;
  let placeQuery = '';
  let placeLabel = '';
  let centerLat: number | null = null;
  let centerLon: number | null = null;
  let placeSuggestions: Array<{ label: string; lat: number; lon: number }> = [];
  let preferencesReady = false;
  let isHydratingPreferences = false;
  let lastHydratedViewerId = '';
  let lastPersistedPreferences = preferenceSignature(defaultPreferences);
  let visibleItems: PublicFeedItem[] = items;
  let feedLoading = false;
  let feedLoadingMore = false;
  let feedHasMore = items.length >= DEFAULT_FEED_PAGE_SIZE;
  let feedOffset = items.length;
  let feedRequestId = 0;
  let lastLoadedQuery = '';
  let lastSyncedItems = items;
  let lastHydratedUrl = '';
  let isSyncingFeedUrl = false;
  let locationMessage = '';

  const debouncedSearchPlaces = debounce(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      placeSuggestions = [];
      return;
    }
    const results = await searchLocations(trimmed, 5);
    placeSuggestions = results
      .filter((item) => item.latitude != null && item.longitude != null)
      .map((item) => ({
        label: item.displayLabel,
        lat: item.latitude as number,
        lon: item.longitude as number,
        providerPlaceId: item.providerPlaceId,
        region: item.region,
        country: item.country
      }));
  }, 300);

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

  function normalizeScope(value: string | null | undefined): PublicScope {
    const normalized = (value ?? '').trim().toLowerCase();
    if (normalized === 'home' || normalized === 'region') return normalized;
    return 'global';
  }

  function applyPreferences(preferences?: Partial<PublicFeedPreferences> | null) {
    const next: PublicFeedPreferences = {
      ...defaultPreferences,
      ...(preferences ?? {})
    };
    next.scope = normalizeScope(next.scope);
    next.sort = toFeedSortPreference(next.sort);
    next.window = normalizeFeedWindow(next.window);
    next.filter = normalizeFeedFilter(next.filter) as PublicFilter;

    isHydratingPreferences = true;
    activeScope = next.scope;
    activeFilter = next.filter;
    activeSort = next.sort;
    activeWindow = next.window;
    lastPersistedPreferences = preferenceSignature(next);
    isHydratingPreferences = false;
  }

  function hydrateRegionCenter(viewerId: string | null) {
    const saved = readDefaultLocation(viewerId);
    if (saved?.latitude != null && saved?.longitude != null) {
      centerLat = saved.latitude;
      centerLon = saved.longitude;
      placeLabel = saved.displayLabel;
      placeQuery = saved.displayLabel;
    }
  }

  async function hydratePreferences() {
    const settings = $page.data.settings ?? (await getSettings());
    if (!settings?.publicFeedPreferences) {
      return;
    }
    const signature = preferenceSignature({
      ...defaultPreferences,
      ...settings.publicFeedPreferences,
      scope: normalizeScope(settings.publicFeedPreferences.scope)
    });
    if (signature === preferenceSignature(currentPreferences())) {
      return;
    }
    applyPreferences(settings.publicFeedPreferences);
  }

  function feedQuerySignature() {
    return `${activeScope}:${preferenceSignature(currentPreferences())}:${activeRadius}:${includeOnline}:${centerLat}:${centerLon}`;
  }

  async function fetchPublicPage(offset: number) {
    const query = {
      sort: activeSort,
      window: activeWindow,
      filter: activeFilter,
      limit: DEFAULT_FEED_PAGE_SIZE,
      offset
    };

    if (activeScope === 'home') {
      return getHomeFeedPage(query);
    }

    if (activeScope === 'region') {
      if (centerLat == null || centerLon == null) {
        return {
          items: [] as PublicFeedItem[],
          limit: DEFAULT_FEED_PAGE_SIZE,
          offset,
          hasMore: false
        };
      }

      return getRegionFeedPage({
        ...query,
        lat: centerLat,
        lon: centerLon,
        radiusKm: effectiveRadiusKm(activeRadius),
        includeOnline,
        tz: $displayTimezone || null
      });
    }

    return getPublicFeedPage(query);
  }

  async function loadFeedItems() {
    if (!preferencesReady) return;
    if (activeScope === 'home' && !$page.data.bootstrap?.viewer) {
      visibleItems = [];
      feedHasMore = false;
      feedOffset = 0;
      return;
    }

    const signature = feedQuerySignature();
    if (signature === lastLoadedQuery && visibleItems.length > 0) {
      return;
    }

    const requestId = ++feedRequestId;
    feedLoading = true;
    feedLoadingMore = false;
    feedHasMore = true;
    feedOffset = 0;
    try {
      const pageResult = await fetchPublicPage(0);
      if (requestId === feedRequestId) {
        visibleItems = pageResult.items;
        feedOffset = pageResult.items.length;
        feedHasMore = pageResult.hasMore;
        lastLoadedQuery = signature;
      }
    } finally {
      if (requestId === feedRequestId) {
        feedLoading = false;
      }
    }
  }

  async function loadMoreFeedItems() {
    if (!preferencesReady || feedLoading || feedLoadingMore || !feedHasMore) {
      return;
    }
    if (activeScope === 'home' && !$page.data.bootstrap?.viewer) {
      return;
    }
    if (activeScope === 'region' && (centerLat == null || centerLon == null)) {
      return;
    }

    const requestId = ++feedRequestId;
    feedLoadingMore = true;
    try {
      const pageResult = await fetchPublicPage(feedOffset);
      if (requestId !== feedRequestId) {
        return;
      }
      visibleItems = appendUniqueById(visibleItems, pageResult.items);
      feedOffset += pageResult.items.length;
      feedHasMore = pageResult.hasMore;
    } finally {
      if (requestId === feedRequestId) {
        feedLoadingMore = false;
      }
    }
  }

  function selectPlace(suggestion: {
    label: string;
    lat: number;
    lon: number;
    providerPlaceId?: string | null;
    region?: string | null;
    country?: string | null;
  }) {
    placeLabel = suggestion.label;
    placeQuery = suggestion.label;
    centerLat = suggestion.lat;
    centerLon = suggestion.lon;
    placeSuggestions = [];
    const viewerId = $page.data.bootstrap?.viewer?.id ?? null;
    writeDefaultLocation(viewerId, {
      displayLabel: suggestion.label,
      latitude: suggestion.lat,
      longitude: suggestion.lon,
      region: suggestion.region ?? null,
      country: suggestion.country ?? null,
      precision: 'approximate',
      providerPlaceId: suggestion.providerPlaceId ?? null,
      locationId: null,
      deviceGeolocationEnabled: false
    });
    syncFeedQueryToUrl();
    lastLoadedQuery = '';
    void loadFeedItems();
  }

  async function useDeviceCenter() {
    const viewerId = $page.data.bootstrap?.viewer?.id ?? null;
    setDeviceGeolocationEnabled(viewerId, true);
    const result = await requestDevicePosition(viewerId);
    if (!result.ok) {
      locationMessage = devicePositionErrorMessage(result.error);
      return;
    }
    locationMessage = '';
    centerLat = result.position.latitude;
    centerLon = result.position.longitude;
    placeLabel = result.label;
    placeQuery = result.label;
    writeDefaultLocation(viewerId, {
      displayLabel: result.label,
      latitude: result.position.latitude,
      longitude: result.position.longitude,
      region: null,
      country: null,
      precision: 'approximate',
      providerPlaceId: result.providerPlaceId,
      locationId: null,
      deviceGeolocationEnabled: true
    });
    syncFeedQueryToUrl();
    lastLoadedQuery = '';
    void loadFeedItems();
  }

  async function searchPlaces() {
    debouncedSearchPlaces(placeQuery);
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
    syncFeedQueryToUrl();
    lastLoadedQuery = '';
    visibleItems = [];
    void loadFeedItems();
  }

  $: if (items !== lastSyncedItems && !feedLoading) {
    lastSyncedItems = items;
    const syncMode = resolveLoaderFeedSync({
      surface: 'public',
      activeScope,
      activeSort,
      activeFilter,
      activeWindow,
      hasClientQuery: Boolean(lastLoadedQuery),
      hasClientItems: visibleItems.length > 0
    });
    if (syncMode === 'merge') {
      visibleItems = mergeFeedEngagement(visibleItems, items);
    } else if (syncMode === 'replace') {
      // Only take the loader snapshot when the active query still matches loader defaults.
      visibleItems = items;
    }
  }

  $: viewerId = $page.data.bootstrap?.viewer?.id ?? '';
  $: if (viewerId !== lastHydratedViewerId) {
    lastHydratedViewerId = viewerId;
    if (!preferencesReady) {
      applyPreferences($page.data.settings?.publicFeedPreferences);
      hydrateRegionCenter(viewerId || null);
    }
    if (!preferencesReady) {
      preferencesReady = true;
    }
  }
  $: if (!$page.data.bootstrap?.viewer && activeScope === 'home') {
    activeScope = 'global';
  }

  $: if (preferencesReady && !isSyncingFeedUrl && $page.url.search !== lastHydratedUrl) {
    lastHydratedUrl = $page.url.search;
    hydrateFromUrl($page.data.settings?.publicFeedPreferences);
    lastLoadedQuery = '';
    void loadFeedItems();
  }

  async function syncFeedQueryToUrl() {
    const params = new URLSearchParams($page.url.searchParams);

    if (activeScope === 'global') {
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

    if (activeScope === 'region') {
      if (centerLat != null && centerLon != null) {
        params.set('lat', String(centerLat));
        params.set('lon', String(centerLon));
      }
      if (placeLabel) {
        params.set('place', placeLabel);
      }
      if (activeRadius && activeRadius !== '25') {
        params.set('radius', activeRadius);
      } else {
        params.delete('radius');
      }
      if (includeOnline) {
        params.set('includeOnline', 'true');
      } else {
        params.delete('includeOnline');
      }
    } else {
      params.delete('lat');
      params.delete('lon');
      params.delete('place');
      params.delete('radius');
      params.delete('includeOnline');
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

  function normalizePublicScope(value: string | null | undefined): PublicScope {
    const normalized = (value ?? '').trim().toLowerCase();
    if (normalized === 'region' || normalized === 'home' || normalized === 'global') {
      return normalized;
    }
    return defaultPreferences.scope;
  }

  function hydrateFromUrl(saved = $page.data.settings?.publicFeedPreferences) {
    const params = $page.url.searchParams;
    const core = resolveFeedCorePreferences({
      params,
      saved,
      defaults: defaultPreferences,
      normalizeScope: normalizePublicScope,
      normalizeFilter: (value) => normalizeFeedFilter(value)
    });

    activeScope = core.scope as PublicScope;
    activeFilter = core.filter as PublicFilter;
    activeSort = core.sort as FeedSort;
    activeWindow = core.window as FeedWindow;

    const lat = params.get('lat');
    const lon = params.get('lon');
    if (lat && lon) {
      const parsedLat = Number(lat);
      const parsedLon = Number(lon);
      if (!Number.isNaN(parsedLat) && !Number.isNaN(parsedLon)) {
        centerLat = parsedLat;
        centerLon = parsedLon;
      }
    } else if (activeScope === 'region') {
      hydrateRegionCenter($page.data.bootstrap?.viewer?.id ?? null);
    }

    const place = params.get('place');
    if (place) {
      placeLabel = place;
      placeQuery = place;
    }
    const radius = params.get('radius');
    const normalizedRadius = normalizeRadiusFromUrl(radius);
    activeRadius = normalizedRadius || '25';

    const online = params.get('includeOnline');
    if (online === 'true') {
      includeOnline = true;
    } else if (online === 'false' || !online) {
      includeOnline = false;
    }
  }

  function handleRadiusChange(event: CustomEvent<{ value: string }>) {
    activeRadius = event.detail.value;
    handlePreferencesChange();
  }

  onMount(() => {
    void (async () => {
      const viewerId = $page.data.bootstrap?.viewer?.id ?? null;
      applyPreferences($page.data.settings?.publicFeedPreferences);
      hydrateRegionCenter(viewerId);
      lastHydratedUrl = $page.url.search;
      hydrateFromUrl($page.data.settings?.publicFeedPreferences);
      preferencesReady = true;
      syncFeedQueryToUrl();
      lastLoadedQuery = '';
      await loadFeedItems();
    })();
  });
</script>

<section class="feed-page">
  <section class="toolbar-card" class:toolbar-card-region={activeScope === 'region'}>
    <div class="controls-row controls-row-primary">
      <IconMenuButton
        bind:value={activeScope}
        ariaLabel="Choose public feed scope"
        defaultValue="global"
        options={scopeOptions}
        on:change={handlePreferencesChange}
      >
        <FeedToolbarIcon
          name={activeScope === 'home' ? 'home' : activeScope === 'region' ? 'map-pin' : 'globe'}
        />
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

      {#if activeScope === 'region'}
        <RadiusCombobox
          bind:value={activeRadius}
          ariaLabel="Region radius"
          options={radiusOptions}
          portaled
          on:change={handleRadiusChange}
        />

        <button
          aria-label="Include online list"
          aria-pressed={includeOnline}
          class="icon-button region-primary-only"
          class:active={includeOnline}
          title="Shows online events separately from the map"
          type="button"
          on:click={() => {
            includeOnline = !includeOnline;
            handlePreferencesChange();
          }}
        >
          <FeedToolbarIcon name="wifi" />
        </button>
      {/if}
    </div>

    {#if activeScope === 'region'}
      <div class="controls-row controls-row-region">
        <label class="place-search">
          <input
            aria-label="Place"
            bind:value={placeQuery}
            placeholder="City or address"
            on:input={() => void searchPlaces()}
          />
        </label>

        <button
          aria-label="Use my location"
          class="icon-button"
          type="button"
          on:click={() => void useDeviceCenter()}
        >
          <FeedToolbarIcon name="locate" />
        </button>
      </div>
    {/if}

    {#if activeScope === 'region'}
      {#if locationMessage}
        <p class="inline-alert" role="alert">{locationMessage}</p>
      {/if}
      {#if placeSuggestions.length > 0}
        <ul class="suggestions">
          {#each placeSuggestions as suggestion}
            <li>
              <button type="button" on:click={() => selectPlace(suggestion)}>{suggestion.label}</button>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
  </section>

  <div class="stack">
    {#if feedLoading && visibleItems.length === 0}
      <section class="empty-card">
        <p>Loading feed...</p>
      </section>
    {:else if activeScope === 'region' && (centerLat == null || centerLon == null)}
      <section class="empty-card">
        <p>Choose a place or enable device location to load the region feed.</p>
      </section>
    {:else if visibleItems.length === 0}
      <section class="empty-card">
        <p>
          {activeScope === 'home'
            ? 'No items from your followed channels, communities, or platform membership match this filter yet.'
            : activeScope === 'region'
              ? 'No regional items match this radius and filter yet.'
              : 'No public items match this filter yet.'}
        </p>
      </section>
    {:else}
      {#each visibleItems as item (item.id)}
        <PublicFeedCard item={item} />
      {/each}
      <InfiniteFeedSentinel
        disabled={!feedHasMore || feedLoading}
        loading={feedLoadingMore}
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

  .toolbar-card-region {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  .controls-row {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 2px;
    min-width: 0;
  }

  .controls-row-region {
    flex: 1 1 auto;
    min-width: 0;
  }

  .place-search {
    flex: 1 1 140px;
    min-width: 88px;
    max-width: 220px;
  }

  .place-search input {
    width: 100%;
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    background: var(--panel);
    color: var(--text-main);
    padding: 6px 8px;
    font: inherit;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (min-width: 761px) {
    .place-search {
      max-width: 120px;
    }
  }

  @media (max-width: 760px) {
    .controls-row-region {
      flex: 1 1 100%;
    }
  }

  .icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    background: transparent;
    color: var(--text-soft);
    cursor: pointer;
    flex: 0 0 auto;
  }

  .icon-button.active {
    border-color: var(--brand);
    color: var(--brand-strong);
    background: var(--brand-soft);
  }

  .inline-alert {
    margin: 8px 0 0;
    font-size: 12px;
    color: var(--danger, #c0392b);
    flex: 1 1 100%;
  }

  .suggestions {
    flex: 1 1 100%;
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 4px;
  }

  .suggestions button {
    width: 100%;
    text-align: left;
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    background: var(--panel);
    color: var(--text-main);
    padding: 8px 10px;
    cursor: pointer;
    font: inherit;
    font-size: 13px;
  }

  .empty-card {
    padding: 20px 4px;
    border: none;
    border-bottom: 1px solid var(--panel-border);
    border-radius: 0;
    background: transparent;
    color: var(--text-soft);
  }
</style>
