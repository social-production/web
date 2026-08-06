import { currentAdapter } from '$lib/services/adapters';

export function getTaggableScopes(query: string, kind?: 'channel' | 'community', limit?: number) {
  return currentAdapter.getTaggableScopes(query, kind, limit);
}

/** @deprecated Import mutations from `$lib/services/commands/create`. */
export {
  createProject,
  createThread,
  createEvent,
  createPost,
  createChannel,
  createCommunity,
  createHelpRequest
} from '$lib/services/commands/create';
