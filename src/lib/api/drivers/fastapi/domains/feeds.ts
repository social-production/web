import { apiClient } from '../client';
import { registerEntityType } from '../typeRegistry';
import type { PersonalFeedItem, PublicFeedItem } from '$lib/types/feed';

interface BackendTagRef {
  slug: string;
  label: string;
  kind: 'channel' | 'community';
}

interface BackendFeedItem {
  id: string;
  entity_type: string;
  slug: string | null;
  title: string;
  body: string;
  author_id: string | null;
  author_username: string | null;
  signal_count: number;
  vote_count: number;
  comment_count: number;
  member_count: number;
  going_count: number;
  last_activity_at: string;
  created_at: string;
  project_mode: string | null;
  project_subtype: string | null;
  stage_label: string | null;
  location_label: string | null;
  is_private: boolean;
  scheduled_at: string | null;
  time_label: string | null;
  channel_tags: BackendTagRef[];
  community_tags: BackendTagRef[];
}

interface BackendFeedResponse {
  total: number;
  sort: string;
  limit: number;
  offset: number;
  items: BackendFeedItem[];
}

function mapPublicItem(item: BackendFeedItem): PublicFeedItem | null {
  const channelTags = item.channel_tags ?? [];
  const communityTags = item.community_tags ?? [];

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
      channelTags,
      communityTags,
      stage: item.stage_label ?? '',
      locationLabel: item.location_label ?? '',
      voteCount: item.vote_count,
      activeVote: 0,
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
      activeVote: 0,
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
      scheduledAt: item.scheduled_at ?? undefined,
      channelTags,
      communityTags,
      createdByUsername: item.author_username ?? '',
      timeLabel: item.time_label ?? '',
      locationLabel: item.location_label ?? '',
      voteCount: item.vote_count,
      activeVote: 0,
      commentCount: item.comment_count,
      memberCount: item.member_count,
      lastActivityAt: item.last_activity_at
    };
  }

  return null;
}

function mapPersonalItem(item: BackendFeedItem): PersonalFeedItem | null {
  const author = {
    id: item.author_id ?? '',
    username: item.author_username ?? ''
  };
  const channelTags = item.channel_tags ?? [];
  const communityTags = item.community_tags ?? [];

  if (item.entity_type === 'post') {
    return {
      kind: 'post',
      id: item.id,
      href: `/posts/${item.id}`,
      author,
      feedSource: 'following',
      audience: 'public',
      voteTargetId: item.id,
      body: item.body,
      linkedSubjects: [],
      voteCount: item.vote_count,
      activeVote: 0,
      commentCount: item.comment_count,
      createdAt: item.created_at
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
    feedSource: 'following',
    actionLabel: actionLabelMap[item.entity_type] ?? 'posted',
    subjectKind,
    subjectProjectMode: item.project_mode as never ?? undefined,
    title: item.title,
    body: item.body,
    meta: item.stage_label ?? item.time_label ?? '',
    voteCount: item.vote_count,
    activeVote: 0,
    commentCount: item.comment_count,
    createdAt: item.created_at,
    channelTags,
    communityTags
  };
}

export async function fetchPublicFeed(): Promise<PublicFeedItem[]> {
  const res = await apiClient.get<BackendFeedResponse>('/feeds/public');
  return res.items.flatMap(item => {
    const mapped = mapPublicItem(item);
    if (mapped && item.entity_type === 'thread') {
      registerEntityType(item.id, 'thread');
    }
    return mapped ? [mapped] : [];
  });
}

export async function fetchPersonalFeed(): Promise<PersonalFeedItem[]> {
  const res = await apiClient.get<BackendFeedResponse>('/feeds/personal');
  return res.items.flatMap(item => {
    const mapped = mapPersonalItem(item);
    if (mapped && (item.entity_type === 'thread' || item.entity_type === 'post')) {
      registerEntityType(item.id, item.entity_type as never);
    }
    return mapped ? [mapped] : [];
  });
}
