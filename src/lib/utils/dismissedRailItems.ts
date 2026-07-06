import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export const dismissedRailRevision = writable(0);

export function dismissedRailStorageKey(viewerId: string | null) {
  return viewerId ? `dismissed-rail-ids-${viewerId}` : 'dismissed-rail-ids';
}

export function seenRailStorageKey(viewerId: string | null) {
  return viewerId ? `seen-rail-ids-${viewerId}` : 'seen-rail-ids';
}

function readStoredIdSet(storageKey: string) {
  if (!browser) {
    return new Set<string>();
  }

  try {
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      return new Set<string>();
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return new Set<string>();
    }

    return new Set<string>(parsed.filter((value): value is string => typeof value === 'string'));
  } catch {
    return new Set<string>();
  }
}

function persistIdSet(storageKey: string, ids: Set<string>) {
  if (!browser) {
    return;
  }

  localStorage.setItem(storageKey, JSON.stringify([...ids]));
}

function bumpRevision() {
  dismissedRailRevision.update((count) => count + 1);
}

export function readDismissedRailIds(storageKey: string, _revision = 0) {
  return readStoredIdSet(storageKey);
}

export function readSeenRailIds(storageKey: string, _revision = 0) {
  return readStoredIdSet(storageKey);
}

export function dismissRailItemId(storageKey: string, itemId: string) {
  const next = new Set([...readDismissedRailIds(storageKey), itemId]);
  persistIdSet(storageKey, next);
  bumpRevision();
  return next;
}

export function restoreRailItemId(storageKey: string, itemId: string) {
  const next = new Set(readDismissedRailIds(storageKey));
  next.delete(itemId);
  persistIdSet(storageKey, next);
  bumpRevision();
  return next;
}

export function restoreAllRailItems(storageKey: string) {
  persistIdSet(storageKey, new Set());
  bumpRevision();
  return new Set<string>();
}

export function markRailItemSeen(storageKey: string, itemId: string) {
  const current = readSeenRailIds(storageKey);

  if (current.has(itemId)) {
    return current;
  }

  const next = new Set([...current, itemId]);
  persistIdSet(storageKey, next);
  bumpRevision();
  return next;
}

export function countDismissedRailItems(storageKey: string) {
  return readDismissedRailIds(storageKey).size;
}
