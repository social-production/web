import { getStoredToken } from './auth';

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

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const isBrowser = typeof window !== 'undefined';
  const token = isBrowser ? getStoredToken() : null;
  const headers: Record<string, string> = {
    Accept: 'application/json'
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers
  };

  if (body !== undefined && method !== 'GET' && method !== 'DELETE') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${getBaseUrl()}${path}`, options);

  if (!response.ok) {
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
