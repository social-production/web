import { afterEach, describe, expect, it } from 'vitest';
import {
  clearBootstrapCache,
  isBootstrapCacheConsistentWithAuth,
  isBootstrapCacheFresh,
  readBootstrapCache,
  readCachedSettings,
  resetBootstrapCacheStaleGuardForTests,
  shouldBackgroundRefreshBootstrap,
  writeBootstrapCache
} from './bootstrapCache';
import type { BootstrapPayload } from '$lib/types/bootstrap';
import type { SettingsPageData } from '$lib/types/account';

function sampleBootstrap(viewerId: string | null): BootstrapPayload {
  return {
    viewer: viewerId ? { id: viewerId, username: 'ada' } : null,
    unreadCounts: { notifications: 0, messages: 0 },
    directory: { platform: null, channels: [], communities: [] },
    featureFlags: { assets: false, funding: false, platform: false },
    suggestedContacts: [],
    activityRail: [],
    activityRailHistory: []
  };
}

describe('bootstrapCache', () => {
  afterEach(() => {
    clearBootstrapCache();
    resetBootstrapCacheStaleGuardForTests();
  });

  it('stores settings beside bootstrap and reads them back', () => {
    const settings = {
      profileUsername: 'ada',
      publicFeedPreferences: { scope: 'home', filter: 'all', sort: 'recent', window: 'week' }
    } as SettingsPageData;
    writeBootstrapCache(sampleBootstrap('user-1'), settings);
    expect(readBootstrapCache()?.viewer?.id).toBe('user-1');
    expect(readCachedSettings()?.publicFeedPreferences.sort).toBe('recent');
  });

  it('rejects a cached viewer when there is no remembered auth', () => {
    expect(isBootstrapCacheConsistentWithAuth(sampleBootstrap('user-1'), false)).toBe(false);
    expect(isBootstrapCacheConsistentWithAuth(sampleBootstrap(null), false)).toBe(true);
  });

  it('rejects an anonymous cache when auth is remembered', () => {
    expect(isBootstrapCacheConsistentWithAuth(sampleBootstrap(null), true)).toBe(false);
    expect(isBootstrapCacheConsistentWithAuth(sampleBootstrap('user-1'), true)).toBe(true);
  });

  it('reuses bootstrap cache across navigations until the TTL expires', () => {
    writeBootstrapCache(sampleBootstrap('user-1'), null);
    const record = {
      version: 3 as const,
      cachedAt: Date.now(),
      bootstrap: sampleBootstrap('user-1'),
      settings: null
    };
    expect(isBootstrapCacheFresh(record)).toBe(true);
    expect(shouldBackgroundRefreshBootstrap(record, 60_000)).toBe(false);
    expect(
      isBootstrapCacheFresh({
        ...record,
        cachedAt: Date.now() - 60_000
      })
    ).toBe(false);
  });
});
