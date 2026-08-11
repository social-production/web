import { apiClient } from '../client';
import type { AppAdapter } from '$lib/services/adapters/types';
import type {
  ContentReportSummary,
  ContentReportVote,
  DetailComment,
  PostPageData,
  ThreadPageData
} from '$lib/types/detail';
import type { CreatePostInput, CreateResult, CreateThreadInput, VoteDirection } from '$lib/types/feed';
import type { CommentSubjectRef, ReportTargetRef, VoteTargetRef } from '$lib/types/governance';

export async function fetchThread(slug: string): Promise<ThreadPageData | null> {
  try {
    return await apiClient.get<ThreadPageData>(`/content/threads/${encodeURIComponent(slug)}`);
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export async function fetchPost(id: string): Promise<PostPageData | null> {
  try {
    return await apiClient.get<PostPageData>(`/content/posts/${encodeURIComponent(id)}`);
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export async function fetchCreateThread(input: CreateThreadInput): Promise<CreateResult> {
  return apiClient.post<CreateResult>('/content/threads', input);
}

export async function fetchCreatePost(input: CreatePostInput): Promise<CreateResult> {
  return apiClient.post<CreateResult>('/content/posts', input);
}

export async function fetchSetVote(target: VoteTargetRef, vote: VoteDirection): Promise<void> {
  await apiClient.post('/governance/votes', { target, vote });
}

export async function fetchComments(
  subjectType: string,
  subjectId: string
): Promise<DetailComment[]> {
  const params = new URLSearchParams({
    subject_type: subjectType,
    subject_id: subjectId
  });
  const res = await apiClient.get<{ items?: DetailComment[] }>(`/governance/comments?${params}`);
  return res.items ?? [];
}

export async function fetchAddComment(
  subject: CommentSubjectRef,
  body: string,
  parentId?: string
): Promise<void> {
  await apiClient.post('/governance/comments', { subject, body, parentId });
}

export async function fetchSubmitReport(
  subjectId: string,
  target: ReportTargetRef,
  reason: string,
  details: string
): Promise<ContentReportSummary | null | void> {
  const res = await apiClient.post<{ report?: ContentReportSummary | null }>(
    '/governance/reports',
    { subjectId, target, reason, details }
  );
  return res.report ?? null;
}

export async function fetchSetReportVote(
  targetId: string,
  vote: ContentReportVote
): Promise<ContentReportSummary | null | void> {
  const res = await apiClient.post<{ report?: ContentReportSummary | null }>(
    `/governance/reports/${encodeURIComponent(targetId)}/vote`,
    { vote }
  );
  return res.report ?? null;
}

export const contentDomain: Partial<AppAdapter> = {
  getThread: fetchThread,
  getPost: fetchPost,
  createThread: fetchCreateThread,
  createPost: fetchCreatePost,
  setVote: fetchSetVote,
  getComments: fetchComments,
  addComment: fetchAddComment,
  submitReport: fetchSubmitReport,
  setReportVote: fetchSetReportVote
};
