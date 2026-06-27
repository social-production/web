import { error } from '@sveltejs/kit';
import { getNotifications, refreshUnreadCounts } from '$lib/services/queries/inbox';
import type { PageLoad } from './$types';

export const load = (async () => {
  const [notifications] = await Promise.all([getNotifications(), refreshUnreadCounts()]);

  if (!notifications) {
    throw error(404, 'Notifications not available');
  }

  return { notifications };
}) satisfies PageLoad;