import { invalidateAll } from '$app/navigation';
import { refreshBootstrap } from '$lib/services/queries/bootstrap';
import { get } from 'svelte/store';
import { page } from '$app/stores';
import { currentAdapter } from '$lib/services/adapters';
import type { VoteDirection } from '$lib/types/feed';
import { requireViewer } from '$lib/utils/requireViewer';

export function getPublicFeed() {
  return currentAdapter.getPublicFeed();
}

export function getHomeFeed() {
  return currentAdapter.getHomeFeed();
}

export function getPersonalFeed(options?: { scope?: 'following' | 'popular'; sort?: 'popular' | 'recent' }) {
  return currentAdapter.getPersonalFeed(options);
}

export function setVote(targetId: string, vote: VoteDirection) {
  const viewer = get(page).data.bootstrap?.viewer ?? null;

  if (!requireViewer(viewer)) {
    return Promise.resolve();
  }

  return currentAdapter.setVote(targetId, vote);
}

export async function castFeedVote(targetId: string, vote: VoteDirection): Promise<void> {
  try {
    await setVote(targetId, vote);
    await Promise.all([invalidateAll(), refreshBootstrap()]);
  } catch (err) {
    console.error('Feed vote failed', err);
    throw err;
  }
}