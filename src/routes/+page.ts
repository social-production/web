import { getPublicFeed } from '$lib/services/queries/feeds';
import { isNetworkLoadError, toLoadError } from '$lib/api/drivers/fastapi/client';
import type { PageLoad } from './$types';

export const load = (async () => {
  try {
    return {
      items: await getPublicFeed(),
      loadError: null as string | null
    };
  } catch (err) {
    if (isNetworkLoadError(err)) {
      return {
        items: [],
        loadError: 'Could not load the feed. Check your connection and try again.'
      };
    }

    toLoadError(err, 'Could not load the feed.');
  }
}) satisfies PageLoad;
