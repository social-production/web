/**
 * Supabase HTTP client — Auth REST + Edge Function gateway.
 *
 * Frontend domains must only talk through this module (or domain helpers that use it).
 * Gateway returns camelCase AppAdapter shapes.
 */

import { error as kitError } from '@sveltejs/kit';
import { clearBootstrapCache } from '$lib/services/bootstrapCache';
import {
  clearAuthenticatedSession,
  getAccessToken,
  getRefreshToken,
  markAuthenticatedSession,
  persistAuthTokens,
  shouldAttemptSessionRefresh,
} from './authSession';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

let refreshInFlight: Promise<boolean> | null = null;

const MAX_ERROR_MESSAGE_LENGTH = 200;
const INVALID_RESPONSE_MESSAGE = 'The server returned an unexpected response.';
const PERFORMANCE_DEBUG_KEY = 'sp_perf_debug';

function performanceDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(PERFORMANCE_DEBUG_KEY) === '1';
}

function finishGatewayTiming(
  path: string,
  method: HttpMethod,
  startedAt: number,
  response: Response,
  clientRequestId: string
) {
  if (typeof performance === 'undefined' || !performanceDebugEnabled()) return;
  const durationMs = performance.now() - startedAt;
  const serverTiming = response.headers.get('server-timing');
  const requestId = response.headers.get('x-request-id') ?? clientRequestId;
  performance.measure(`gateway:${method}:${path}`, {
    start: startedAt,
    end: performance.now(),
    detail: { requestId, status: response.status, serverTiming },
  });
  console.info('[sp-perf] gateway', {
    method,
    path,
    status: response.status,
    durationMs: Math.round(durationMs * 10) / 10,
    requestId,
    serverTiming,
  });
}

function configuredSupabaseUrl(): string {
  return (import.meta.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321').replace(/\/$/, '');
}

/**
 * Prefer same-origin /functions/v1 + /auth/v1 so the browser skips CORS preflight.
 * Local Vite and production Vercel both proxy those paths to hosted/local Supabase.
 * Direct browser calls to 127.0.0.1:54321 are a common source of “always 503”.
 * Opt out with VITE_SUPABASE_SAME_ORIGIN=false.
 */
function useSameOriginSupabase(): boolean {
  if (typeof window === 'undefined') return false;
  if ((import.meta.env.VITE_BACKEND ?? '').trim().toLowerCase() !== 'supabase') return false;
  if (import.meta.env.VITE_SUPABASE_SAME_ORIGIN === 'false') return false;
  return true;
}

export function getSupabaseUrl(): string {
  if (useSameOriginSupabase()) {
    return window.location.origin;
  }
  return configuredSupabaseUrl();
}

export function getSupabaseRealtimeUrl(): string {
  return configuredSupabaseUrl();
}

export function getSupabaseAnonKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';
}

function directSupabaseUrl(): string {
  return configuredSupabaseUrl();
}

function directFunctionsBaseUrl(): string {
  const configured = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  return `${directSupabaseUrl()}/functions/v1`;
}

export function getFunctionsBaseUrl(): string {
  if (useSameOriginSupabase()) {
    return `${window.location.origin}/functions/v1`;
  }
  return directFunctionsBaseUrl();
}

async function fetchJsonOrDirectSupabase(url: string, options: RequestInit): Promise<Response> {
  const response = await fetch(url, options);
  if (!useSameOriginSupabase() || typeof window === 'undefined') return response;
  if (isJsonContentType(response)) return response;
  const origin = window.location.origin;
  if (!url.startsWith(`${origin}/`)) return response;
  const fallbackUrl = `${directSupabaseUrl()}${url.slice(origin.length)}`;
  if (fallbackUrl === url) return response;
  try {
    return await fetch(fallbackUrl, options);
  } catch {
    return response;
  }
}

function gatewayUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getFunctionsBaseUrl()}/gateway${normalized}`;
}

function authUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getSupabaseUrl()}/auth/v1${normalized}`;
}

function buildHeaders(
  method: HttpMethod,
  body?: unknown,
  accessToken?: string | null
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    apikey: getSupabaseAnonKey(),
  };

  const token = accessToken ?? getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (getSupabaseAnonKey()) {
    headers.Authorization = `Bearer ${getSupabaseAnonKey()}`;
  }

  if (body !== undefined && method !== 'GET' && method !== 'DELETE') {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

function isJsonContentType(response: Response): boolean {
  const contentType = response.headers.get('content-type') ?? '';
  return contentType.includes('application/json');
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (!isJsonContentType(response)) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!isJsonContentType(response)) {
    throw {
      status: response.status || 502,
      body: { detail: INVALID_RESPONSE_MESSAGE },
    };
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw {
      status: response.status || 502,
      body: { detail: INVALID_RESPONSE_MESSAGE },
    };
  }
}

