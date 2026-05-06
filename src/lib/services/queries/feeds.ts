import { currentAdapter } from '$lib/services/adapters';
import type { VoteDirection } from '$lib/types/feed';

export function getPublicFeed() {
  return currentAdapter.getPublicFeed();
}

export function getPersonalFeed() {
  return currentAdapter.getPersonalFeed();
}

export function setVote(targetId: string, vote: VoteDirection) {
  return currentAdapter.setVote(targetId, vote);
}