import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/navigation', () => ({
  invalidate: vi.fn(async () => undefined),
  invalidateAll: vi.fn(async () => undefined)
}));

import { invalidate, invalidateAll } from '$app/navigation';
import { detailDependKeyFromPath, invalidateAfterReport } from '$lib/utils/reportInvalidation';

describe('reportInvalidation', () => {
  it('resolves detail depend keys from pathnames', () => {
    expect(detailDependKeyFromPath('/events/picnic-1')).toBe('app:event:picnic-1');
    expect(detailDependKeyFromPath('/projects/build-1?tab=chat')).toBe('app:project:build-1');
    expect(detailDependKeyFromPath('/threads/t-1')).toBe('app:thread:t-1');
    expect(detailDependKeyFromPath('/posts/p-1')).toBe('app:post:p-1');
    expect(detailDependKeyFromPath('/help-requests/h-1')).toBe('app:help_request:h-1');
    expect(detailDependKeyFromPath('/messages')).toBeNull();
  });

  it('invalidates the matching detail key and falls back for messages', async () => {
    vi.mocked(invalidate).mockClear();
    vi.mocked(invalidateAll).mockClear();

    await invalidateAfterReport('/events/picnic-1');
    expect(invalidate).toHaveBeenCalledWith('app:event:picnic-1');
    expect(invalidate).toHaveBeenCalledWith('app:feed:public');
    expect(invalidate).toHaveBeenCalledWith('app:feed:personal');
    expect(invalidateAll).not.toHaveBeenCalled();

    await invalidateAfterReport('/messages');
    expect(invalidate).toHaveBeenCalledWith('inbox:messages');

    await invalidateAfterReport('/');
    expect(invalidate).toHaveBeenCalledWith('app:feed:public');
    expect(invalidate).toHaveBeenCalledWith('app:feed:personal');
    expect(invalidateAll).not.toHaveBeenCalled();

    await invalidateAfterReport('/profile/alice');
    expect(invalidate).toHaveBeenCalledWith('app:feed:public');
    expect(invalidate).toHaveBeenCalledWith('app:feed:personal');
    expect(invalidateAll).toHaveBeenCalled();
  });
});
