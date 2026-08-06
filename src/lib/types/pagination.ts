/**
 * Shared pagination contract types for feed and list surfaces.
 * Drivers and feature modules should depend on this module, not feature folders.
 */

export const DEFAULT_FEED_PAGE_SIZE = 20;

export type FeedPageResult<T> = {
  items: T[];
  limit: number;
  offset: number;
  hasMore: boolean;
};

export function toFeedPageResult<T>(
  items: T[],
  meta: { limit: number; offset: number; rawCount: number }
): FeedPageResult<T> {
  return {
    items,
    limit: meta.limit,
    offset: meta.offset,
    hasMore: meta.rawCount >= meta.limit && meta.rawCount > 0
  };
}

export function appendUniqueById<T extends { id: string }>(existing: T[], next: T[]): T[] {
  if (next.length === 0) {
    return existing;
  }

  const seen = new Set(existing.map((item) => item.id));
  const appended = next.filter((item) => !seen.has(item.id));
  if (appended.length === 0) {
    return existing;
  }

  return [...existing, ...appended];
}
