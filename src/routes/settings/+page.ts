import { error } from '@sveltejs/kit';
import { getSettings } from '$lib/services/queries/account';
import type { PageLoad } from './$types';

export const load = (async () => {
  const settings = await getSettings();

  if (!settings) {
    throw error(404, 'Settings not available');
  }

  return { settings };
}) satisfies PageLoad;