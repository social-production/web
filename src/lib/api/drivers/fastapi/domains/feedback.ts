import { apiClient } from '../client';

export type FeedbackCategory = 'bug' | 'idea';

export interface FeedbackSubmitInput {
  category: FeedbackCategory;
  title: string;
  description: string;
  pageUrl?: string;
}

export interface FeedbackSubmitResult {
  issueNumber: number;
  issueUrl: string;
}

export async function fetchSubmitFeedback(input: FeedbackSubmitInput): Promise<FeedbackSubmitResult> {
  const res = await apiClient.post<{ issue_number: number; issue_url: string }>('/feedback', {
    category: input.category,
    title: input.title,
    description: input.description,
    page_url: input.pageUrl ?? null,
    website: ''
  });

  return {
    issueNumber: res.issue_number,
    issueUrl: res.issue_url
  };
}
