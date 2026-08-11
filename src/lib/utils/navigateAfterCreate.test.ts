import { beforeEach, describe, expect, it, vi } from 'vitest';

const goto = vi.fn<(href: string) => Promise<void>>(async () => {});
const invalidateAll = vi.fn<() => Promise<void>>(async () => {});

vi.mock('$app/navigation', () => ({
  goto: (href: string) => goto(href),
  invalidateAll: () => invalidateAll()
}));

import { clearFeedCache, feedCacheKey, peekFeedCache, writeFeedCache } from '$lib/services/feedCache';
import { navigateAfterCreate } from '$lib/utils/navigateAfterCreate';

beforeEach(() => {
  clearFeedCache();
  goto.mockClear();
  invalidateAll.mockClear();
});

describe('navigateAfterCreate', () => {
  it('clears feed cache before navigating so new content is not hidden', async () => {
    const key = feedCacheKey('personal-page', { scope: 'following' });
    writeFeedCache(key, [{ id: 'stale' }]);
    expect(peekFeedCache(key)).toEqual([{ id: 'stale' }]);

    await navigateAfterCreate('/posts/new-id');

    expect(peekFeedCache(key)).toBeNull();
    expect(goto).toHaveBeenCalledWith('/posts/new-id');
    expect(invalidateAll).toHaveBeenCalled();
  });
});