function truncateErrorMessage(message: string): string {
  const trimmed = message.trim();
  if (trimmed.length <= MAX_ERROR_MESSAGE_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_ERROR_MESSAGE_LENGTH - 1)}…`;
}

function sanitizeErrorText(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('<') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'Something went wrong. Please try again.';
  }
  return truncateErrorMessage(trimmed);
}

export function extractErrorMessage(err: unknown, fallback: string): string {
  const body = (err as { body?: Record<string, unknown> }).body;
  if (!body) return fallback;

  const detail = body.detail;
  if (typeof detail === 'string') return sanitizeErrorText(detail);
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string };
    return sanitizeErrorText(first.msg ?? fallback);
  }

  const msg = body.msg ?? body.error_description ?? body.error ?? body.message;
  if (typeof msg === 'string') return sanitizeErrorText(msg);
  return fallback;
}

export function isApiClientError(err: unknown): err is { status: number; body: unknown } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    typeof (err as { status: unknown }).status === 'number'
  );
}

export function isNetworkLoadError(err: unknown): boolean {
  if (isApiClientError(err)) return err.status >= 500;
  if (err instanceof TypeError) return /fetch|network|failed/i.test(String(err));
  return false;
}

export function toLoadError(err: unknown, fallbackMessage: string): never {
  if (isApiClientError(err)) {
    throw kitError(err.status, extractErrorMessage(err, fallbackMessage));
  }
  throw kitError(503, fallbackMessage);
}

export type AuthTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
  user?: { id: string; email?: string | null };
};

export async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    let response: Response;
    try {
      response = await fetchJsonOrDirectSupabase(authUrl('/token?grant_type=refresh_token'), {
        method: 'POST',
        headers: buildHeaders('POST', {}, null),
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      throw new TypeError('Network request failed while refreshing Supabase session');
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        clearAuthenticatedSession();
        clearBootstrapCache();
        return false;
      }
      throw {
        status: response.status,
        body: await readResponseBody(response),
      };
    }

    const tokens = await parseJsonResponse<AuthTokenResponse>(response);
    persistAuthTokens({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });
    return true;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function requestGateway<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  allowRefresh = true
): Promise<T> {
  const isBrowser = typeof window !== 'undefined';
  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const clientRequestId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const headers = buildHeaders(method, body);
  headers['X-Request-Id'] = clientRequestId;
  const options: RequestInit = {
    method,
    headers,
  };
  if (body !== undefined && method !== 'GET' && method !== 'DELETE') {
    options.body = JSON.stringify(body);
  }

  const url = gatewayUrl(path);
  let response: Response;
  try {
    response = await fetchJsonOrDirectSupabase(url, options);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new TypeError(`Network request failed for ${url}: ${detail}`);
  }
  finishGatewayTiming(path, method, startedAt, response, clientRequestId);

  if (response.status === 401 && allowRefresh && isBrowser && shouldAttemptSessionRefresh()) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return requestGateway<T>(method, path, body, false);
    }
  }

  if (!response.ok) {
    if (response.status === 401 && isBrowser) {
      clearAuthenticatedSession();
      clearBootstrapCache();
    }
    throw {
      status: response.status,
      body: await readResponseBody(response),
    };
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return parseJsonResponse<T>(response);
}

export async function authSignUp(
  email: string,
  password: string,
  metadata: Record<string, unknown>
) {
  const response = await fetchJsonOrDirectSupabase(authUrl('/signup'), {
    method: 'POST',
    headers: buildHeaders('POST', {}),
    body: JSON.stringify({
      email,
      password,
      data: metadata,
    }),
  });

  if (!response.ok) {
    throw {
      status: response.status,
      body: await readResponseBody(response),
    };
  }

  const tokens = await parseJsonResponse<AuthTokenResponse>(response);
  if (tokens.access_token && tokens.refresh_token) {
    persistAuthTokens({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });
  } else {
    markAuthenticatedSession();
  }
  return tokens;
}

export async function authSignIn(email: string, password: string) {
  const response = await fetchJsonOrDirectSupabase(authUrl('/token?grant_type=password'), {
    method: 'POST',
    headers: buildHeaders('POST', {}),
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw {
      status: response.status,
      body: await readResponseBody(response),
    };
  }

  const tokens = await parseJsonResponse<AuthTokenResponse>(response);
  persistAuthTokens({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
  });
  return tokens;
}

export async function authSignOut(): Promise<void> {
  const token = getAccessToken();
  try {
    if (token) {
      await fetchJsonOrDirectSupabase(authUrl('/logout'), {
        method: 'POST',
        headers: buildHeaders('POST', {}, token),
      });
    }
  } finally {
    clearAuthenticatedSession();
    clearBootstrapCache();
  }
}

export type SupabaseClientConfig = {
  url?: string;
  anonKey?: string;
  functionsUrl?: string;
};

export type SupabaseClient = {
  provider: 'supabase';
  get: <T>(path: string) => Promise<T>;
  post: <T>(path: string, body?: unknown) => Promise<T>;
  put: <T>(path: string, body?: unknown) => Promise<T>;
  patch: <T>(path: string, body?: unknown) => Promise<T>;
  delete: <T>(path: string) => Promise<T>;
};

export function createSupabaseClient(_config: SupabaseClientConfig = {}): SupabaseClient {
  return {
    provider: 'supabase',
    get: <T>(path: string) => requestGateway<T>('GET', path),
    post: <T>(path: string, body?: unknown) => requestGateway<T>('POST', path, body),
    put: <T>(path: string, body?: unknown) => requestGateway<T>('PUT', path, body),
    patch: <T>(path: string, body?: unknown) => requestGateway<T>('PATCH', path, body),
    delete: <T>(path: string) => requestGateway<T>('DELETE', path),
  };
}

export const apiClient = createSupabaseClient();
