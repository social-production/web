import { getPersonalFeed } from '$lib/services/queries/feeds';
import { isNetworkLoadError, toLoadError } from '$lib/services/errors';
import type { PageLoad } from './$types';

export const load = (async () => {
  try {
    return {
      items: await getPersonalFeed({ scope: 'popular', sort: 'popular' }),
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
