import { apiClient, extractErrorMessage } from '../client';
import { registerEntityType, registerCommentIds, resolveEntityType, tryResolveEntityType } from '../typeRegistry';
import type { ContentReportSummary, ContentReportVote, PostPageData, ThreadPageData } from '$lib/types/detail';
import type { CreatePostInput, CreateResult, CreateThreadInput } from '$lib/types/feed';
import type { VoteDirection } from '$lib/types/feed';
import type { DetailComment } from '$lib/types/detail';
import {
  mapContentReport,
  mapModerationState
} from '$lib/utils/moderation';

const VOTE_DIR: Record<number, 'up' | 'down' | 'neutral'> = { 1: 'up', [-1]: 'down', 0: 'neutral' };

interface BackendThread {
  id: string; slug: string; title: string; body: string; author_id: string | null;
  author_username: string;
  vote_count: number; comment_count: number; last_activity_at: string; created_at: string;
  active_vote: number;
  channel_tags: Array<{ slug: string; label: string; kind: 'channel' | 'community' }>;
  community_tags: Array<{ slug: string; label: string; kind: 'channel' | 'community' }>;
  discussion: BackendComment[];
  report?: unknown;
  is_removed_by_report?: boolean;
  isRemovedByReport?: boolean;
  moderation_state?: string;
  moderationState?: string;
}

interface BackendPost {
  id: string; author_id: string | null; author_username: string;
  author_profile_image_url: string | null;
  body: string; audience: string;
  vote_count: number; comment_count: number; created_at: string;
  active_vote: number;
  discussion: BackendComment[];
  report?: unknown;
  is_removed_by_report?: boolean;
  isRemovedByReport?: boolean;
  moderation_state?: string;
  moderationState?: string;
}

export interface BackendComment {
  id: string;
  author_id: string | null;
  author_username: string;
  body: string;
  created_at: string;
  vote_count: number;
  active_vote?: number;
  parent_id?: string | null;
  replies?: BackendComment[];
  report?: unknown;
  moderation_state?: string;
  moderationState?: string;
}

function mapRemovedByReport(
  raw: { is_removed_by_report?: boolean; isRemovedByReport?: boolean; moderation_state?: string; moderationState?: string },
  report: ReturnType<typeof mapContentReport>
): boolean {
  const moderationState = mapModerationState(raw);
  return (
    Boolean(raw.isRemovedByReport ?? raw.is_removed_by_report) ||
    moderationState === 'removed' ||
    report?.resolution === 'removed'
  );
}

export function mapComment(c: BackendComment): DetailComment {
  registerEntityType(c.id, 'comment');
  const report = mapContentReport(c.report);
  const moderationState = mapModerationState(c);
  return {
    id: c.id,
    authorUsername: c.author_username ?? '',
    body: c.body,
    createdAt: c.created_at,
    voteCount: c.vote_count,
    activeVote: (c.active_vote ?? 0) as VoteDirection,
    report,
    ...(moderationState ? { moderationState } : {}),
    replies: (c.replies ?? []).map(mapComment),
  };
}

