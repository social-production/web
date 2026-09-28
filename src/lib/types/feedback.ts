import type { VoteDirection } from '$lib/types/feed';

export type FeedbackKind = 'bug' | 'suggestion';
export type FeedbackFilter = 'all' | 'bugs' | 'suggestions';
export type FeedbackSort = 'trending' | 'recent';

export interface FeedbackItem {
  id: string;
  kind: FeedbackKind;
  title: string;
  description: string;
  authorId?: string | null;
  authorUsername: string;
  voteCount: number;
  upvoteCount: number;
  downvoteCount: number;
  approvalPercent: number;
  activeVote: VoteDirection;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackPageResult {
  items: FeedbackItem[];
  filter: FeedbackFilter;
  sort: FeedbackSort;
  limit: number;
  offset: number;
  count: number;
}

export interface CreateFeedbackInput {
  kind: FeedbackKind;
  title: string;
  description: string;
}

export interface CreateFeedbackResult {
  ok: boolean;
  item?: FeedbackItem;
  error?: string;
}
