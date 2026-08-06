/**
 * Holochain `feedback` domain scaffold.
 * Responsibility: feedback submission.
 * Replace stubs with real `web-holochain` calls mapped to `$lib/types/*`.
 */
import type { AppAdapter } from '$lib/services/adapters/types';
import { stubMethod } from '../../scaffold';

const provider = 'holochain' as const;
const domain = 'feedback' as const;

export const feedbackDomain: Partial<AppAdapter> = {
  submitFeedback: stubMethod(provider, domain, 'submitFeedback') as AppAdapter['submitFeedback'],
};

