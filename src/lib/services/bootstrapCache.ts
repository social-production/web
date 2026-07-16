import { browser } from '$app/environment';
import type { BootstrapPayload } from '$lib/types/bootstrap';

const CACHE_PREFIX = 'sp_bootstrap_cache_';

export function bootstrapCacheKey(viewerId: string | null = null): string {
  return viewerId ? `${CACHE_PREFIX}${viewerId}` : `${CACHE_PREFIX}anon`;
}

export function readBootstrapCache(): BootstrapPayload | null {
  if (!browser) {
    return null;
  }

  try {
    const keysToTry = [`${CACHE_PREFIX}anon`];
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(CACHE_PREFIX) && key !== `${CACHE_PREFIX}anon`) {
        keysToTry.push(key);
      }
    }

    for (const key of keysToTry) {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw) as BootstrapPayload;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function writeBootstrapCache(payload: BootstrapPayload) {
  if (!browser) {
    return;
  }

  try {
    sessionStorage.setItem(bootstrapCacheKey(payload.viewer?.id ?? null), JSON.stringify(payload));
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
  return Boolean(cached.viewer) || !cached.viewer;
}
