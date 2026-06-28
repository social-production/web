import { apiClient } from '../client';
import { registerEntityType } from '../typeRegistry';
import type {
  HelpRequestRoleInput,
  PersonalFeedItem,
  PublicFeedItem,
  SubjectKind,
  VoteDirection
} from '$lib/types/feed';

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
  scheduled_at: string | null;
  time_label: string | null;
  active_vote?: number;
  channel_tags: BackendTagRef[];
  community_tags: BackendTagRef[];
  feed_source?: 'following' | 'discovery';
  roles?: BackendHelpRequestRole[];
  signup_count?: number;
  slots_needed?: number;
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
  sort?: 'popular' | 'recent';
}

function mapHelpRequestRoles(roles: BackendHelpRequestRole[] | undefined): HelpRequestRoleInput[] {
  return (roles ?? []).map((role) => ({
    title: role.title,
    description: role.description ?? '',
    slots: role.slots
  }));
}

function registerFeedEntity(item: BackendFeedItem): void {
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
      roles: mapHelpRequestRoles(item.roles),
      channelTags,
      communityTags,
      voteCount: item.vote_count,
      activeVote: (item.active_vote ?? 0) as VoteDirection,
      commentCount: item.comment_count,
      lastActivityAt: item.last_activity_at,
      signupCount: item.signup_count ?? 0,
      slotsNeeded: item.slots_needed ?? 0
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
      commentCount: item.comment_count,
      memberCount: item.member_count,
      lastActivityAt: item.last_activity_at
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
      lastActivityAt: item.last_activity_at
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
      commentCount: item.comment_count,
      memberCount: item.member_count,
      lastActivityAt: item.last_activity_at,
      latestUpdateBody: item.latest_update_body ?? undefined,
      latestUpdateAt: item.last_update_at ?? undefined
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

  if (item.entity_type === 'comment_activity') {
    return {
      kind: 'comment-activity',
      id: item.id,
      href: buildCommentActivityHref(item),
      author,
      feedSource: source,
      subjectKind: mapCommentSubjectKind(item.audience ?? item.project_mode),
      subjectTitle: item.title,
      commentExcerpt: item.body,
      createdAt: item.created_at
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
      roles: mapHelpRequestRoles(item.roles),
      channelTags,
      communityTags,
      voteCount: item.vote_count,
      activeVote: (item.active_vote ?? 0) as VoteDirection,
      commentCount: item.comment_count,
      signupCount: item.signup_count ?? 0,
      slotsNeeded: item.slots_needed ?? 0,
      createdAt: item.created_at
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
      audience: item.audience === 'followers' ? 'followers' : 'public'
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
    commentCount: item.comment_count,
    createdAt: item.created_at,
    channelTags,
    communityTags
  };
}

function mapFeedResponse(res: BackendFeedResponse, mapper: (item: BackendFeedItem) => PublicFeedItem | PersonalFeedItem | null) {
  return res.items.flatMap((item) => {
    const mapped = mapper(item);
    if (mapped) registerFeedEntity(item);
    return mapped ? [mapped] : [];
  });
}

export async function fetchPublicFeed(): Promise<PublicFeedItem[]> {
  const res = await apiClient.get<BackendFeedResponse>('/feeds/public');
  return mapFeedResponse(res, mapPublicItem) as PublicFeedItem[];
}

export async function fetchHomeFeed(): Promise<PublicFeedItem[]> {
  const res = await apiClient.get<BackendFeedResponse>('/feeds/home');
  return mapFeedResponse(res, mapPublicItem) as PublicFeedItem[];
}

export async function fetchPersonalFeed(query: PersonalFeedQuery = {}): Promise<PersonalFeedItem[]> {
  const params = new URLSearchParams();
  if (query.scope) params.set('scope', query.scope);
  if (query.sort) params.set('sort', query.sort);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const res = await apiClient.get<BackendFeedResponse>(`/feeds/personal${suffix}`);
  return mapFeedResponse(res, mapPersonalItem) as PersonalFeedItem[];
}
