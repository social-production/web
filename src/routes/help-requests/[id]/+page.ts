import { error } from '@sveltejs/kit';
import { getHelpRequest } from '$lib/services/queries/details';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  const helpRequest = await getHelpRequest(params.id);

  if (!helpRequest) {
    throw error(404, 'Help request not found');
  }

  return { helpRequest };
}) satisfies PageLoad;
