import { apiClient } from '../client';
import { registerEntityType } from '../typeRegistry';
import {
  DEFAULT_FEED_PAGE_SIZE,
  toFeedPageResult,
  type FeedPageResult
} from '$lib/features/feed/feedPagination';
import { buildFeedQueryString, normalizeFeedFilter, normalizeFeedSort, normalizeFeedWindow } from '$lib/utils/feedQuery';
import { feedModerationFields } from '$lib/utils/moderation';
import type {
  HelpRequestRoleInput,
  PersonalFeedItem,
  PublicFeedItem,
  SubjectKind,
  VoteDirection
} from '$lib/types/feed';

export type { FeedPageResult };

interface BackendTagRef {
  slug: string;
  label: string;
  kind: 'channel' | 'community';
}

interface BackendHelpRequestRole {
  title: string;
  description?: string;
  slots: number;
}

interface BackendFeedItem {
  id: string;
  entity_type: string;
  slug: string | null;
  title: string;
  body: string;
  audience?: 'followers' | 'public' | 'thread' | 'post' | 'project' | 'event' | 'help_request' | null;
  author_id: string | null;
  author_username: string | null;
  author_profile_image_url?: string | null;
  signal_count: number;
  support_count?: number;
  oppose_count?: number;
  favorability?: number | null;
  viewer_signal?: 'demand' | 'opposition' | null;
  vote_count: number;
  comment_count: number;
  member_count: number;
  last_activity_at: string;
  created_at: string;
  last_update_at?: string | null;
  latest_update_body?: string | null;
  project_mode: string | null;
  project_subtype: string | null;
  stage_label: string | null;
  current_phase_id?: string | null;
  location_label: string | null;
  is_private: boolean;
  is_closed?: boolean;
  scheduled_at: string | null;
  time_label: string | null;
  active_vote?: number;
  channel_tags: BackendTagRef[];
  community_tags: BackendTagRef[];
  feed_source?: 'following' | 'discovery';
  roles?: BackendHelpRequestRole[];
  signup_count?: number;
  slots_needed?: number;
  parent_title?: string | null;
  ends_at?: string | null;
  distance_km?: number | null;
  moderation_state?: string;
  moderationState?: string;
  moderation_reason?: string | null;
  is_under_review?: boolean;
  isUnderReview?: boolean;
  has_active_report?: boolean;
  hasActiveReport?: boolean;
  report?: unknown;
}

interface BackendFeedResponse {
  total: number;
  sort: string;
  limit: number;
  offset: number;
  items: BackendFeedItem[];
}

export interface PersonalFeedQuery {
  scope?: 'following' | 'popular';
  sort?: 'trending' | 'recent' | 'popular';
  window?: 'today' | 'week' | 'month' | 'all' | string;
  filter?: 'all' | 'projects' | 'threads' | 'events' | 'help_requests' | string;
  limit?: number;
  offset?: number;
}

export interface PublicFeedQuery {
  sort?: 'trending' | 'recent' | 'popular';
  window?: 'today' | 'week' | 'month' | 'all' | string;
  filter?: 'all' | 'projects' | 'threads' | 'events' | 'help_requests' | string;
  limit?: number;
  offset?: number;
}

export interface RegionFeedQuery extends PublicFeedQuery {
  lat: number;
  lon: number;
  radiusKm?: number;
  includeOnline?: boolean;
  tz?: string | null;
}

export interface ScopeFeedQuery extends PublicFeedQuery {
  kind: 'channel' | 'community';
  slug: string;
}

export interface UserFeedQuery {
  username: string;
  sort?: 'trending' | 'recent' | 'popular' | 'oldest' | 'top';
  window?: 'today' | 'week' | 'month' | 'all' | string;
  filter?: 'all' | 'projects' | 'threads' | 'events' | 'help_requests' | string;
  limit?: number;
  offset?: number;
}

export interface MapMarkerQuery {
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
}

