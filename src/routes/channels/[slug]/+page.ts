import { error } from '@sveltejs/kit';
import { getChannel } from '$lib/services/queries/scopes';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  const scope = await getChannel(params.slug);

  if (!scope) {
    throw error(404, 'Channel not found');
  }

  return { scope };
}) satisfies PageLoad;