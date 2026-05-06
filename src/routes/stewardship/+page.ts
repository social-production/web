import { error } from '@sveltejs/kit';
import { getPlatform } from '$lib/services/queries/scopes';
import type { PageLoad } from './$types';

export const load = (async () => {
  const scope = await getPlatform();

  if (!scope) {
    throw error(404, 'Platform not found');
  }

  return { scope };
}) satisfies PageLoad;