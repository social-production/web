import { error as kitError } from '@sveltejs/kit';
import {
  clearAuthenticatedSession,
  getCsrfToken,
  markAuthenticatedSession,
  shouldAttemptSessionRefresh
} from './auth';
import { clearBootstrapCache } from '$lib/services/bootstrapCache';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Renew the access cookie well before its 15-minute expiry. */
const SESSION_KEEPALIVE_MS = 10 * 60 * 1000;

let refreshInFlight: Promise<boolean> | null = null;
let lastSessionRefreshAt = 0;

export function apiWebSocketUrl(path: string): string {
  const base = getBaseUrl().replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  const httpUrl = `${base}${suffix}`;
  if (httpUrl.startsWith('https://')) {
    return `wss://${httpUrl.slice('https://'.length)}`;
  }
  if (httpUrl.startsWith('http://')) {
    return `ws://${httpUrl.slice('http://'.length)}`;
  }
  return httpUrl;
}

function getBaseUrl(): string {
  // The page and the API must share an origin so the browser will store the
  // login cookies. The website forwards /api/* to the real API.
  if (import.meta.env.VITE_API_SAME_ORIGIN === 'true' && typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }

  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) {
    return configured;
  }

  if (import.meta.env.VITE_USE_DEV_PROXY === 'true') {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }

    return 'http://127.0.0.1:8000';
  }

  return 'http://localhost:8000';
}

function buildHeaders(method: HttpMethod, body?: unknown): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json'
  };

  const bearerToken = import.meta.env.VITE_API_BEARER_TOKEN?.trim();
  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`;
  }

  if (body !== undefined && method !== 'GET' && method !== 'DELETE') {
    headers['Content-Type'] = 'application/json';
  }

  if (method !== 'GET') {
    const csrf = getCsrfToken();
    if (csrf) {
      headers['X-CSRF-Token'] = csrf;
    }
  }

  return headers;
}

export async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    let response: Response;
    try {
      response = await fetch(`${getBaseUrl()}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: buildHeaders('POST')
      });
    } catch (err) {
      throw err;
    }

    if (response.ok) {
      markAuthenticatedSession();
      lastSessionRefreshAt = Date.now();
      return true;
    }

    if (response.status === 401 || response.status === 403) {
      lastSessionRefreshAt = Date.now();
      return false;
    }

    throw {
      status: response.status,
      body: await readResponseBody(response)
    };
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

/**
 * Public project and event reads return 200 for a guest when the access
 * cookie is missing, so a 401 never arrives to trigger refresh. Renew the
 * session on a timer whenever the CSRF cookie says a refresh cookie may
 * still exist.
 */
async function keepSessionFresh(): Promise<void> {
  if (typeof window === 'undefined' || !shouldAttemptSessionRefresh()) {
    return;
  }
  if (Date.now() - lastSessionRefreshAt < SESSION_KEEPALIVE_MS) {
    return;
  }
  try {
    await refreshSession();
  } catch {
    // Leave the timestamp unchanged so the next request can retry.
  }
}

async function request<T>(method: HttpMethod, path: string, body?: unknown, allowRefresh = true): Promise<T> {
  const isBrowser = typeof window !== 'undefined';
  if (allowRefresh && isBrowser && path !== '/auth/refresh') {
    await keepSessionFresh();
  }

  const options: RequestInit = {
    method,
    credentials: 'include',
    headers: buildHeaders(method, body)
  };

  if (body !== undefined && method !== 'GET' && method !== 'DELETE') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${getBaseUrl()}${path}`, options);

  if (
    response.status === 401 &&
    allowRefresh &&
    isBrowser &&
    shouldAttemptSessionRefresh() &&
    path !== '/auth/refresh'
  ) {
    try {
      const refreshed = await refreshSession();
      if (refreshed) {
        return request<T>(method, path, body, false);
      }
    } catch (err) {
      throw err;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && isBrowser) {
      clearAuthenticatedSession();
      clearBootstrapCache();
    }

    throw {
      status: response.status,
      body: await readResponseBody(response)
    };
  }

  return parseJsonResponse<T>(response);
}

export function createFastApiClient() {
  return {
    get<T>(path: string): Promise<T> {
      return request<T>('GET', path);
    },
    post<T>(path: string, body?: unknown): Promise<T> {
      return request<T>('POST', path, body);
    },
    put<T>(path: string, body?: unknown): Promise<T> {
      return request<T>('PUT', path, body);
    },
    patch<T>(path: string, body?: unknown): Promise<T> {
      return request<T>('PATCH', path, body);
    },
    delete<T>(path: string): Promise<T> {
      return request<T>('DELETE', path);
    },
    postForm<T>(path: string, form: FormData): Promise<T> {
      return requestForm<T>(path, form);
    }
  };
}

export const apiClient = createFastApiClient();

export function apiAssetUrl(path: string): string {
  const base = getBaseUrl().replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

async function requestForm<T>(path: string, form: FormData, allowRefresh = true): Promise<T> {
  const isBrowser = typeof window !== 'undefined';
  if (allowRefresh && isBrowser && path !== '/auth/refresh') {
    await keepSessionFresh();
  }

  const response = await fetch(`${getBaseUrl()}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders('POST'),
    body: form
  });

  if (
    response.status === 401 &&
    allowRefresh &&
    isBrowser &&
    shouldAttemptSessionRefresh() &&
    path !== '/auth/refresh'
  ) {
    try {
      const refreshed = await refreshSession();
      if (refreshed) {
        return requestForm<T>(path, form, false);
      }
    } catch (err) {
      throw err;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && isBrowser) {
      clearAuthenticatedSession();
      clearBootstrapCache();
    }

    throw {
      status: response.status,
      body: await readResponseBody(response)
    };
  }

  return parseJsonResponse<T>(response);
}

const MAX_ERROR_MESSAGE_LENGTH = 200;
const INVALID_RESPONSE_MESSAGE = 'The server returned an unexpected response.';

function isJsonContentType(response: Response): boolean {
  const contentType = response.headers.get('content-type') ?? '';
  return contentType.includes('application/json');
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (!isJsonContentType(response)) {
    return null;
  }

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
      body: { detail: INVALID_RESPONSE_MESSAGE }
    };
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw {
      status: response.status || 502,
      body: { detail: INVALID_RESPONSE_MESSAGE }
    };
  }
}

function truncateErrorMessage(message: string): string {
  const trimmed = message.trim();
  if (trimmed.length <= MAX_ERROR_MESSAGE_LENGTH) {
    return trimmed;
  }
  return `${trimmed.slice(0, MAX_ERROR_MESSAGE_LENGTH - 1)}…`;
}

function sanitizeErrorText(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (trimmed.startsWith('<') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'Something went wrong. Please try again.';
  }

  return truncateErrorMessage(trimmed);
}

export function extractErrorMessage(err: unknown, fallback: string): string {
  const detail = (err as { body?: { detail?: unknown } }).body?.detail;
  if (typeof detail === 'string') return sanitizeErrorText(detail);
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string };
    const message = first.msg ?? fallback;
    return sanitizeErrorText(message);
  }
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
  if (isApiClientError(err)) {
    return err.status >= 500;
  }

  if (err instanceof TypeError) {
    return /fetch|network|failed/i.test(String(err));
  }

  return false;
}

export function toLoadError(err: unknown, fallbackMessage: string): never {
  if (isApiClientError(err)) {
    throw kitError(err.status, extractErrorMessage(err, fallbackMessage));
  }

  throw kitError(503, fallbackMessage);
}
