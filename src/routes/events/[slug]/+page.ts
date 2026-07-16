import { error } from '@sveltejs/kit';
import { getEvent } from '$lib/services/queries/details';
import {
  extractErrorMessage,
  isApiClientError,
  isNetworkLoadError,
  toLoadError
} from '$lib/services/errors';
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
    if (isApiClientError(err) && err.status >= 500) {
      return {
        event: null,
        loadError: extractErrorMessage(err, 'Could not load this event.')
      };
    }

    if (isNetworkLoadError(err)) {
      return {
        event: null,
        loadError: 'Could not load this event. Check your connection and try again.'
      };
    }

    toLoadError(err, 'Could not load this event.');
  }
}) satisfies PageLoad;
