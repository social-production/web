import { getPublicFeed } from '$lib/services/queries/feeds';
import type { PageLoad } from './$types';

export const load = (async () => {
  return {
    items: await getPublicFeed()
  };
}) satisfies PageLoad;