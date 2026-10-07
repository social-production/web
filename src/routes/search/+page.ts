import { getSearch } from '$lib/services/queries/search';
import type { SearchEntityType } from '$lib/types/search';
import type { PageLoad } from './$types';

const SEARCH_TYPES = new Set<SearchEntityType>([
  'project',
  'event',
  'thread',
  'channel',
  'community',
  'user',
  'help_request',
  'post'
]);

export const load = (async ({ url }) => {
  const query = url.searchParams.get('q') ?? '';
  const requested = url.searchParams.get('type') ?? 'all';
  const entityType = SEARCH_TYPES.has(requested as SearchEntityType)
    ? (requested as SearchEntityType)
    : 'all';
  const search = await getSearch(
    query,
    entityType === 'all' ? undefined : { entityTypes: [entityType] }
  );

  return {
    search: { ...search, entityType }
  };
}) satisfies PageLoad;