export interface MapMarkerItem {
  id: string;
  entityType: 'event' | 'project' | 'help_request' | 'activity';
  activitySource?: 'event' | 'project' | null;
  projectMode?: string | null;
  slug: string | null;
  title: string;
  parentId?: string | null;
  parentTitle?: string | null;
  subtitle?: string | null;
  href: string;
  latitude: number;
  longitude: number;
  precision: string;
  displayLabel: string;
  distanceKm: number;
  scheduledAt?: string | null;
  endsAt?: string | null;
  signupCount?: number | null;
  slotsNeeded?: number | null;
  committedCount?: number | null;
  minimumParticipants?: number | null;
}

function signalFields(item: BackendFeedItem) {
  return {
    supportCount: item.support_count ?? 0,
    opposeCount: item.oppose_count ?? 0,
    favorability: item.favorability ?? null,
    viewerSignal: (item.viewer_signal ?? null) as 'demand' | 'opposition' | null,
    isClosed: Boolean(item.is_closed) || item.current_phase_id === 'closed' || item.stage_label === 'Closed'
  };
}

function mapHelpRequestRoles(roles: BackendHelpRequestRole[] | undefined): HelpRequestRoleInput[] {
  return (roles ?? []).map((role) => ({
    title: role.title,
    description: role.description ?? '',
    slots: role.slots
  }));
}

export function registerFeedEntity(item: BackendFeedItem): void {
  if (
    item.entity_type === 'project' ||
    item.entity_type === 'thread' ||
    item.entity_type === 'event' ||
    item.entity_type === 'post' ||
    item.entity_type === 'help_request'
  ) {
    registerEntityType(item.id, item.entity_type);
  }
}

function feedSource(item: BackendFeedItem): 'following' | 'discovery' | undefined {
  return item.feed_source === 'discovery' ? 'discovery' : item.feed_source === 'following' ? 'following' : undefined;
}

function mapCommentSubjectKind(subjectType: string | null | undefined): SubjectKind {
  if (subjectType === 'help_request') return 'help-request';
  if (subjectType === 'thread' || subjectType === 'post' || subjectType === 'project' || subjectType === 'event') {
    return subjectType;
  }
  return 'thread';
}

function buildCommentActivityHref(item: BackendFeedItem): string {
  const subjectType = item.audience ?? item.project_mode ?? 'thread';
  const subjectId = item.project_subtype ?? item.id;
  const commentId = item.id;

  switch (subjectType) {
    case 'thread':
      return item.slug ? `/threads/${item.slug}?comment=${commentId}` : '#';
    case 'post':
      return `/posts/${subjectId}?comment=${commentId}`;
    case 'project':
      return item.slug ? `/projects/${item.slug}?tab=chat&comment=${commentId}` : '#';
    case 'event':
      return item.slug ? `/events/${item.slug}?tab=chat&comment=${commentId}` : '#';
    case 'help_request':
      return `/help-requests/${subjectId}?tab=chat&comment=${commentId}`;
    default:
      return '#';
  }
}

