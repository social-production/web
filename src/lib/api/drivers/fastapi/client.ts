import { error as kitError } from '@sveltejs/kit';
import {
  clearAuthenticatedSession,
  getCsrfToken,
  hasAuthenticatedSession,
  markAuthenticatedSession
} from './auth';
import { clearBootstrapCache } from '$lib/services/bootstrapCache';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function getBaseUrl(): string {
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

async function refreshSession(): Promise<boolean> {
  const response = await fetch(`${getBaseUrl()}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders('POST')
  });

  if (!response.ok) {
    return false;
  }

  markAuthenticatedSession();
  return true;
}

async function request<T>(method: HttpMethod, path: string, body?: unknown, allowRefresh = true): Promise<T> {
  const isBrowser = typeof window !== 'undefined';
  const options: RequestInit = {
    method,
    credentials: 'include',
    headers: buildHeaders(method, body)
  };

  if (body !== undefined && method !== 'GET' && method !== 'DELETE') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${getBaseUrl()}${path}`, options);

  if (response.status === 401 && allowRefresh && isBrowser && hasAuthenticatedSession() && path !== '/auth/refresh') {
    const refreshed = await refreshSession();
    if (refreshed) {
      return request<T>(method, path, body, false);
    }
  }

  if (!response.ok) {
    if (response.status === 401 && isBrowser) {
      clearAuthenticatedSession();
      clearBootstrapCache();
    }

    throw {
      status: response.status,
      body: await response.json().catch(() => null)
    };
  }

  return response.json() as Promise<T>;
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
    }
  };
}

export const apiClient = createFastApiClient();

export function extractErrorMessage(err: unknown, fallback: string): string {
  const detail = (err as { body?: { detail?: unknown } }).body?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string };
    return first.msg ?? fallback;
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
