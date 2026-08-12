import { invalidate } from '$app/navigation';
import { writable } from 'svelte/store';
import { currentAdapter } from '$lib/services/adapters';
import type { RightRailActivityItem } from '$lib/types/bootstrap';

export function getBootstrap() {
  return currentAdapter.getBootstrap();
}

export async function getActivityRail(): Promise<{
  activityRail: RightRailActivityItem[];
  activityRailHistory: RightRailActivityItem[];
}> {
  if (currentAdapter.getActivityRail) {
    try {
      return await currentAdapter.getActivityRail();
    } catch (err) {
      if ((err as { status?: number }).status !== 404) {
        throw err;
      }
    }
  }
  const bootstrap = await getBootstrap();
  return {
    activityRail: bootstrap.activityRail ?? [],
    activityRailHistory: bootstrap.activityRailHistory ?? [],
  };
}

/** Bumped by rail mutations so AppShell can reload deferred activity-rail state. */
export const activityRailRefreshNonce = writable(0);

export function requestActivityRailRefresh() {
  activityRailRefreshNonce.update((value) => value + 1);
}

export async function refreshBootstrap() {
  await invalidate('app:bootstrap');
}