export function mapPublicItem(item: BackendFeedItem): PublicFeedItem | null {
  const channelTags = item.channel_tags ?? [];
  const communityTags = item.community_tags ?? [];
  const moderation = feedModerationFields(item);

  if (item.entity_type === 'help_request') {
    return {
      kind: 'help-request',
      id: item.id,
      href: `/help-requests/${item.id}`,
      createdAt: item.created_at,
      title: item.title,
      body: item.body,
      authorUsername: item.author_username ?? '',
      locationLabel: item.location_label ?? '',
      scheduleLabel: item.time_label ?? '',
      neededAt: item.scheduled_at ?? undefined,
      roles: mapHelpRequestRoles(item.roles),
      channelTags,
      communityTags,
      voteCount: item.vote_count,
      activeVote: (item.active_vote ?? 0) as VoteDirection,
      commentCount: item.comment_count,
      lastActivityAt: item.last_activity_at,
      signupCount: item.signup_count ?? 0,
      slotsNeeded: item.slots_needed ?? 0,
      ...moderation
    };
  }

  if (item.entity_type === 'project_activity' && item.slug) {
    return {
      kind: 'project-activity',
      id: item.id,
      href: `/projects/${item.slug}`,
      createdAt: item.created_at,
      title: item.title,
      parentTitle: item.parent_title ?? item.body ?? '',
      projectMode: (item.project_mode ?? 'productive') as never,
      scheduledAt: item.scheduled_at ?? '',
      endsAt: item.ends_at ?? null,
      locationLabel: item.location_label ?? '',
      distanceKm: item.distance_km ?? 0,
      lastActivityAt: item.last_activity_at
    };
  }

  if (item.entity_type === 'project' && item.slug) {
    return {
      kind: 'project',
      id: item.id,
      slug: item.slug,
      href: `/projects/${item.slug}`,
      createdAt: item.created_at,
      title: item.title,
      authorUsername: item.author_username ?? '',
      projectMode: (item.project_mode ?? 'productive') as never,
      projectSubtype: (item.project_subtype as never) ?? null,
      summary: item.body,
      latestDescription: item.latest_update_body ?? undefined,
      latestUpdateAt: item.last_update_at ?? undefined,
      channelTags,
      communityTags,
      stage: item.stage_label ?? '',
      locationLabel: item.location_label ?? '',
      voteCount: item.vote_count,
      activeVote: (item.active_vote ?? 0) as VoteDirection,
      signalCount: item.signal_count,
      ...signalFields(item),
      commentCount: item.comment_count,
      memberCount: item.member_count,
      lastActivityAt: item.last_activity_at,
      ...moderation
    };
  }

  if (item.entity_type === 'thread' && item.slug) {
    return {
      kind: 'thread',
      id: item.id,
      slug: item.slug,
      href: `/threads/${item.slug}`,
      createdAt: item.created_at,
      title: item.title,
      body: item.body,
      authorUsername: item.author_username ?? '',
      channelTags,
      communityTags,
      voteCount: item.vote_count,
      activeVote: (item.active_vote ?? 0) as VoteDirection,
      commentCount: item.comment_count,
      lastActivityAt: item.last_activity_at,
      ...moderation
    };
  }

  if (item.entity_type === 'event' && item.slug) {
    return {
      kind: 'event',
      id: item.id,
      slug: item.slug,
      href: `/events/${item.slug}`,
      createdAt: item.created_at,
      title: item.title,
      description: item.body,
      isPrivate: item.is_private,
      stage: item.stage_label ?? '',
      scheduledAt: item.scheduled_at ?? undefined,
      channelTags,
      communityTags,
      createdByUsername: item.author_username ?? '',
      timeLabel: item.time_label ?? '',
      locationLabel: item.location_label ?? '',
      voteCount: item.vote_count,
      activeVote: (item.active_vote ?? 0) as VoteDirection,
      ...signalFields(item),
      commentCount: item.comment_count,
      memberCount: item.member_count,
      lastActivityAt: item.last_activity_at,
      latestUpdateBody: item.latest_update_body ?? undefined,
      latestUpdateAt: item.last_update_at ?? undefined,
      ...moderation
    };
  }

  return null;
}

