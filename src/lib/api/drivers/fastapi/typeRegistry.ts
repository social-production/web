// Maps entity IDs to their votable/commentable types for governance calls
const cache = new Map<string, 'thread' | 'post' | 'comment' | 'event' | 'project'>();

export function registerEntityType(id: string, type: 'thread' | 'post' | 'comment' | 'event' | 'project'): void {
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

export function resolveEntityType(id: string): 'thread' | 'post' | 'comment' | 'event' | 'project' {
  return cache.get(id) ?? 'thread';
}
