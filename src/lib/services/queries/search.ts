import { currentAdapter } from '$lib/services/adapters';
import type { SearchEntityType } from '$lib/types/search';

export function getSearch(
  query: string,
  options?: { entityTypes?: SearchEntityType[]; limit?: number }
) {
  return currentAdapter.getSearch(query, options);
}
