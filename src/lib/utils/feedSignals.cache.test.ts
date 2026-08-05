import { beforeEach, describe, expect, it, vi } from 'vitest';

const invalidate = vi.fn(async (_key?: string) => {});

vi.mock('$app/navigation', () => ({
  invalidate: (key?: string) => invalidate(key)
}));

import {
  clearFeedCache,
  feedCacheKey,
  peekFeedCache,
  writeFeedCache
} from '$lib/services/feedCache';
import {
  invalidateEntitySignalCache,
  invalidateFeedEngagementCache,
  PERSONAL_FEED_DEPENDS,
  PUBLIC_FEED_DEPENDS
} from '$lib/utils/feedSignals';

beforeEach(() => {
  clearFeedCache();
  invalidate.mockClear();
});

describe('invalidateEntitySignalCache', () => {
  it('clears feed list cache and invalidates detail plus both feeds', async () => {
    const key = feedCacheKey('public', {});
    writeFeedCache(key, [{ id: 'stale' }]);
    expect(peekFeedCache(key)).toEqual([{ id: 'stale' }]);

    await invalidateEntitySignalCache('event', 'demo-event');

    expect(peekFeedCache(key)).toBeNull();
    expect(invalidate).toHaveBeenCalledWith('app:event:demo-event');
    expect(invalidate).toHaveBeenCalledWith(PUBLIC_FEED_DEPENDS);
    expect(invalidate).toHaveBeenCalledWith(PERSONAL_FEED_DEPENDS);
  });
});

describe('invalidateFeedEngagementCache', () => {
  it('clears feed list cache and invalidates both feeds', async () => {
    const key = feedCacheKey('public', {});
    writeFeedCache(key, [{ id: 'stale-vote' }]);

    await invalidateFeedEngagementCache();

    expect(peekFeedCache(key)).toBeNull();
    expect(invalidate).toHaveBeenCalledWith(PUBLIC_FEED_DEPENDS);
    expect(invalidate).toHaveBeenCalledWith(PERSONAL_FEED_DEPENDS);
  });
});
