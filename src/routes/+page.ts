import { getHomeFeedPage, getPublicFeedPage, getRegionFeedPage } from '$lib/services/queries/feeds';
import { isNetworkLoadError, toLoadError } from '$lib/services/errors';
import { PUBLIC_FEED_DEPENDS } from '$lib/utils/feedSignals';
import { DEFAULT_FEED_PAGE_SIZE } from '$lib/types/pagination';
import type { PageLoad } from './$types';

export const load = (async ({ depends, parent, url }) => {
  depends(PUBLIC_FEED_DEPENDS);

  try {
    const parentData = await parent();
    const saved = parentData.settings?.publicFeedPreferences;
    const scope = url.searchParams.get('scope') ?? saved?.scope ?? 'global';
    const query = {
      sort: (url.searchParams.get('sort') ?? saved?.sort ?? 'trending') as 'trending' | 'recent',
      window: url.searchParams.get('window') ?? saved?.window ?? 'all',
      filter: url.searchParams.get('filter') ?? saved?.filter ?? 'all',
      limit: DEFAULT_FEED_PAGE_SIZE,
      offset: 0,
    };
    const lat = Number(url.searchParams.get('lat'));
    const lon = Number(url.searchParams.get('lon'));
    const page =
      scope === 'home'
        ? await getHomeFeedPage(query)
        : scope === 'region' && Number.isFinite(lat) && Number.isFinite(lon)
          ? await getRegionFeedPage({
              ...query,
              lat,
              lon,
              radiusKm: Number(url.searchParams.get('radius') ?? 25),
              includeOnline: url.searchParams.get('includeOnline') === 'true',
              tz: parentData.settings?.displayTimezone ?? null,
            })
          : scope === 'region'
            ? { items: [], limit: DEFAULT_FEED_PAGE_SIZE, offset: 0, hasMore: false }
            : await getPublicFeedPage(query);
    return {
      items: page.items,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor ?? null,
      loadError: null as string | null,
    };
  } catch (err) {
    if (isNetworkLoadError(err)) {
      return {
        items: [],
        hasMore: false,
        nextCursor: null,
        loadError: 'Could not load the feed. Check your connection and try again.',
      };
    }

    toLoadError(err, 'Could not load the feed.');
  }
}) satisfies PageLoad;
