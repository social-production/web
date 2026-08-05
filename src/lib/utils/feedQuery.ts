export type FeedSortQuery = 'trending' | 'recent' | 'oldest' | 'top';
export type FeedWindowQuery = 'today' | 'week' | 'month' | 'all';
export type FeedFilterQuery = 'all' | 'projects' | 'threads' | 'events' | 'help_requests';

export interface FeedQueryOptions {
  sort?: FeedSortQuery | 'popular';
  window?: FeedWindowQuery | string;
  filter?: FeedFilterQuery | string;
  scope?: string;
  limit?: number;
  offset?: number;
}

export interface FeedPreferenceSnapshot {
  scope?: string;
  filter?: string;
  sort?: string;
  window?: string;
}

/**
 * Resolve one preference key: URL wins when present, otherwise saved settings,
 * otherwise the default. Prevents partial URLs from resetting unrelated keys.
 */
export function resolvePreferenceKey<T extends string>(
  urlValue: string | null | undefined,
  savedValue: T | null | undefined,
  fallback: T,
  normalize: (value: string | null | undefined) => T
): T {
  if (urlValue != null && String(urlValue).trim() !== '') {
    return normalize(urlValue);
  }
  if (savedValue != null && String(savedValue).trim() !== '') {
    return normalize(savedValue);
  }
  return fallback;
}

export function resolveFeedCorePreferences(options: {
  params: URLSearchParams;
  saved?: FeedPreferenceSnapshot | null;
  defaults: {
    scope: string;
    filter: string;
    sort: FeedSortQuery;
    window: FeedWindowQuery;
  };
  normalizeScope: (value: string | null | undefined) => string;
  normalizeFilter: (value: string | null | undefined) => string;
}): {
  scope: string;
  filter: string;
  sort: FeedSortQuery;
  window: FeedWindowQuery;
} {
  const { params, saved, defaults, normalizeScope, normalizeFilter } = options;
  return {
    scope: resolvePreferenceKey(params.get('scope'), saved?.scope, defaults.scope, normalizeScope),
    filter: resolvePreferenceKey(
      params.get('filter'),
      saved?.filter,
      defaults.filter,
      normalizeFilter
    ),
    sort: resolvePreferenceKey<FeedSortQuery>(
      params.get('sort'),
      saved?.sort as FeedSortQuery | undefined,
      defaults.sort,
      normalizeFeedSort
    ),
    window: resolvePreferenceKey<FeedWindowQuery>(
      params.get('window'),
      saved?.window as FeedWindowQuery | undefined,
      defaults.window,
      normalizeFeedWindow
    )
  };
}

/**
 * Page loaders fetch default snapshots. Only merge their engagement into the
 * client list when the active query still matches that loader default.
 */
export function canMergeLoaderEngagement(options: {
  surface: 'public' | 'personal';
  activeScope: string;
  activeSort: string;
  activeFilter: string;
  activeWindow: string;
}): boolean {
  if (options.activeFilter !== 'all' || options.activeWindow !== 'all') {
    return false;
  }

  if (options.surface === 'public') {
    return options.activeScope === 'global' && options.activeSort === 'trending';
  }

  return options.activeScope === 'popular' && options.activeSort === 'trending';
}

/**
 * Decide how a page-loader feed snapshot should interact with the client list.
 * Non-default client queries must never be overwritten by the default loader
 * payload — especially while lastLoadedQuery is cleared during a refetch.
 */
export function resolveLoaderFeedSync(options: {
  surface: 'public' | 'personal';
  activeScope: string;
  activeSort: string;
  activeFilter: string;
  activeWindow: string;
  hasClientQuery: boolean;
  hasClientItems: boolean;
}): 'merge' | 'replace' | 'ignore' {
  const matchesLoaderDefaults = canMergeLoaderEngagement(options);

  if (!matchesLoaderDefaults) {
    return 'ignore';
  }

  if (options.hasClientItems && options.hasClientQuery) {
    return 'merge';
  }

  return 'replace';
}

export function normalizeFeedSort(value: string | null | undefined): FeedSortQuery {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'recent') return 'recent';
  if (normalized === 'oldest') return 'oldest';
  if (normalized === 'top') return 'top';
  if (normalized === 'popular') return 'trending';
  return 'trending';
}

/** Settings-persisted sorts only support trending/recent. */
export function toFeedSortPreference(value: string | null | undefined): 'trending' | 'recent' {
  return normalizeFeedSort(value) === 'recent' ? 'recent' : 'trending';
}

/** Profile UI sort labels → feed API sort query values. */
export function profileSortToApiSort(mode: 'newest' | 'top' | 'oldest'): FeedSortQuery {
  if (mode === 'top') return 'top';
  if (mode === 'oldest') return 'oldest';
  return 'recent';
}

export function normalizeFeedWindow(value: string | null | undefined): FeedWindowQuery {
  const normalized = (value ?? '').trim().toLowerCase();
  switch (normalized) {
    case 'today':
    case '12h':
    case '1d':
      return 'today';
    case 'week':
    case '7d':
      return 'week';
    case 'month':
    case '1m':
      return 'month';
    case 'all':
    case '1y':
      return 'all';
    default:
      return 'all';
  }
}

export function normalizeFeedFilter(value: string | null | undefined): FeedFilterQuery {
  const normalized = (value ?? '').trim().toLowerCase();
  if (
    normalized === 'projects' ||
    normalized === 'threads' ||
    normalized === 'events' ||
    normalized === 'help_requests'
  ) {
    return normalized;
  }
  return 'all';
}

export function buildFeedQueryString(options: FeedQueryOptions = {}): string {
  const params = new URLSearchParams();
  if (options.sort) params.set('sort', normalizeFeedSort(options.sort));
  if (options.window) params.set('window', normalizeFeedWindow(options.window));
  if (options.filter) params.set('filter', normalizeFeedFilter(options.filter));
  if (options.scope) params.set('scope', options.scope);
  if (typeof options.limit === 'number') params.set('limit', String(options.limit));
  if (typeof options.offset === 'number') params.set('offset', String(options.offset));
  const suffix = params.toString();
  return suffix ? `?${suffix}` : '';
}
