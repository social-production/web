import { error } from '@sveltejs/kit';
import { getEvent } from '$lib/services/queries/details';
import { isNetworkLoadError, toLoadError } from '$lib/api/drivers/fastapi/client';
import type { PageLoad } from './$types';

export const ssr = false;

export const load = (async ({ params }) => {
  try {
    const event = await getEvent(params.slug);

    if (!event) {
      throw error(404, 'Event not found');
    }

    return { event, loadError: null as string | null };
  } catch (err) {
    if (isNetworkLoadError(err)) {
      return {
        event: null,
        loadError: 'Could not load this event. Check your connection and try again.'
      };
    }

    toLoadError(err, 'Could not load this event.');
  }
}) satisfies PageLoad;
