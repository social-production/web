import { apiClient } from '../client';
import type { AppAdapter } from '$lib/services/adapters/types';
import type { FeedbackSubmitInput, FeedbackSubmitResult } from '$lib/types/feedback';

export async function fetchSubmitFeedback(input: FeedbackSubmitInput): Promise<FeedbackSubmitResult> {
  const res = await apiClient.post<{
    issueNumber?: number;
    issueUrl?: string;
    issue_number?: number;
    issue_url?: string;
  }>('/feedback', {
    category: input.category,
    title: input.title,
    description: input.description,
    pageUrl: input.pageUrl ?? null,
    page_url: input.pageUrl ?? null,
    website: ''
  });
  return {
    issueNumber: res.issueNumber ?? res.issue_number ?? 0,
    issueUrl: res.issueUrl ?? res.issue_url ?? ''
  };
}

export const feedbackDomain: Partial<AppAdapter> = {
  submitFeedback: fetchSubmitFeedback
};
