import { describe, expect, it } from 'vitest';
import {
  canMergeLoaderEngagement,
  normalizeFeedFilter,
  normalizeFeedSort,
  normalizeFeedWindow,
  profileSortToApiSort,
  resolveFeedCorePreferences,
  resolvePreferenceKey
} from '$lib/utils/feedQuery';

describe('profile / feed sort mapping', () => {
  it('keeps newest/recent, top/highest-rated, and oldest distinct', () => {
    expect(normalizeFeedSort('recent')).toBe('recent');
    expect(normalizeFeedSort('trending')).toBe('trending');
    expect(normalizeFeedSort('popular')).toBe('trending');
    expect(normalizeFeedSort('oldest')).toBe('oldest');
    expect(normalizeFeedSort('top')).toBe('top');
    expect(normalizeFeedSort('nope')).toBe('trending');
  });

  it('maps profile UI sort labels to feed API sorts', () => {
    expect(profileSortToApiSort('newest')).toBe('recent');
    expect(profileSortToApiSort('top')).toBe('top');
    expect(profileSortToApiSort('oldest')).toBe('oldest');
  });
});

describe('feed preference hydration', () => {
  it('lets URL override only present keys and keeps saved values for missing ones', () => {
    const resolved = resolveFeedCorePreferences({
      params: new URLSearchParams('filter=projects'),
      saved: { scope: 'home', filter: 'all', sort: 'recent', window: 'week' },
      defaults: { scope: 'global', filter: 'all', sort: 'trending', window: 'all' },
      normalizeScope: (value) => {
        const normalized = (value ?? '').trim().toLowerCase();
        return normalized === 'home' || normalized === 'global' || normalized === 'region'
          ? normalized
          : 'global';
      },
      normalizeFilter: normalizeFeedFilter
    });

    expect(resolved).toEqual({
      scope: 'home',
      filter: 'projects',
      sort: 'recent',
      window: 'week'
    });
  });

  it('falls back to defaults when URL and saved values are absent', () => {
    expect(
      resolvePreferenceKey(null, null, 'trending', normalizeFeedSort)
    ).toBe('trending');
    expect(normalizeFeedWindow(undefined)).toBe('all');
  });
});

describe('canMergeLoaderEngagement', () => {
  it('only allows merges that match the default page-loader query', () => {
    expect(
      canMergeLoaderEngagement({
        surface: 'public',
        activeScope: 'global',
        activeSort: 'trending',
        activeFilter: 'all',
        activeWindow: 'all'
      })
    ).toBe(true);

    expect(
      canMergeLoaderEngagement({
        surface: 'public',
        activeScope: 'home',
        activeSort: 'trending',
        activeFilter: 'all',
        activeWindow: 'all'
      })
    ).toBe(false);

    expect(
      canMergeLoaderEngagement({
        surface: 'personal',
        activeScope: 'popular',
        activeSort: 'trending',
        activeFilter: 'all',
        activeWindow: 'all'
      })
    ).toBe(true);

    expect(
      canMergeLoaderEngagement({
        surface: 'personal',
        activeScope: 'following',
        activeSort: 'trending',
        activeFilter: 'all',
        activeWindow: 'all'
      })
    ).toBe(false);

    expect(
      canMergeLoaderEngagement({
        surface: 'public',
        activeScope: 'global',
        activeSort: 'recent',
        activeFilter: 'all',
        activeWindow: 'all'
      })
    ).toBe(false);
  });
});
