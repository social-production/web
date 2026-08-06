/**
 * Supabase `feedback` domain scaffold.
 * Responsibility: feedback submission.
 * Replace stubs with real `web-supabase` calls mapped to `$lib/types/*`.
 */
import type { AppAdapter } from '$lib/services/adapters/types';
import { stubMethod } from '../../scaffold';

const provider = 'supabase' as const;
const domain = 'feedback' as const;

export const feedbackDomain: Partial<AppAdapter> = {
  submitFeedback: stubMethod(provider, domain, 'submitFeedback') as AppAdapter['submitFeedback'],
};