export function mapPersonalItem(item: BackendFeedItem): PersonalFeedItem | null {
  const author = {
    id: item.author_id ?? '',
    username: item.author_username ?? '',
    profileImageUrl: item.author_profile_image_url ?? undefined
  };
  const channelTags = item.channel_tags ?? [];
  const communityTags = item.community_tags ?? [];
  const source = feedSource(item);
  const moderation = feedModerationFields(item);

  if (item.entity_type === 'comment_activity') {
    registerEntityType(item.id, 'comment');
    return {
      kind: 'comment-activity',
      id: item.id,
      href: buildCommentActivityHref(item),
      author,
      feedSource: source,
      subjectKind: mapCommentSubjectKind(item.audience ?? item.project_mode),
      subjectTitle: item.title,
      commentExcerpt: item.body,
      voteTargetId: item.id,
      voteCount: item.vote_count,
      activeVote: (item.active_vote ?? 0) as VoteDirection,
      commentCount: item.comment_count,
      createdAt: item.created_at,
      ...moderation
    };
  }

  if (item.entity_type === 'help_request') {
    return {
      kind: 'help-request',
      id: item.id,
      href: `/help-requests/${item.id}`,
      author,
      feedSource: source,
      title: item.title,
      body: item.body,
      locationLabel: item.location_label ?? '',
      scheduleLabel: item.time_label ?? '',
      neededAt: item.scheduled_at ?? undefined,
      roles: mapHelpRequestRoles(item.roles),
      channelTags,
      communityTags,
      voteCount: item.vote_count,
      activeVote: (item.active_vote ?? 0) as VoteDirection,
      commentCount: item.comment_count,
      signupCount: item.signup_count ?? 0,
      slotsNeeded: item.slots_needed ?? 0,
      createdAt: item.created_at,
      ...moderation
    };
  }

  if (item.entity_type === 'post') {
    return {
      kind: 'post',
      id: item.id,
      href: `/posts/${item.id}`,
      author,
      feedSource: source,
      voteTargetId: item.id,
      body: item.body,
      linkedSubjects: [],
      voteCount: item.vote_count,
      activeVote: (item.active_vote ?? 0) as VoteDirection,
      commentCount: item.comment_count,
      createdAt: item.created_at,
      audience: item.audience === 'followers' ? 'followers' : 'public',
      ...moderation
    };
  }

  const subjectKindMap: Record<string, 'project' | 'thread' | 'event'> = {
    project: 'project',
    thread: 'thread',
    event: 'event'
  };
  const subjectKind = subjectKindMap[item.entity_type];
  if (!subjectKind || !item.slug) return null;

  const actionLabelMap: Record<string, string> = {
    project: 'created a project',
    thread: 'started a thread',
    event: 'created an event'
  };

  return {
    kind: 'activity',
    id: item.id,
    subjectId: item.id,
    href: `/${item.entity_type}s/${item.slug}`,
    author,
    feedSource: source,
    actionLabel: actionLabelMap[item.entity_type] ?? 'posted',
    subjectKind,
    subjectProjectMode: item.project_mode as never ?? undefined,
    title: item.title,
    body: item.body,
    meta: item.stage_label ?? item.time_label ?? '',
    voteCount: item.vote_count,
    activeVote: (item.active_vote ?? 0) as VoteDirection,
    ...signalFields(item),
    commentCount: item.comment_count,
    createdAt: item.created_at,
    channelTags,
    communityTags,
    subjectSlug: item.slug,
    ...moderation
  };
}

function mapFeedItems(
  res: BackendFeedResponse,
  mapper: (item: BackendFeedItem) => PublicFeedItem | PersonalFeedItem | null
) {
  return res.items.flatMap((item) => {
    const mapped = mapper(item);
    if (mapped) registerFeedEntity(item);
    return mapped ? [mapped] : [];
  });
}

function mapFeedPage(
  res: BackendFeedResponse,
  mapper: (item: BackendFeedItem) => PublicFeedItem | PersonalFeedItem | null
) {
  const items = mapFeedItems(res, mapper);
  return toFeedPageResult(items, {
    limit: res.limit || DEFAULT_FEED_PAGE_SIZE,
    offset: res.offset || 0,
    rawCount: res.items.length
  });
}

function withDefaultPaging<T extends { limit?: number; offset?: number }>(query: T): T & {
  limit: number;
  offset: number;
} {
  return {
    ...query,
    limit: query.limit ?? DEFAULT_FEED_PAGE_SIZE,
    offset: query.offset ?? 0
  };
}

