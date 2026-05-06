import { error } from '@sveltejs/kit';
import { getEvent } from '$lib/services/queries/details';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  const event = await getEvent(params.slug);

  if (!event) {
    throw error(404, 'Event not found');
  }

  return { event };
}) satisfies PageLoad;