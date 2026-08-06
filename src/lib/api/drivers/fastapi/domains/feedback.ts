import { apiClient } from '../client';
import type {
  FeedbackSubmitInput,
  FeedbackSubmitResult
} from '$lib/types/feedback';

export type { FeedbackCategory, FeedbackSubmitInput, FeedbackSubmitResult } from '$lib/types/feedback';

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
