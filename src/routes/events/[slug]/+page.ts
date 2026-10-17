import { getEvent } from '$lib/services/queries/details';
import { extractErrorMessage, isApiClientError, isNetworkLoadError } from '$lib/services/errors';
import type { PageLoad } from './$types';

export const ssr = false;

function eventLoadError(err: unknown, fallback: string): { event: null; loadError: string } {
  return {
    event: null,
    loadError: extractErrorMessage(err, fallback)
  };
}

export const load = (async ({ params, depends, parent }) => {
  depends(`app:event:${params.slug}`);
  // Plan times are converted into the viewer's Display timezone, which the layout loads.
  await parent();

  try {
    const event = await getEvent(params.slug);

    if (!event) {
      return {
        event: null,
        loadError: "This event is private or no longer available. If it's private, ask an organizer to invite you."
      };
    }

    return { event, loadError: null as string | null };
  } catch (err) {
    if (isApiClientError(err) && err.status === 404) {
      return {
        event: null,
        loadError: "This event is private or no longer available. If it's private, ask an organizer to invite you."
      };
    }

    if (isNetworkLoadError(err)) {
      return {
        event: null,
        loadError: 'Could not load this event. Check your connection and try again.'
      };
    }

    return eventLoadError(err, 'Could not load this event.');
  }
}) satisfies PageLoad;
