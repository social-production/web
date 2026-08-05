import type { SignalToggleResult } from '$lib/types/feed';
import { setEventSignal } from '$lib/services/commands/events';
import { setProjectSignal } from '$lib/services/commands/projects';
import {
  applyOptimisticSignalToggle,
  applySignalToggleToEngagement,
  invalidateEntitySignalCache,
  type SignalEngagement
} from '$lib/utils/feedSignals';

export type SignalToggleCallbacks = {
  onOptimistic: (engagement: SignalEngagement) => void;
  onConfirmed: (engagement: SignalEngagement) => void;
  onRevert: (engagement: SignalEngagement) => void;
};

export type SignalToggleRunResult = {
  engagement: SignalEngagement;
  apiResult: SignalToggleResult | null;
};

/**
 * Vote-like contract: apply optimistic first, keep it if the API returns void,
 * apply confirmed counts when a SignalToggleResult is returned, revert only on throw.
 */
export async function runSignalToggle(
  current: SignalEngagement,
  signal: 'demand' | 'opposition',
  callApi: (signal: 'demand' | 'opposition') => Promise<SignalToggleResult | void>,
  callbacks: SignalToggleCallbacks
): Promise<SignalToggleRunResult> {
  const snapshot = current;
  const optimistic = applyOptimisticSignalToggle(snapshot, signal);
  callbacks.onOptimistic(optimistic);

  try {
    const result = await callApi(signal);
    if (result) {
      const confirmed = applySignalToggleToEngagement(result);
      callbacks.onConfirmed(confirmed);
      return { engagement: confirmed, apiResult: result };
    }

    // Void return (ThreadCard-style): keep optimistic UI.
    return { engagement: optimistic, apiResult: null };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('Signal toggle API failed', err);
    }
    callbacks.onRevert(snapshot);
    return { engagement: snapshot, apiResult: null };
  }
}

export function notifySignalChange(
  signalChange: ((result: SignalToggleResult) => void) | undefined,
  result: SignalToggleResult
): void {
  try {
    signalChange?.(result);
  } catch {
    /* parent summary updates must not break engagement UI */
  }
}

export async function submitFeedEntitySignal(
  kind: 'project' | 'event',
  slug: string,
  signal: 'demand' | 'opposition'
): Promise<SignalToggleResult> {
  const result =
    kind === 'project'
      ? await setProjectSignal(slug, signal)
      : await setEventSignal(slug, signal);
  void invalidateEntitySignalCache(kind, slug);
  return result;
}
