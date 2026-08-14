import { browser } from '$app/environment';
import type { SettingsPageData } from '$lib/types/account';
import type { BootstrapPayload } from '$lib/types/bootstrap';

const CACHE_PREFIX = 'sp_bootstrap_cache_';
const RECORD_VERSION = 2 as const;

export interface BootstrapCacheRecord {
  version: typeof RECORD_VERSION;
  bootstrap: BootstrapPayload;
  settings: SettingsPageData | null;
}

let allowStaleServe = true;

export function bootstrapCacheKey(viewerId: string | null = null): string {
  return viewerId ? `${CACHE_PREFIX}${viewerId}` : `${CACHE_PREFIX}anon`;
}

function parseRecord(raw: string): BootstrapCacheRecord | null {
  try {
    const parsed = JSON.parse(raw) as BootstrapCacheRecord | BootstrapPayload | null;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    if ('version' in parsed && parsed.version === RECORD_VERSION && parsed.bootstrap) {
      return parsed;
    }
    if ('viewer' in parsed) {
      return {
        version: RECORD_VERSION,
        bootstrap: parsed as BootstrapPayload,
        settings: null
      };
    }
    return null;
  } catch {
    return null;
  }
}

function readRecordByKey(key: string): BootstrapCacheRecord | null {
  if (!browser) {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(key);
    return raw ? parseRecord(raw) : null;
  } catch {
    return null;
  }
}

export function readBootstrapCacheRecord(): BootstrapCacheRecord | null {
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
      const record = readRecordByKey(key);
      if (record) {
        return record;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function readBootstrapCache(): BootstrapPayload | null {
  return readBootstrapCacheRecord()?.bootstrap ?? null;
}

export function readCachedSettings(): SettingsPageData | null {
  return readBootstrapCacheRecord()?.settings ?? null;
}

/** Offline fallback must never claim an authenticated identity. */
export function readPublicBootstrapCache(): BootstrapPayload | null {
  const record = readRecordByKey(`${CACHE_PREFIX}anon`);
  if (!record) {
    return null;
  }
  return { ...record.bootstrap, viewer: null };
}

export function writeBootstrapCache(
  payload: BootstrapPayload,
  settings: SettingsPageData | null = null
) {
  if (!browser) {
    return;
  }

  try {
    const record: BootstrapCacheRecord = {
      version: RECORD_VERSION,
      bootstrap: payload,
      settings
    };
    sessionStorage.setItem(bootstrapCacheKey(payload.viewer?.id ?? null), JSON.stringify(record));
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
  return Boolean(cached);
}

/** Cached viewer identity must match whether a remember-cookie / refresh token exists. */
export function isBootstrapCacheConsistentWithAuth(
  cached: BootstrapPayload,
  hasRememberedAuth: boolean
): boolean {
  if (hasRememberedAuth) {
    return Boolean(cached.viewer);
  }
  return !cached.viewer;
}

export function consumeStaleBootstrapServe(): boolean {
  if (!allowStaleServe) {
    return false;
  }
  allowStaleServe = false;
  return true;
}

/** Test helper — reset the one-shot stale serve guard. */
export function resetBootstrapCacheStaleGuardForTests(): void {
  allowStaleServe = true;
}
