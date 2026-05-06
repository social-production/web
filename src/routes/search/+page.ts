import { getSearch } from '$lib/services/queries/search';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  return {
    search: await getSearch(url.searchParams.get('q') ?? '')
  };
}) satisfies PageLoad;