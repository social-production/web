import { browser } from '$app/environment';
import { getHomeFeedPage, getPublicFeedPage, getRegionFeedPage } from '$lib/services/queries/feeds';
import { readCachedSettings } from '$lib/services/bootstrapCache';
import { isNetworkLoadError, toLoadError } from '$lib/services/errors';
import { PUBLIC_FEED_DEPENDS } from '$lib/utils/feedSignals';
import { DEFAULT_FEED_PAGE_SIZE } from '$lib/types/pagination';
import { normalizeFeedFilter, resolveFeedCorePreferences } from '$lib/utils/feedQuery';
import type { PageLoad } from './$types';

function normalizePublicScope(value: string | null | undefined): 'home' | 'global' | 'region' {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'home' || normalized === 'global' || normalized === 'region') {
    return normalized;
  }
  return 'global';
}

export const load = (async ({ depends, parent, url }) => {
  depends(PUBLIC_FEED_DEPENDS);

  try {
    const urlHasPrefs =
      url.searchParams.has('sort') ||
      url.searchParams.has('filter') ||
      url.searchParams.has('scope') ||
      url.searchParams.has('window');
    const cachedSettings = browser ? readCachedSettings() : null;
    const saved = cachedSettings?.publicFeedPreferences;
    const parentData =
      urlHasPrefs || saved
        ? null
        : await parent();
    const resolved = resolveFeedCorePreferences({
      params: url.searchParams,
      saved: saved ?? parentData?.settings?.publicFeedPreferences,
      defaults: { scope: 'global', filter: 'all', sort: 'trending', window: 'all' },
      normalizeScope: normalizePublicScope,
      normalizeFilter: normalizeFeedFilter
    });
    const query = {
      sort: resolved.sort === 'recent' ? 'recent' : 'trending',
      window: resolved.window,
      filter: resolved.filter,
      limit: DEFAULT_FEED_PAGE_SIZE,
      offset: 0
    } as const;
    const lat = Number(url.searchParams.get('lat'));
    const lon = Number(url.searchParams.get('lon'));
    const timezone =
      cachedSettings?.displayTimezone ?? parentData?.settings?.displayTimezone ?? null;
    const page =
      resolved.scope === 'home'
        ? await getHomeFeedPage(query)
        : resolved.scope === 'region' && Number.isFinite(lat) && Number.isFinite(lon)
          ? await getRegionFeedPage({
              ...query,
              lat,
              lon,
              radiusKm: Number(url.searchParams.get('radius') ?? 25),
              includeOnline: url.searchParams.get('includeOnline') === 'true',
              tz: timezone
            })
          : resolved.scope === 'region'
            ? { items: [], limit: DEFAULT_FEED_PAGE_SIZE, offset: 0, hasMore: false }
            : await getPublicFeedPage(query);
    return {
      items: page.items,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor ?? null,
      loadError: null as string | null
    };
  } catch (err) {
    if (isNetworkLoadError(err)) {
      return {
        items: [],
        hasMore: false,
        nextCursor: null,
        loadError: 'Could not load the feed. Check your connection and try again.'
      };
    }

    toLoadError(err, 'Could not load the feed.');
  }
}) satisfies PageLoad;