export async function fetchPublicFeedPage(
  query: PublicFeedQuery = {}
): Promise<FeedPageResult<PublicFeedItem>> {
  const paged = withDefaultPaging(query);
  const res = await apiClient.get<BackendFeedResponse>(`/feeds/public${buildFeedQueryString(paged)}`);
  return mapFeedPage(res, mapPublicItem) as FeedPageResult<PublicFeedItem>;
}

export async function fetchPublicFeed(query: PublicFeedQuery = {}): Promise<PublicFeedItem[]> {
  return (await fetchPublicFeedPage(query)).items;
}

export async function fetchHomeFeedPage(
  query: PublicFeedQuery = {}
): Promise<FeedPageResult<PublicFeedItem>> {
  const paged = withDefaultPaging(query);
  const res = await apiClient.get<BackendFeedResponse>(`/feeds/home${buildFeedQueryString(paged)}`);
  return mapFeedPage(res, mapPublicItem) as FeedPageResult<PublicFeedItem>;
}

export async function fetchHomeFeed(query: PublicFeedQuery = {}): Promise<PublicFeedItem[]> {
  return (await fetchHomeFeedPage(query)).items;
}

export async function fetchRegionFeedPage(query: RegionFeedQuery): Promise<FeedPageResult<PublicFeedItem>> {
  const paged = withDefaultPaging(query);
  const params = new URLSearchParams();
  params.set('lat', String(paged.lat));
  params.set('lon', String(paged.lon));
  params.set('radius_km', String(paged.radiusKm ?? 25));
  params.set('limit', String(paged.limit));
  params.set('offset', String(paged.offset));
  if (paged.sort) params.set('sort', normalizeFeedSort(paged.sort));
  if (paged.window) params.set('window', normalizeFeedWindow(paged.window));
  if (paged.filter) params.set('filter', normalizeFeedFilter(paged.filter));
  if (paged.includeOnline) params.set('include_online', 'true');
  if (paged.tz) params.set('tz', paged.tz);
  const res = await apiClient.get<BackendFeedResponse>(`/feeds/region?${params.toString()}`);
  return mapFeedPage(res, mapPublicItem) as FeedPageResult<PublicFeedItem>;
}

export async function fetchRegionFeed(query: RegionFeedQuery): Promise<PublicFeedItem[]> {
  return (await fetchRegionFeedPage(query)).items;
}

export async function fetchMapMarkers(query: MapMarkerQuery): Promise<MapMarkerItem[]> {
  const params = new URLSearchParams();
  params.set('lat', String(query.lat));
  params.set('lon', String(query.lon));
  params.set('radius_km', String(query.radiusKm ?? 25));
  if (query.window) params.set('window', normalizeFeedWindow(query.window));
  if (query.filter) params.set('filter', normalizeFeedFilter(query.filter));
  if (query.dateFrom) params.set('date_from', query.dateFrom);
  if (query.dateTo) params.set('date_to', query.dateTo);
  if (query.upcomingOnly !== undefined) params.set('upcoming_only', query.upcomingOnly ? 'true' : 'false');
  if (query.tz) params.set('tz', query.tz);
  if (query.distanceFromLat != null) params.set('distance_from_lat', String(query.distanceFromLat));
  if (query.distanceFromLon != null) params.set('distance_from_lon', String(query.distanceFromLon));
  const res = await apiClient.get<{
    items: Array<{
      id: string;
      entity_type: string;
      activity_source?: string | null;
      project_mode?: string | null;
      slug: string | null;
      title: string;
      parent_id?: string | null;
      parent_title?: string | null;
      subtitle?: string | null;
      href: string;
      latitude: number;
      longitude: number;
      precision: string;
      display_label: string;
      distance_km: number;
      scheduled_at?: string | null;
      ends_at?: string | null;
      signup_count?: number | null;
      slots_needed?: number | null;
      committed_count?: number | null;
      minimum_participants?: number | null;
    }>;
  }>(`/feeds/map-markers?${params.toString()}`);

  return (res.items ?? []).map((item) => ({
    id: item.id,
    entityType: (item.entity_type === 'project' ||
    item.entity_type === 'help_request' ||
    item.entity_type === 'activity'
      ? item.entity_type
      : 'event') as MapMarkerItem['entityType'],
    activitySource:
      item.activity_source === 'project' || item.activity_source === 'event'
        ? item.activity_source
        : null,
    projectMode: item.project_mode ?? null,
    slug: item.slug,
    title: item.title,
    parentId: item.parent_id ?? null,
    parentTitle: item.parent_title ?? null,
    subtitle: item.subtitle ?? null,
    href: item.href,
    latitude: item.latitude,
    longitude: item.longitude,
    precision: item.precision,
    displayLabel: item.display_label,
    distanceKm: item.distance_km,
    scheduledAt: item.scheduled_at ?? null,
    endsAt: item.ends_at ?? null,
    signupCount: item.signup_count ?? null,
    slotsNeeded: item.slots_needed ?? null,
    committedCount: item.committed_count ?? null,
    minimumParticipants: item.minimum_participants ?? null
  }));
}

