// Maps entity IDs to their votable/commentable types for governance calls
const cache = new Map<string, 'thread' | 'post' | 'comment'>();
const eventSlugCache = new Map<string, string>();

export function registerEntityType(id: string, type: 'thread' | 'post' | 'comment'): void {
  cache.set(id, type);
}

export function resolveEntityType(id: string): 'thread' | 'post' | 'comment' {
  return cache.get(id) ?? 'thread';
}

export function registerEventSlug(id: string, slug: string): void {
  eventSlugCache.set(id, slug);
}

export function resolveEventSlug(id: string): string | undefined {
  return eventSlugCache.get(id);
}
