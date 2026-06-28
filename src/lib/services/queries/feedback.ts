import type { FeedbackCategory, FeedbackSubmitInput, FeedbackSubmitResult } from '$lib/api/drivers/fastapi/domains/feedback';
import { currentAdapter } from '$lib/services/adapters';

export function submitFeedback(input: FeedbackSubmitInput) {
  return currentAdapter.submitFeedback(input);
}

export type { FeedbackCategory, FeedbackSubmitInput, FeedbackSubmitResult };
