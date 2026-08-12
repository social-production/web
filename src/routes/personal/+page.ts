import { getPersonalFeedPage } from '$lib/services/queries/feeds';
import { isNetworkLoadError, toLoadError } from '$lib/services/errors';
import { PERSONAL_FEED_DEPENDS } from '$lib/utils/feedSignals';
import { DEFAULT_FEED_PAGE_SIZE } from '$lib/types/pagination';
import type { PageLoad } from './$types';

export const load = (async ({ depends, parent, url }) => {
  depends(PERSONAL_FEED_DEPENDS);

  try {
    const parentData = await parent();
    const saved = parentData.settings?.personalFeedPreferences;
    const page = await getPersonalFeedPage({
      scope: (url.searchParams.get('scope') ?? saved?.scope ?? 'popular') as
        'following' | 'popular',
      sort: (url.searchParams.get('sort') ?? saved?.sort ?? 'trending') as 'trending' | 'recent',
      window: url.searchParams.get('window') ?? saved?.window ?? 'all',
      filter: url.searchParams.get('filter') ?? saved?.filter ?? 'all',
      limit: DEFAULT_FEED_PAGE_SIZE,
      offset: 0,
    });
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
        loadError: 'Could not load your personal feed. Check your connection and try again.',
      };
    }

    toLoadError(err, 'Could not load your personal feed.');
  }
}) satisfies PageLoad;
