import { getPersonalFeedPage } from '$lib/services/queries/feeds';
import { isNetworkLoadError, toLoadError } from '$lib/services/errors';
import { PERSONAL_FEED_DEPENDS } from '$lib/utils/feedSignals';
import { DEFAULT_FEED_PAGE_SIZE } from '$lib/types/pagination';
import type { PageLoad } from './$types';

export const load = (async ({ depends }) => {
  depends(PERSONAL_FEED_DEPENDS);

  try {
    const page = await getPersonalFeedPage({
      scope: 'popular',
      sort: 'popular',
      limit: DEFAULT_FEED_PAGE_SIZE,
      offset: 0
    });
    return {
      items: page.items,
      loadError: null as string | null
    };
  } catch (err) {
    if (isNetworkLoadError(err)) {
      return {
        items: [],
        loadError: 'Could not load your personal feed. Check your connection and try again.'
      };
    }

    toLoadError(err, 'Could not load your personal feed.');
  }
}) satisfies PageLoad;
