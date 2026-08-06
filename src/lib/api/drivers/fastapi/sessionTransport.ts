import {
  clearAuthenticatedSession,
  getCsrfToken,
  hasAuthenticatedSession,
  hasRememberedAuthCookie,
  markAuthenticatedSession,
  shouldAttemptSessionRefresh
} from './auth';
import { refreshSession } from './client';
import {
  tryRestoreAuthenticatedSession as tryRestoreOnce,
  type SessionRestoreResult
} from './sessionRecovery';
import type { SessionTransport } from '$lib/services/sessionTransport';

export function createFastApiSessionTransport(): SessionTransport {
  return {
    refreshSession,
    markAuthenticatedSession,
    clearAuthenticatedSession,
    hasAuthenticatedSession,
    hasRememberedAuthCookie,
    shouldAttemptSessionRefresh,
    getCsrfToken,
    tryRestoreAuthenticatedSession(): Promise<SessionRestoreResult> {
      return tryRestoreOnce(refreshSession);
    }
  };
}
