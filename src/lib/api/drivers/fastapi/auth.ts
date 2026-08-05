const SESSION_KEY = 'sp_session';
const CSRF_COOKIE = 'sp_csrf';

/**
 * Ephemeral same-tab UX hint only. Never gate refresh/recovery on this —
 * `sessionStorage` is cleared when the browser closes, while httpOnly refresh
 * cookies (and the readable CSRF cookie) persist for the remembered session.
 */
export function markAuthenticatedSession(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, '1');
}

export function hasAuthenticatedSession(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

export function clearAuthenticatedSession(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** JS-visible signal that a remembered auth session cookie may still exist. */
export function hasRememberedAuthCookie(): boolean {
  return Boolean(getCsrfToken());
}

export function shouldAttemptSessionRefresh(): boolean {
  return hasRememberedAuthCookie();
}
