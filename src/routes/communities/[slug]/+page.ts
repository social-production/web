import { error } from '@sveltejs/kit';
import { getCommunity } from '$lib/services/queries/scopes';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  const scope = await getCommunity(params.slug);

  if (!scope) {
    throw error(404, 'Community not found');
  }

  return { scope };
}) satisfies PageLoad;