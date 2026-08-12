import { apiClient } from '../client';
import type { AppAdapter } from '$lib/services/adapters/types';
import {
  DEFAULT_FEED_PAGE_SIZE,
  toFeedPageResult,
  type FeedPageResult
} from '$lib/types/pagination';
import { buildFeedQueryString } from '$lib/utils/feedQuery';
import type { PersonalFeedItem, PublicFeedItem } from '$lib/types/feed';
import { mapGatewayPersonalItems, mapGatewayPublicItems } from '../mappers/feed';

type PublicFeedQuery = {
  sort?: 'trending' | 'recent' | 'popular';
  window?: string;
  filter?: string;
  limit?: number;
  offset?: number;
  before?: string | null;
};

type RegionFeedQuery = PublicFeedQuery & {
  lat: number;
  lon: number;
  radiusKm?: number;
  includeOnline?: boolean;
  tz?: string | null;
};

type PersonalFeedQuery = PublicFeedQuery & {
  scope?: 'following' | 'popular';
};

type ScopeFeedQuery = PublicFeedQuery & {
  kind: 'channel' | 'community';
  slug: string;
};

type UserFeedQuery = {
  username: string;
  sort?: 'trending' | 'recent' | 'popular' | 'oldest' | 'top';
  window?: string;
  filter?: string;
  limit?: number;
  offset?: number;
};

type MapMarkerQuery = {
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
};

function withExtraParams(
  feedQuery: string,
  extra: Record<string, string | number | boolean | null | undefined>
): string {
  const params = new URLSearchParams(feedQuery.startsWith('?') ? feedQuery.slice(1) : feedQuery);
  for (const [key, value] of Object.entries(extra)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const suffix = params.toString();
  return suffix ? `?${suffix}` : '';
}

async function fetchRawFeedPage(
  path: string,
  query: Record<string, string | number | boolean | null | undefined>
): Promise<{
  items: unknown[];
  limit: number;
  offset: number;
  hasMore?: boolean;
  total?: number;
  nextCursor?: string | null;
}> {
  const { sort, window, filter, scope, limit, offset, ...extra } = query;
  const qs = withExtraParams(
    buildFeedQueryString({
      sort: sort as never,
      window: window as never,
      filter: filter as never,
      scope: scope as never,
      limit: typeof limit === 'number' ? limit : undefined,
      offset: typeof offset === 'number' ? offset : undefined
    }),
    extra
  );
  const res = await apiClient.get<{
    items?: unknown[];
    limit?: number;
    offset?: number;
    hasMore?: boolean;
    total?: number;
    nextCursor?: string | null;
  }>(`${path}${qs}`);
  const items = res.items ?? [];
  const pageLimit = res.limit ?? Number(limit ?? DEFAULT_FEED_PAGE_SIZE);
  const pageOffset = res.offset ?? Number(offset ?? 0);
  return {
    items,
    limit: pageLimit,
    offset: pageOffset,
    hasMore: res.hasMore,
    total: res.total,
    nextCursor: res.nextCursor
  };
}

function toTypedFeedPage<T>(
  raw: {
    items: unknown[];
    limit: number;
    offset: number;
    hasMore?: boolean;
    total?: number;
    nextCursor?: string | null;
  },
  mapper: (items: unknown[]) => T[]
): FeedPageResult<T> {
  const items = mapper(raw.items);
  if (typeof raw.hasMore === 'boolean') {
    return {
      items,
      limit: raw.limit,
      offset: raw.offset,
      hasMore: raw.hasMore,
      nextCursor: raw.nextCursor
    };
  }
  return toFeedPageResult(items, {
    limit: raw.limit,
    offset: raw.offset,
    rawCount: typeof raw.total === 'number' ? raw.total : raw.items.length,
    nextCursor: raw.nextCursor
  });
}

export async function fetchPublicFeedPage(
  query: PublicFeedQuery = {}
): Promise<FeedPageResult<PublicFeedItem>> {
  return toTypedFeedPage(await fetchRawFeedPage('/feeds/public', query), mapGatewayPublicItems);
}

export async function fetchPublicFeed(query: PublicFeedQuery = {}): Promise<PublicFeedItem[]> {
  return (await fetchPublicFeedPage(query)).items;
}

export async function fetchHomeFeedPage(
  query: PublicFeedQuery = {}
): Promise<FeedPageResult<PublicFeedItem>> {
  return toTypedFeedPage(await fetchRawFeedPage('/feeds/home', query), mapGatewayPublicItems);
}

export async function fetchHomeFeed(query: PublicFeedQuery = {}): Promise<PublicFeedItem[]> {
  return (await fetchHomeFeedPage(query)).items;
}

export async function fetchRegionFeedPage(
  query: RegionFeedQuery
): Promise<FeedPageResult<PublicFeedItem>> {
  return toTypedFeedPage(await fetchRawFeedPage('/feeds/region', query), mapGatewayPublicItems);
}

export async function fetchRegionFeed(query: RegionFeedQuery): Promise<PublicFeedItem[]> {
  return (await fetchRegionFeedPage(query)).items;
}

export async function fetchPersonalFeedPage(
  query: PersonalFeedQuery = {}
): Promise<FeedPageResult<PersonalFeedItem>> {
  return toTypedFeedPage(
    await fetchRawFeedPage('/feeds/personal', query),
    mapGatewayPersonalItems
  );
}

export async function fetchPersonalFeed(
  query: PersonalFeedQuery = {}
): Promise<PersonalFeedItem[]> {
  return (await fetchPersonalFeedPage(query)).items;
}

export async function fetchScopeFeedPage(
  query: ScopeFeedQuery
): Promise<FeedPageResult<PublicFeedItem>> {
  return toTypedFeedPage(await fetchRawFeedPage('/feeds/scope', query), mapGatewayPublicItems);
}

export async function fetchUserFeedPage(
  query: UserFeedQuery
): Promise<FeedPageResult<PersonalFeedItem>> {
  return toTypedFeedPage(
    await fetchRawFeedPage('/feeds/user', {
      ...query,
      username: query.username
    }),
    mapGatewayPersonalItems
  );
}

export async function fetchMapMarkers(
  query: MapMarkerQuery
): Promise<Awaited<ReturnType<AppAdapter['getMapMarkers']>>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }
  return apiClient.get(`/map/markers?${params}`);
}

export const feedsDomain: Partial<AppAdapter> = {
  getPublicFeed: fetchPublicFeed,
  getPublicFeedPage: fetchPublicFeedPage,
  getHomeFeed: fetchHomeFeed,
  getHomeFeedPage: fetchHomeFeedPage,
  getRegionFeed: fetchRegionFeed,
  getRegionFeedPage: fetchRegionFeedPage,
  getPersonalFeed: fetchPersonalFeed,
  getPersonalFeedPage: fetchPersonalFeedPage,
  getScopeFeedPage: fetchScopeFeedPage,
  getUserFeedPage: fetchUserFeedPage,
  getMapMarkers: fetchMapMarkers as AppAdapter['getMapMarkers']
};
