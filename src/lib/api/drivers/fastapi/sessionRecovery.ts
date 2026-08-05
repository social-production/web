import {
  clearAuthenticatedSession,
  markAuthenticatedSession,
  shouldAttemptSessionRefresh
} from './auth';

export type RefreshSessionFn = () => Promise<boolean>;

export type SessionRestoreResult = 'restored' | 'skipped' | 'auth-failed' | 'transient-failure';

let coldStartRestoreAttempted = false;
let coldStartRestorePromise: Promise<SessionRestoreResult> | null = null;

/**
 * Attempt a single silent refresh before treating the viewer as anonymous.
 * Safe to call multiple times; only the first cold-start attempt runs.
 */
export async function tryRestoreAuthenticatedSession(
  refreshSession: RefreshSessionFn
): Promise<SessionRestoreResult> {
  if (typeof window === 'undefined') {
    return 'skipped';
  }

  if (coldStartRestoreAttempted) {
    return coldStartRestorePromise ?? Promise.resolve('skipped');
  }

  coldStartRestoreAttempted = true;

  if (!shouldAttemptSessionRefresh()) {
    coldStartRestorePromise = Promise.resolve('skipped');
    return 'skipped';
  }

  coldStartRestorePromise = (async () => {
    try {
      const restored = await refreshSession();
      if (restored) {
        markAuthenticatedSession();
        return 'restored' as const;
      }
      clearAuthenticatedSession();
      return 'auth-failed' as const;
    } catch {
      return 'transient-failure' as const;
    }
  })();

  return coldStartRestorePromise;
}

/** Test helper — reset module guards between isolated checks. */
export function resetSessionRecoveryStateForTests(): void {
  coldStartRestoreAttempted = false;
  coldStartRestorePromise = null;
}
