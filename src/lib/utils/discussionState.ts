import type { DetailComment } from '$lib/types/detail';

export class ChatSendError extends Error {
  constructor(message = 'Could not send this message. Try again.') {
    super(message);
    this.name = 'ChatSendError';
  }
}

function flattenComments(items: DetailComment[]): DetailComment[] {
  const flattened: DetailComment[] = [];

  for (const item of items) {
    flattened.push(item);
    flattened.push(...flattenComments(item.replies));
  }

  return flattened;
}

export function isOptimisticCommentId(id: string): boolean {
  return id.startsWith('pending-');
}

export function createOptimisticComment(authorUsername: string, body: string): DetailComment {
  return {
    id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    authorUsername,
    body,
    createdAt: new Date().toISOString(),
    voteCount: 0,
    activeVote: 0,
    report: null,
    replies: []
  };
}

function serverHasMatchingComment(
  serverDiscussion: DetailComment[],
  optimistic: DetailComment
): boolean {
  const serverComments = flattenComments(serverDiscussion);

  return serverComments.some((comment) => {
    if (comment.id === optimistic.id) {
      return true;
    }

    if (comment.body !== optimistic.body) {
      return false;
    }

    if (comment.authorUsername !== optimistic.authorUsername) {
      return false;
    }

    const serverTime = +new Date(comment.createdAt);
    const optimisticTime = +new Date(optimistic.createdAt);

    if (Number.isNaN(serverTime) || Number.isNaN(optimisticTime)) {
      return false;
    }

    // Only treat as the same send when the server comment arrived after this optimistic row.
    return serverTime >= optimisticTime - 5000;
  });
}

export function pruneOptimisticComments(
  serverDiscussion: DetailComment[],
  optimisticComments: DetailComment[]
): DetailComment[] {
  if (optimisticComments.length === 0) {
    return optimisticComments;
  }

  let changed = false;
  const next = optimisticComments.filter((comment) => {
    const keep = !serverHasMatchingComment(serverDiscussion, comment);
    if (!keep) {
      changed = true;
    }
    return keep;
  });

  return changed ? next : optimisticComments;
}

export function mergeDiscussion(
  serverDiscussion: DetailComment[],
  optimisticComments: DetailComment[]
): DetailComment[] {
  const merged = [...(serverDiscussion ?? []), ...optimisticComments];

  return merged.sort(
    (left, right) => +new Date(left.createdAt) - +new Date(right.createdAt)
  );
}

export function syncIncomingDiscussion(
  local: DetailComment[],
  incoming: DetailComment[] | null | undefined
): DetailComment[] {
  const next = incoming ?? [];

  if (next.length === 0) {
    return local.length > 0 ? local : next;
  }

  const localFlat = flattenComments(local);
  const incomingFlat = flattenComments(next);

  if (incomingFlat.length >= localFlat.length) {
    return next;
  }

  const incomingIds = new Set(incomingFlat.map((comment) => comment.id));
  const hasLocalOnlyComments = localFlat.some((comment) => !incomingIds.has(comment.id));

  return hasLocalOnlyComments ? local : next;
}