export async function fetchPersonalFeedPage(
  query: PersonalFeedQuery = {}
): Promise<FeedPageResult<PersonalFeedItem>> {
  const paged = withDefaultPaging(query);
  const res = await apiClient.get<BackendFeedResponse>(
    `/feeds/personal${buildFeedQueryString({
      sort: paged.sort,
      window: paged.window,
      filter: paged.filter,
      scope: paged.scope,
      limit: paged.limit,
      offset: paged.offset
    })}`
  );
  return mapFeedPage(res, mapPersonalItem) as FeedPageResult<PersonalFeedItem>;
}

export async function fetchPersonalFeed(query: PersonalFeedQuery = {}): Promise<PersonalFeedItem[]> {
  return (await fetchPersonalFeedPage(query)).items;
}

export async function fetchScopeFeedPage(
  query: ScopeFeedQuery
): Promise<FeedPageResult<PublicFeedItem>> {
  const paged = withDefaultPaging(query);
  const params = new URLSearchParams();
  params.set('kind', paged.kind);
  params.set('slug', paged.slug);
  params.set('limit', String(paged.limit));
  params.set('offset', String(paged.offset));
  if (paged.sort) params.set('sort', normalizeFeedSort(paged.sort));
  if (paged.window) params.set('window', normalizeFeedWindow(paged.window));
  if (paged.filter) params.set('filter', normalizeFeedFilter(paged.filter));
  try {
    const res = await apiClient.get<BackendFeedResponse>(`/feeds/scope?${params.toString()}`);
    return mapFeedPage(res, mapPublicItem) as FeedPageResult<PublicFeedItem>;
  } catch (err) {
    if ((err as { status?: number }).status === 404) {
      return toFeedPageResult([], {
        limit: paged.limit,
        offset: paged.offset,
        rawCount: 0
      });
    }
    throw err;
  }
}

export async function fetchScopeFeed(
  kind: 'channel' | 'community',
  slug: string,
  query: PublicFeedQuery = {}
): Promise<PublicFeedItem[]> {
  return (await fetchScopeFeedPage({ ...query, kind, slug })).items;
}

export async function fetchUserFeedPage(query: UserFeedQuery): Promise<FeedPageResult<PersonalFeedItem>> {
  const paged = withDefaultPaging(query);
  const res = await apiClient.get<BackendFeedResponse>(
    `/feeds/user/${encodeURIComponent(paged.username)}${buildFeedQueryString({
      sort: paged.sort,
      window: paged.window,
      filter: paged.filter,
      limit: paged.limit,
      offset: paged.offset
    })}`
  );
  return mapFeedPage(res, mapPersonalItem) as FeedPageResult<PersonalFeedItem>;
}

export async function fetchUserFeed(
  username: string,
  query: Omit<UserFeedQuery, 'username'> = {}
): Promise<PersonalFeedItem[]> {
  return (await fetchUserFeedPage({ ...query, username })).items;
}
