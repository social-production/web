import { browser } from '$app/environment';
import { getStoredToken } from '$lib/api/drivers/fastapi/auth';
import type { BootstrapPayload } from '$lib/types/bootstrap';

const CACHE_PREFIX = 'sp_bootstrap_cache_';

export function bootstrapCacheKey(token: string | null = getStoredToken()): string {
  return token ? `${CACHE_PREFIX}${token.slice(-24)}` : `${CACHE_PREFIX}anon`;
}

export function readBootstrapCache(): BootstrapPayload | null {
  if (!browser) {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(bootstrapCacheKey());
    return raw ? (JSON.parse(raw) as BootstrapPayload) : null;
  } catch {
    return null;
  }
}

export function writeBootstrapCache(payload: BootstrapPayload) {
  if (!browser) {
    return;
  }

  try {
    sessionStorage.setItem(bootstrapCacheKey(), JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

export function clearBootstrapCache() {
  if (!browser) {
    return;
  }

  try {
    const keysToRemove: string[] = [];
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      sessionStorage.removeItem(key);
    }
  } catch {
    // ignore storage failures
  }
}

export function isBootstrapCacheUsable(cached: BootstrapPayload): boolean {
  const token = getStoredToken();
  if (!token) {
    return !cached.viewer;
  }

  return Boolean(cached.viewer);
}
