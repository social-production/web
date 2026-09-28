import { currentAdapter } from '$lib/services/adapters';
import type { FeedbackFilter, FeedbackSort } from '$lib/types/feedback';

export function getFeedbackPage(options?: {
  filter?: FeedbackFilter;
  sort?: FeedbackSort;
  limit?: number;
  offset?: number;
}) {
  return currentAdapter.getFeedbackPage(options);
}

export function getFeedbackItem(id: string) {
  return currentAdapter.getFeedbackItem(id);
}
