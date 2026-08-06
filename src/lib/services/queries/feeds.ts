import { currentAdapter } from '$lib/services/adapters';
import { feedCacheKey, withFeedCache } from '$lib/services/feedCache';
import { DEFAULT_FEED_PAGE_SIZE, type FeedPageResult } from '$lib/types/pagination';

type PublicFeedOptions = {
  sort?: 'trending' | 'recent' | 'popular';
  window?: string;
  filter?: string;
  limit?: number;
  offset?: number;
};

type RegionFeedOptions = PublicFeedOptions & {
  lat: number;
  lon: number;
  radiusKm?: number;
  includeOnline?: boolean;
  tz?: string | null;
};

type PersonalFeedOptions = {
  scope?: 'following' | 'popular';
  sort?: 'trending' | 'recent' | 'popular';
  window?: string;
  filter?: string;
  limit?: number;
  offset?: number;
};

function shouldCachePage(offset?: number) {
  return (offset ?? 0) === 0;
}

export function getPublicFeed(options?: PublicFeedOptions) {
  const key = feedCacheKey('public', options);
  return withFeedCache(key, () => currentAdapter.getPublicFeed(options));
}

export function getPublicFeedPage(
  options?: PublicFeedOptions
): Promise<FeedPageResult<import('$lib/types/feed').PublicFeedItem>> {
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? DEFAULT_FEED_PAGE_SIZE;
  const request = { ...options, limit, offset };
  if (!shouldCachePage(offset)) {
    return currentAdapter.getPublicFeedPage(request);
  }
  const key = feedCacheKey('public-page', request);
  return withFeedCache(key, () => currentAdapter.getPublicFeedPage(request));
}

export function getHomeFeed(options?: PublicFeedOptions) {
  const key = feedCacheKey('home', options);
  return withFeedCache(key, () => currentAdapter.getHomeFeed(options));
}

export function getHomeFeedPage(options?: PublicFeedOptions) {
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? DEFAULT_FEED_PAGE_SIZE;
  const request = { ...options, limit, offset };
  if (!shouldCachePage(offset)) {
    return currentAdapter.getHomeFeedPage(request);
  }
  const key = feedCacheKey('home-page', request);
  return withFeedCache(key, () => currentAdapter.getHomeFeedPage(request));
}

export function getRegionFeed(options: RegionFeedOptions) {
  return currentAdapter.getRegionFeed(options);
}

export function getRegionFeedPage(options: RegionFeedOptions) {
  const offset = options.offset ?? 0;
  const limit = options.limit ?? DEFAULT_FEED_PAGE_SIZE;
  return currentAdapter.getRegionFeedPage({ ...options, limit, offset });
}

export function getMapMarkers(options: {
  lat: number;
  lon: number;
  radiusKm?: number;
  distanceFromLat?: number;
  distanceFromLon?: number;
  window?: string;
  filter?: string;
  dateFrom?: string;
  dateTo?: string;
  upcomingOnly?: boolean;
  tz?: string | null;
}) {
  return currentAdapter.getMapMarkers(options);
}

export function getPersonalFeed(options?: PersonalFeedOptions) {
  const key = feedCacheKey('personal', options);
  return withFeedCache(key, () => currentAdapter.getPersonalFeed(options));
}

export function getPersonalFeedPage(options?: PersonalFeedOptions) {
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? DEFAULT_FEED_PAGE_SIZE;
  const request = { ...options, limit, offset };
  if (!shouldCachePage(offset)) {
    return currentAdapter.getPersonalFeedPage(request);
  }
  const key = feedCacheKey('personal-page', request);
  return withFeedCache(key, () => currentAdapter.getPersonalFeedPage(request));
}

export function getScopeFeedPage(options: {
  kind: 'channel' | 'community';
  slug: string;
  sort?: 'trending' | 'recent' | 'popular';
  window?: string;
  filter?: string;
  limit?: number;
  offset?: number;
}) {
  const offset = options.offset ?? 0;
  const limit = options.limit ?? DEFAULT_FEED_PAGE_SIZE;
  return currentAdapter.getScopeFeedPage({ ...options, limit, offset });
}

export function getUserFeedPage(options: {
  username: string;
  sort?: 'trending' | 'recent' | 'popular' | 'oldest' | 'top';
  window?: string;
  filter?: string;
  limit?: number;
  offset?: number;
}) {
  const offset = options.offset ?? 0;
  const limit = options.limit ?? DEFAULT_FEED_PAGE_SIZE;
  return currentAdapter.getUserFeedPage({ ...options, limit, offset });
}
