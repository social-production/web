import { getSearch } from '$lib/services/queries/search';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  const query = url.searchParams.get('q') ?? '';

  return {
    search: await getSearch(query)
  };
}) satisfies PageLoad;