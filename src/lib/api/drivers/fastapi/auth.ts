const SESSION_KEY = 'sp_session';
const CSRF_COOKIE = 'sp_csrf';
const CSRF_STORAGE_KEY = 'sp_csrf_token';
const REMEMBERED_AUTH_KEY = 'sp_auth_remembered';

/**
 * Ephemeral same-tab UX hint only. Never gate refresh/recovery on this —
 * `sessionStorage` is cleared when the browser closes, while httpOnly refresh
 * cookies (and the readable CSRF cookie) persist for the remembered session.
 */
export function markAuthenticatedSession(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, '1');
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(REMEMBERED_AUTH_KEY, '1');
  }
}

export function hasAuthenticatedSession(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

export function clearAuthenticatedSession(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(REMEMBERED_AUTH_KEY);
    localStorage.removeItem(CSRF_STORAGE_KEY);
  }
}

export function setCsrfToken(token: string | null): void {
  if (typeof localStorage === 'undefined') return;
  if (token && token.trim().length > 0) {
    localStorage.setItem(CSRF_STORAGE_KEY, token.trim());
    localStorage.setItem(REMEMBERED_AUTH_KEY, '1');
    return;
  }
  localStorage.removeItem(CSRF_STORAGE_KEY);
}

export function getCsrfToken(): string | null {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(CSRF_STORAGE_KEY);
    if (stored && stored.trim().length > 0) {
      return stored;
    }
  }

  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]+)`));
  const cookieToken = match ? decodeURIComponent(match[1]) : null;
  if (cookieToken && typeof localStorage !== 'undefined') {
    localStorage.setItem(CSRF_STORAGE_KEY, cookieToken);
  }
  return cookieToken;
}

/** JS-visible signal that a remembered auth session cookie may still exist. */
export function hasRememberedAuthCookie(): boolean {
  if (getCsrfToken()) {
    return true;
  }
  if (typeof localStorage === 'undefined') {
    return false;
  }
  return localStorage.getItem(REMEMBERED_AUTH_KEY) === '1';
}

export function shouldAttemptSessionRefresh(): boolean {
  return hasRememberedAuthCookie();
}
