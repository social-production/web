import { currentAdapter } from '$lib/services/adapters';

export function getSearch(
  query: string,
  options?: { entityTypes?: Array<'project' | 'event' | 'thread' | 'channel' | 'community' | 'user'>; limit?: number }
) {
  return currentAdapter.getSearch(query, options);
}
