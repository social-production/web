import { redirect } from '@sveltejs/kit';
import { getSettings } from '$lib/services/queries/account';
import type { PageLoad } from './$types';

export const load = (async ({ parent, depends }) => {
  depends('app:settings');
  const parentData = await parent();
  if (!parentData.bootstrap?.viewer) {
    throw redirect(307, '/onboarding');
  }

  // Prefer a fresh fetch so bio/photo updates are not stuck on layout session cache.
  const settings = (await getSettings()) ?? parentData.settings;
  if (!settings) {
    throw redirect(307, '/onboarding');
  }

  return { settings };
}) satisfies PageLoad;
