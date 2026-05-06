import { error } from '@sveltejs/kit';
import { getNotifications } from '$lib/services/queries/inbox';
import type { PageLoad } from './$types';

export const load = (async () => {
  const notifications = await getNotifications();

  if (!notifications) {
    throw error(404, 'Notifications not available');
  }

  return { notifications };
}) satisfies PageLoad;