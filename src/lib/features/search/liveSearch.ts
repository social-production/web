import { getSearch } from '$lib/services/queries/search';
import type { SearchResultItem } from '$lib/types/search';

export function createLiveSearchScheduler() {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let requestId = 0;

  function cancel() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }

  function schedule(query: string, onResults: (results: SearchResultItem[], loading: boolean) => void) {
    cancel();
    const trimmed = query.trim();

    if (!trimmed) {
      onResults([], false);
      return;
    }

    onResults([], true);
    const currentRequest = ++requestId;

    debounceTimer = setTimeout(async () => {
      try {
        const response = await getSearch(trimmed);
        if (currentRequest === requestId) {
          onResults(response.results, false);
        }
      } catch {
        if (currentRequest === requestId) {
          onResults([], false);
        }
      }
    }, 200);
  }

  return { schedule, cancel };
}
