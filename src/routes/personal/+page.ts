import { browser } from '$app/environment';
import { getPersonalFeedPage } from '$lib/services/queries/feeds';
import { readCachedSettings } from '$lib/services/bootstrapCache';
import { isNetworkLoadError, toLoadError } from '$lib/services/errors';
import { PERSONAL_FEED_DEPENDS } from '$lib/utils/feedSignals';
import { DEFAULT_FEED_PAGE_SIZE } from '$lib/types/pagination';
import { normalizeFeedFilter, resolveFeedCorePreferences } from '$lib/utils/feedQuery';
import type { PageLoad } from './$types';

function normalizePersonalScope(value: string | null | undefined): 'following' | 'popular' {
  return (value ?? '').trim().toLowerCase() === 'following' ? 'following' : 'popular';
}

export const load = (async ({ depends, parent, url }) => {
  depends(PERSONAL_FEED_DEPENDS);

  try {
    const urlHasPrefs =
      url.searchParams.has('sort') ||
      url.searchParams.has('filter') ||
      url.searchParams.has('scope') ||
      url.searchParams.has('window');
    const cachedSettings = browser ? readCachedSettings() : null;
    const saved = cachedSettings?.personalFeedPreferences;
    const parentData = urlHasPrefs || saved ? null : await parent();
    const resolved = resolveFeedCorePreferences({
      params: url.searchParams,
      saved: saved ?? parentData?.settings?.personalFeedPreferences,
      defaults: { scope: 'popular', filter: 'all', sort: 'trending', window: 'all' },
      normalizeScope: normalizePersonalScope,
      normalizeFilter: (value) => {
        const normalized = (value ?? '').trim().toLowerCase();
        if (
          normalized === 'activity' ||
          normalized === 'posts' ||
          normalized === 'events' ||
          normalized === 'help_requests'
        ) {
          return normalized;
        }
        return normalizeFeedFilter(value);
      }
    });
    const page = await getPersonalFeedPage({
      scope: normalizePersonalScope(resolved.scope),
      sort: resolved.sort === 'recent' ? 'recent' : 'trending',
      window: resolved.window,
      filter: resolved.filter as 'all' | 'activity' | 'posts' | 'events' | 'help_requests',
      limit: DEFAULT_FEED_PAGE_SIZE,
      offset: 0
    });
    return {
      items: page.items,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor ?? null,
      loadError: null as string | null
    };
  } catch (err) {
    if (isNetworkLoadError(err)) {
      return {
        items: [],
        hasMore: false,
        nextCursor: null,
        loadError: 'Could not load your personal feed. Check your connection and try again.'
      };
    }

    toLoadError(err, 'Could not load your personal feed.');
  }
}) satisfies PageLoad;
