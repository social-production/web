import { page } from '$app/stores';
import { get } from 'svelte/store';
import { currentAdapter } from '$lib/services/adapters';
import type { CreateFeedbackInput } from '$lib/types/feedback';
import { requireViewer } from '$lib/utils/requireViewer';

export function createFeedback(input: CreateFeedbackInput) {
  const viewer = get(page).data.bootstrap?.viewer ?? null;
  if (!requireViewer(viewer, 'Sign in to submit feedback.')) {
    return Promise.resolve({ ok: false, error: 'Sign in to submit feedback.' });
  }
  return currentAdapter.createFeedback(input);
}
