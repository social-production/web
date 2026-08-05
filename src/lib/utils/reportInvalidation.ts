import { invalidate, invalidateAll } from '$app/navigation';
import { clearFeedCache } from '$lib/services/feedCache';
import { PERSONAL_FEED_DEPENDS, PUBLIC_FEED_DEPENDS } from '$lib/utils/feedSignals';

/**
 * Resolve the SvelteKit `depends(...)` key for a detail surface from the
 * current pathname so report submit/vote can refresh only that page.
 */
export function detailDependKeyFromPath(pathname: string): string | null {
  const patterns: Array<[RegExp, string]> = [
    [/^\/events\/([^/?#]+)/, 'app:event'],
    [/^\/projects\/([^/?#]+)/, 'app:project'],
    [/^\/threads\/([^/?#]+)/, 'app:thread'],
    [/^\/posts\/([^/?#]+)/, 'app:post'],
    [/^\/help-requests\/([^/?#]+)/, 'app:help_request']
  ];

  for (const [pattern, prefix] of patterns) {
    const match = pathname.match(pattern);
    if (match?.[1]) {
      return `${prefix}:${decodeURIComponent(match[1])}`;
    }
  }

  return null;
}

/**
 * Refresh the current detail page after a report mutation without forcing a
 * full app-wide invalidation (which can trip fragile navigation transitions).
 * Also clears feed caches so moderated items leave list views on return.
 */
export async function invalidateAfterReport(pathname: string): Promise<void> {
  clearFeedCache();
  const key = detailDependKeyFromPath(pathname);
  const feedInvalidations = [invalidate(PUBLIC_FEED_DEPENDS), invalidate(PERSONAL_FEED_DEPENDS)];

  if (key) {
    await Promise.all([invalidate(key), ...feedInvalidations]);
    return;
  }

  if (pathname === '/messages' || pathname.startsWith('/messages/')) {
    await Promise.all([invalidate('inbox:messages'), ...feedInvalidations]);
    return;
  }

  // Feed roots, profile pages, and other list surfaces: force feed depends so emblems refresh.
  if (
    pathname === '/' ||
    pathname === '/personal' ||
    pathname.startsWith('/search') ||
    pathname.startsWith('/profile/')
  ) {
    await Promise.all(
      pathname.startsWith('/profile/')
        ? [...feedInvalidations, invalidateAll()]
        : feedInvalidations
    );
    return;
  }

  await Promise.all([...feedInvalidations, invalidateAll()]);
}