export async function fetchThread(slug: string): Promise<ThreadPageData | null> {
  try {
    const res = await apiClient.get<{ thread: BackendThread }>(`/content/threads/${slug}`);
    const t = res.thread;
    registerEntityType(t.id, 'thread');
    const discussion = (t.discussion ?? []).map(mapComment);
    registerCommentIds(discussion);
    const report = mapContentReport(t.report);
    const moderationState = mapModerationState(t);
    return {
      id: t.id, slug: t.slug, title: t.title, body: t.body,
      authorUsername: t.author_username,
      channelTags: t.channel_tags ?? [],
      communityTags: t.community_tags ?? [],
      voteCount: t.vote_count, activeVote: (t.active_vote ?? 0) as VoteDirection,
      commentCount: t.comment_count, lastActivityAt: t.last_activity_at,
      report,
      isRemovedByReport: mapRemovedByReport(t, report),
      ...(moderationState ? { moderationState } : {}),
      discussionNote: '',
      discussion,
    };
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export async function fetchPost(id: string): Promise<PostPageData | null> {
  try {
    const res = await apiClient.get<{ post: BackendPost }>(`/content/posts/${id}`);
    const p = res.post;
    registerEntityType(p.id, 'post');
    const discussion = (p.discussion ?? []).map(mapComment);
    registerCommentIds(discussion);
    const report = mapContentReport(p.report);
    const moderationState = mapModerationState(p);
    return {
      id: p.id,
      authorUsername: p.author_username,
      authorProfileImageUrl: p.author_profile_image_url ?? undefined,
      body: p.body,
      audience: p.audience as 'followers' | 'public',
      voteCount: p.vote_count, activeVote: (p.active_vote ?? 0) as VoteDirection,
      commentCount: p.comment_count, createdAt: p.created_at,
      report,
      isRemovedByReport: mapRemovedByReport(p, report),
      ...(moderationState ? { moderationState } : {}),
      discussionNote: '',
      discussion,
    };
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export async function fetchCreateThread(input: CreateThreadInput): Promise<CreateResult> {
  try {
    const res = await apiClient.post<{ thread: BackendThread }>('/content/threads', {
      title: input.title,
      body: input.body,
      channel_slugs: input.channelTags.map(t => t.slug),
      community_slugs: input.communityTags.map(t => t.slug),
    });
    return { ok: true, slug: res.thread.slug };
  } catch (err) {
    return { ok: false, error: extractErrorMessage(err, 'Could not create thread') };
  }
}

export async function fetchCreatePost(input: CreatePostInput): Promise<CreateResult> {
  try {
    const res = await apiClient.post<{ post: BackendPost }>('/content/posts', {
      body: input.body,
      audience: input.audience
    });
    return { ok: true, id: res.post.id };
  } catch (err) {
    return { ok: false, error: extractErrorMessage(err, 'Could not create post') };
  }
}

export async function fetchSetVote(targetId: string, vote: VoteDirection): Promise<void> {
  await apiClient.post('/governance/votes', {
    target_type: resolveEntityType(targetId),
    target_id: targetId,
    direction: VOTE_DIR[vote as number] ?? 'neutral'
  });
}

export type CommentSubjectType = 'thread' | 'post' | 'event' | 'project' | 'help_request';

export async function fetchAddComment(
  subjectId: string,
  body: string,
  parentId?: string,
  subjectType?: CommentSubjectType
): Promise<void> {
  await apiClient.post('/governance/comments', {
    subject_type: subjectType ?? resolveEntityType(subjectId),
    subject_id: subjectId,
    body,
    parent_id: parentId ?? null
  });
}

export async function fetchComments(subjectType: string, subjectId: string): Promise<BackendComment[]> {
  const res = await apiClient.get<{ items: BackendComment[] }>(
    `/governance/comments?subject_type=${subjectType}&subject_id=${subjectId}`
  );
  return res.items;
}

export type ReportTargetType =
  | 'thread'
  | 'post'
  | 'comment'
  | 'event'
  | 'project'
  | 'help_request'
  | 'message';

export async function fetchSubmitReport(
  subjectId: string,
  targetId: string,
  reason: string,
  details: string,
  targetType?: ReportTargetType
): Promise<ContentReportSummary | null> {
  const resolvedType =
    targetType ?? tryResolveEntityType(targetId) ?? resolveEntityType(subjectId);
  if (targetType) {
    registerEntityType(targetId, targetType);
  }
  const payload = await apiClient.post<{ report?: unknown }>('/governance/reports', {
    target_type: resolvedType,
    target_id: targetId,
    reason,
    description: details
  });
  return mapContentReport(payload?.report ?? payload);
}

export async function fetchSetReportVote(
  targetId: string,
  vote: ContentReportVote
): Promise<ContentReportSummary | null> {
  const payload = await apiClient.post<{ report?: unknown }>(
    `/governance/reports/${targetId}/vote`,
    { vote }
  );
  return mapContentReport(payload?.report ?? payload);
}
