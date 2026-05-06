import { currentAdapter } from '$lib/services/adapters';

export function getSearch(query: string) {
  return currentAdapter.getSearch(query);
}