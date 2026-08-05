import { refreshSession } from '$lib/api/drivers/fastapi/client';
import {
  clearAuthenticatedSession,
  getCsrfToken,
  hasAuthenticatedSession,
  hasRememberedAuthCookie,
  shouldAttemptSessionRefresh
} from '$lib/api/drivers/fastapi/auth';
import {
  tryRestoreAuthenticatedSession as tryRestoreOnce,
  type SessionRestoreResult
} from '$lib/api/drivers/fastapi/sessionRecovery';

export {
  clearAuthenticatedSession,
  getCsrfToken,
  hasAuthenticatedSession,
  hasRememberedAuthCookie,
  shouldAttemptSessionRefresh
};

export type { SessionRestoreResult };

/** Cold-start silent refresh using the active API driver. */
export async function tryRestoreAuthenticatedSession(): Promise<SessionRestoreResult> {
  return tryRestoreOnce(refreshSession);
}
