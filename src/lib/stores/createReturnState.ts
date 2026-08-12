/**
 * Capture the feed/discovery page the user left when opening create,
 * so close can restore path, query, and scroll position.
 */

const STORAGE_KEY = 'sp.createReturnState';

export type CreateReturnState = {
  path: string;
  search: string;
  scrollY: number;
  savedAt: number;
};

const FEED_PATHS = new Set(['/', '/personal']);

/** Home/personal plus scoped channel/community feeds, platform, and profiles. */
export function isFeedDiscoveryPath(pathname: string): boolean {
  if (FEED_PATHS.has(pathname) || pathname === '/platform') {
    return true;
  }
  return (
    /^\/channels\/[^/]+$/.test(pathname) ||
    /^\/communities\/[^/]+$/.test(pathname) ||
    /^\/profile\/[^/]+$/.test(pathname)
  );
}

export function isCreateEntrySurface(pathname: string): boolean {
  return isFeedDiscoveryPath(pathname);
}

export function captureCreateReturnState(url: URL, scrollY = 0): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  if (!isCreateEntrySurface(url.pathname)) {
    return;
  }

  const state: CreateReturnState = {
    path: url.pathname,
    search: url.search,
    scrollY: Math.max(0, Math.round(scrollY)),
    savedAt: Date.now()
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function readCreateReturnState(): CreateReturnState | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as CreateReturnState;
    if (!parsed?.path || typeof parsed.path !== 'string') {
      return null;
    }
    return {
      path: parsed.path,
      search: typeof parsed.search === 'string' ? parsed.search : '',
      scrollY: typeof parsed.scrollY === 'number' ? Math.max(0, parsed.scrollY) : 0,
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : 0
    };
  } catch {
    return null;
  }
}

export function clearCreateReturnState(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}

export function createReturnHref(fallback = '/'): string {
  const state = readCreateReturnState();
  if (!state) {
    return fallback;
  }
  return `${state.path}${state.search}`;
}

/** Apply pending scroll restore once the destination document is ready. */
export function consumeCreateReturnScroll(pathname: string): number | null {
  const state = readCreateReturnState();
  if (!state || state.path !== pathname) {
    return null;
  }
  clearCreateReturnState();
  return state.scrollY;
}
