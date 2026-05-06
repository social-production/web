import { error } from '@sveltejs/kit';
import { getThread } from '$lib/services/queries/details';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  const thread = await getThread(params.slug);

  if (!thread) {
    throw error(404, 'Thread not found');
  }

  return { thread };
}) satisfies PageLoad;