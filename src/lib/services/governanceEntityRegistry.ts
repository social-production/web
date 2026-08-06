/**
 * Optional UI convenience cache for entity IDs.
 *
 * Wire calls (vote / comment / report) MUST pass an explicit GovernanceEntityRef
 * through AppAdapter — do not use resolveEntityType for backend requests.
 */
import type { GovernanceEntityType } from '$lib/types/governance';

export type { GovernanceEntityType } from '$lib/types/governance';

const cache = new Map<string, GovernanceEntityType>();

export function registerEntityType(id: string, type: GovernanceEntityType): void {
  cache.set(id, type);
}

export function registerCommentIds(
  discussion: Array<{ id: string; replies?: Array<{ id: string; replies?: unknown[] }> }>
): void {
  for (const comment of discussion) {
    cache.set(comment.id, 'comment');
    if (comment.replies && comment.replies.length > 0) {
      registerCommentIds(comment.replies as Array<{ id: string; replies?: Array<{ id: string }> }>);
    }
  }
}

/** @deprecated Prefer explicit GovernanceEntityRef on adapter calls. */
export function tryResolveEntityType(id: string): GovernanceEntityType | null {
  return cache.get(id) ?? null;
}

/** @deprecated Prefer explicit GovernanceEntityRef on adapter calls. */
export function resolveEntityType(id: string): GovernanceEntityType {
  const type = tryResolveEntityType(id);
  if (!type) {
    throw new Error(`Unknown governance entity type for id ${id}`);
  }
  return type;
}

/** Test helper — clear the registry between isolated checks. */
export function resetGovernanceEntityRegistryForTests(): void {
  cache.clear();
}
