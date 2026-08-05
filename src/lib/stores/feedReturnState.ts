/**
 * Remember the last feed/scope discovery URL (path + query) so the brand icon
 * can return there from detail pages with filters intact.
 */

import { isCreateEntrySurface } from '$lib/stores/createReturnState';

const STORAGE_KEY = 'sp.lastFeedReturnState';

export type FeedReturnState = {
  path: string;
  search: string;
  savedAt: number;
};

export function rememberFeedReturnState(url: URL): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  if (!isCreateEntrySurface(url.pathname)) {
    return;
  }

  const state: FeedReturnState = {
    path: url.pathname,
    search: url.search,
    savedAt: Date.now()
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function readFeedReturnState(): FeedReturnState | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as FeedReturnState;
    if (!parsed?.path || typeof parsed.path !== 'string') {
      return null;
    }
    if (!isCreateEntrySurface(parsed.path)) {
      return null;
    }

    return {
      path: parsed.path,
      search: typeof parsed.search === 'string' ? parsed.search : '',
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : 0
    };
  } catch {
    return null;
  }
}

export function feedReturnHref(fallback = '/'): string {
  const state = readFeedReturnState();
  if (!state) {
    return fallback;
  }
  return `${state.path}${state.search}`;
}
