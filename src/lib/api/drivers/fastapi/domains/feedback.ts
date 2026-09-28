import { apiClient, extractErrorMessage } from '../client';
import { registerEntityType } from '../typeRegistry';
import type {
  CreateFeedbackInput,
  CreateFeedbackResult,
  FeedbackFilter,
  FeedbackItem,
  FeedbackPageResult,
  FeedbackSort,
} from '$lib/types/feedback';
import type { VoteDirection } from '$lib/types/feed';

interface BackendFeedbackItem {
  id: string;
  kind: 'bug' | 'suggestion';
  title: string;
  description: string;
  author_id: string | null;
  author_username: string;
  vote_count: number;
  upvote_count: number;
  downvote_count: number;
  approval_percent: number;
  active_vote: 'up' | 'down' | 'neutral' | number;
  created_at: string;
  updated_at: string;
}

interface BackendFeedbackPage {
  items: BackendFeedbackItem[];
  filters?: {
    filter?: FeedbackFilter;
    sort?: FeedbackSort;
  };
  page?: {
    limit?: number;
    offset?: number;
    count?: number;
  };
}

function mapActiveVote(value: BackendFeedbackItem['active_vote']): VoteDirection {
  if (value === 'up' || value === 1) return 1;
  if (value === 'down' || value === -1) return -1;
  return 0;
}

function mapFeedbackItem(item: BackendFeedbackItem): FeedbackItem {
  registerEntityType(item.id, 'platform_feedback');
  return {
    id: item.id,
    kind: item.kind,
    title: item.title,
    description: item.description,
    authorId: item.author_id,
    authorUsername: item.author_username ?? '',
    voteCount: item.vote_count ?? 0,
    upvoteCount: item.upvote_count ?? 0,
    downvoteCount: item.downvote_count ?? 0,
    approvalPercent: item.approval_percent ?? 0,
    activeVote: mapActiveVote(item.active_vote),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

export async function fetchFeedbackPage(options: {
  filter?: FeedbackFilter;
  sort?: FeedbackSort;
  limit?: number;
  offset?: number;
} = {}): Promise<FeedbackPageResult> {
  const params = new URLSearchParams();
  if (options.filter) params.set('filter', options.filter);
  if (options.sort) params.set('sort', options.sort);
  if (typeof options.limit === 'number') params.set('limit', String(options.limit));
  if (typeof options.offset === 'number') params.set('offset', String(options.offset));
  const suffix = params.toString();
  const res = await apiClient.get<BackendFeedbackPage>(`/feedback${suffix ? `?${suffix}` : ''}`);
  return {
    items: (res.items ?? []).map(mapFeedbackItem),
    filter: res.filters?.filter ?? options.filter ?? 'all',
    sort: res.filters?.sort ?? options.sort ?? 'trending',
    limit: res.page?.limit ?? options.limit ?? 50,
    offset: res.page?.offset ?? options.offset ?? 0,
    count: res.page?.count ?? res.items?.length ?? 0,
  };
}

export async function fetchFeedbackItem(id: string): Promise<FeedbackItem | null> {
  try {
    const res = await apiClient.get<{ feedback: BackendFeedbackItem }>(`/feedback/${id}`);
    return mapFeedbackItem(res.feedback);
  } catch (err) {
    if ((err as { status?: number }).status === 404) {
      return null;
    }
    throw err;
  }
}

export async function fetchCreateFeedback(
  input: CreateFeedbackInput
): Promise<CreateFeedbackResult> {
  try {
    const res = await apiClient.post<{ feedback: BackendFeedbackItem }>('/feedback', {
      kind: input.kind,
      title: input.title,
      description: input.description,
    });
    return {
      ok: true,
      item: mapFeedbackItem(res.feedback),
    };
  } catch (err) {
    return {
      ok: false,
      error: extractErrorMessage(err, 'Could not submit feedback'),
    };
  }
}
