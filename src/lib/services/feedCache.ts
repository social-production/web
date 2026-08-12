const FEED_CACHE_TTL_MS = 30_000;

interface FeedCacheEntry<T> {
  cachedAt: number;
  data: T;
}

const feedCache = new Map<string, FeedCacheEntry<unknown>>();
const feedInflight = new Map<string, Promise<unknown>>();

export function feedCacheKey(prefix: string, options?: Record<string, unknown>): string {
  return `${prefix}:${JSON.stringify(options ?? {})}`;
}

export function peekFeedCache<T>(key: string): T | null {
  const entry = feedCache.get(key);
  return (entry?.data as T | undefined) ?? null;
}

export function isFeedCacheFresh(key: string): boolean {
  const entry = feedCache.get(key);
  if (!entry) {
    return false;
  }
  return Date.now() - entry.cachedAt < FEED_CACHE_TTL_MS;
}

export function writeFeedCache<T>(key: string, data: T): void {
  feedCache.set(key, {
    cachedAt: Date.now(),
    data
  });
}

export async function withFeedCache<T>(
  key: string,
  loader: () => Promise<T>,
  options?: { revalidate?: boolean }
): Promise<T> {
  const cached = peekFeedCache<T>(key);
  const fresh = isFeedCacheFresh(key);

  if (cached && fresh) {
    return cached;
  }

  if (cached && options?.revalidate !== false) {
    void loader().then((data) => {
      writeFeedCache(key, data);
    });
    return cached;
  }

  const pending = feedInflight.get(key) as Promise<T> | undefined;
  if (pending) {
    return pending;
  }

  const request = loader()
    .then((data) => {
      writeFeedCache(key, data);
      return data;
    })
    .finally(() => {
      feedInflight.delete(key);
    });
  feedInflight.set(key, request);
  return request;
}

/** Drop all cached feed list payloads so the next load hits the network. */
export function clearFeedCache(): void {
  feedCache.clear();
  feedInflight.clear();
}
