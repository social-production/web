import { invalidate } from '$app/navigation';
import { currentAdapter } from '$lib/services/adapters';
import { fetchActivityRail } from '$lib/api/drivers/supabase/domains/bootstrap';

export function getBootstrap() {
  return currentAdapter.getBootstrap();
}

export async function getActivityRail() {
  // Supabase serves a deferred rail endpoint; FastAPI embeds the rail in bootstrap.
  try {
    return await fetchActivityRail();
  } catch (err) {
    if ((err as { status?: number }).status !== 404) {
      throw err;
    }
    const bootstrap = await getBootstrap();
    return {
      activityRail: bootstrap.activityRail ?? [],
      activityRailHistory: bootstrap.activityRailHistory ?? []
    };
  }
}

export async function refreshBootstrap() {
  await invalidate('app:bootstrap');
}