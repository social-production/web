import { isRedirect, redirect } from '@sveltejs/kit';
import { toLoadError } from '$lib/api/drivers/fastapi/client';
import { getNotifications, refreshUnreadCounts } from '$lib/services/queries/inbox';
import type { PageLoad } from './$types';

export const load = (async () => {
  try {
    const notifications = await getNotifications();

    if (!notifications) {
      throw redirect(307, '/onboarding');
    }

    try {
      await refreshUnreadCounts();
    } catch (err) {
      console.warn('Could not refresh unread counts for notifications page', err);
    }

    return { notifications };
  } catch (err) {
    if (isRedirect(err)) {
      throw err;
    }
    toLoadError(err, 'Could not load notifications.');
  }
}) satisfies PageLoad;
