import { error } from '@sveltejs/kit';
import { getProfile } from '$lib/services/queries/account';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  const profile = await getProfile(params.username);

  if (!profile) {
    throw error(404, 'Profile not found');
  }

  return { profile };
}) satisfies PageLoad;