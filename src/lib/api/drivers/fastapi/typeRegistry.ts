// Maps entity IDs to their votable/commentable types for governance calls
type EntityType = 'thread' | 'post' | 'comment' | 'event' | 'project';

const cache = new Map<string, EntityType>();

export function registerEntityType(id: string, type: EntityType): void {
  cache.set(id, type);
}

export function registerCommentIds(discussion: Array<{ id: string; replies?: Array<{ id: string; replies?: any[] }> }>): void {
  for (const c of discussion) {
    cache.set(c.id, 'comment');
    if (c.replies && c.replies.length > 0) {
      registerCommentIds(c.replies);
    }
  }
}

export function tryResolveEntityType(id: string): EntityType | null {
  return cache.get(id) ?? null;
}

export function resolveEntityType(id: string): EntityType {
  const type = tryResolveEntityType(id);
  if (!type) {
    throw new Error(`Unknown governance entity type for id ${id}`);
  }
  return type;
}
