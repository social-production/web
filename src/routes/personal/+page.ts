import { getPersonalFeed } from '$lib/services/queries/feeds';
import type { PageLoad } from './$types';

export const load = (async () => {
  return {
    items: await getPersonalFeed({ scope: 'popular', sort: 'popular' })
  };
}) satisfies PageLoad;