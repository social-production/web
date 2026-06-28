import { redirect } from '@sveltejs/kit';
import { getSettings } from '$lib/services/queries/account';
import type { PageLoad } from './$types';

export const load = (async () => {
  const settings = await getSettings();

  if (!settings) {
    throw redirect(307, '/onboarding');
  }

  return { settings };
}) satisfies PageLoad;