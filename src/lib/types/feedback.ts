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
