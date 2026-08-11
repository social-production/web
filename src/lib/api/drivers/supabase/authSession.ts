/**
 * Supabase browser session markers (parallel to FastAPI cookie/sessionStorage hints).
 * Access/refresh tokens live in localStorage; sessionStorage is a UX hint only.
 */

const SESSION_HINT_KEY = 'sp_supabase_session';
const ACCESS_TOKEN_KEY = 'sp_supabase_access_token';
const REFRESH_TOKEN_KEY = 'sp_supabase_refresh_token';
const EXPIRES_AT_KEY = 'sp_supabase_expires_at';

export function markAuthenticatedSession(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(SESSION_HINT_KEY, '1');
}

export function hasAuthenticatedSession(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(SESSION_HINT_KEY) === '1';
}

export function clearAuthenticatedSession(): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(SESSION_HINT_KEY);
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
  }
}

export function getCsrfToken(): string | null {
  // Supabase uses JWTs, not CSRF cookies. Return a sentinel when a refresh token exists
  // so SessionTransport.hasRememberedAuthCookie / shouldAttemptSessionRefresh stay truthful.
  return getRefreshToken() ? 'supabase' : null;
}

export function hasRememberedAuthCookie(): boolean {
  return Boolean(getRefreshToken());
}

export function shouldAttemptSessionRefresh(): boolean {
  return hasRememberedAuthCookie();
}

export function getAccessToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getExpiresAt(): number | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(EXPIRES_AT_KEY);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function persistAuthTokens(tokens: {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  const expiresAt =
    Date.now() + Math.max(30, tokens.expiresIn ?? 3600) * 1000;
  localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
  markAuthenticatedSession();
}

/** Map app username to a deterministic synthetic email for Supabase Auth. */
export function usernameToAuthEmail(username: string): string {
  const trimmed = username.trim().toLowerCase();
  if (trimmed.includes('@')) return trimmed;
  const safe = trimmed.replace(/[^a-z0-9._-]/g, '-').slice(0, 64) || 'user';
  // Hosted Supabase Auth rejects reserved TLDs like `.local`; use a normal-looking domain.
  return `${safe}@users.socialproduction.com`;
}
