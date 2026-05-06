import { error } from '@sveltejs/kit';
import { getMessages } from '$lib/services/queries/inbox';
import type { PageLoad } from './$types';

export const load = (async () => {
  const messages = await getMessages();

  if (!messages) {
    throw error(404, 'Messages not available');
  }

  return { messages };
}) satisfies PageLoad;