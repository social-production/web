import { error } from '@sveltejs/kit';
import { getThread } from '$lib/services/queries/details';
import { extractErrorMessage, isApiClientError, isNetworkLoadError } from '$lib/services/errors';
import type { PageLoad } from './$types';

export const ssr = false;

function threadLoadError(err: unknown, fallback: string): { thread: null; loadError: string } {
  return {
    thread: null,
    loadError: extractErrorMessage(err, fallback)
  };
}

export const load = (async ({ params, depends }) => {
  depends('app:bootstrap');
  depends(`app:thread:${params.slug}`);

  try {
    const thread = await getThread(params.slug);

    if (!thread) {
      throw error(404, 'Thread not found');
    }

    return { thread, loadError: null as string | null };
  } catch (err) {
    if (isApiClientError(err) && err.status === 404) {
      throw error(404, 'Thread not found');
    }

    if (isNetworkLoadError(err)) {
      return {
        thread: null,
        loadError: 'Could not load this thread. Check your connection and try again.'
      };
    }

    return threadLoadError(err, 'Could not load this thread.');
  }
}) satisfies PageLoad;
