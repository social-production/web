import type { SessionTransport } from '$lib/services/sessionTransport';
import {
  clearAuthenticatedSession,
  getCsrfToken,
  hasAuthenticatedSession,
  hasRememberedAuthCookie,
  markAuthenticatedSession,
  shouldAttemptSessionRefresh
} from './authSession';
import { refreshSession } from './client';

export function createSupabaseSessionTransport(): SessionTransport {
  return {
    refreshSession,
    markAuthenticatedSession,
    clearAuthenticatedSession,
    hasAuthenticatedSession,
    hasRememberedAuthCookie,
    shouldAttemptSessionRefresh,
    getCsrfToken,
    async tryRestoreAuthenticatedSession() {
      if (!hasRememberedAuthCookie()) {
        return 'skipped';
      }
      try {
        const restored = await refreshSession();
        if (restored) {
          markAuthenticatedSession();
          return 'restored';
        }
        clearAuthenticatedSession();
        return 'auth-failed';
      } catch {
        return 'transient-failure';
      }
    }
  };
}
