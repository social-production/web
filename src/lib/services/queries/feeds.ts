import { get } from 'svelte/store';
import { page } from '$app/stores';
import { currentAdapter } from '$lib/services/adapters';
import type { VoteDirection } from '$lib/types/feed';
import { requireViewer } from '$lib/utils/requireViewer';

export function getPublicFeed() {
  return currentAdapter.getPublicFeed();
}

export function getPersonalFeed() {
  return currentAdapter.getPersonalFeed();
}

export function setVote(targetId: string, vote: VoteDirection) {
  const viewer = get(page).data.bootstrap?.viewer ?? null;

  if (!requireViewer(viewer)) {
    return Promise.resolve();
  }

  return currentAdapter.setVote(targetId, vote);
}