import '$lib/api/drivers';
import {
  getSessionTransport,
  type SessionRestoreResult
} from '$lib/services/sessionTransport';

export type { SessionRestoreResult };

export function clearAuthenticatedSession(): void {
  getSessionTransport().clearAuthenticatedSession();
}

export function getCsrfToken(): string | null {
  return getSessionTransport().getCsrfToken();
}

export function hasAuthenticatedSession(): boolean {
  return getSessionTransport().hasAuthenticatedSession();
}

export function hasRememberedAuthCookie(): boolean {
  return getSessionTransport().hasRememberedAuthCookie();
}

export function shouldAttemptSessionRefresh(): boolean {
  return getSessionTransport().shouldAttemptSessionRefresh();
}

/** Cold-start silent refresh using the active session transport. */
export async function tryRestoreAuthenticatedSession(): Promise<SessionRestoreResult> {
  return getSessionTransport().tryRestoreAuthenticatedSession();
}
