import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { getSettings } from '$lib/services/queries/account';
import { hydrateClientSettingsState } from '$lib/services/queries/account';
import { getBootstrap } from '$lib/services/queries/bootstrap';
import type { LayoutLoad } from './$types';

export const ssr = false;

const protectedPrefixes = ['/personal', '/messages', '/notifications', '/settings', '/create'];
let didHydrateClientState = false;

export const load = (async ({ url }) => {
  if (browser && !didHydrateClientState) {
    await hydrateClientSettingsState();
    didHydrateClientState = true;
  }

  const bootstrap = await getBootstrap();

  if (
    !bootstrap.viewer &&
    protectedPrefixes.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))
  ) {
    throw redirect(307, '/onboarding');
  }

  const settings = bootstrap.viewer ? await getSettings() : null;

  return {
    bootstrap,
    settings
  };
}) satisfies LayoutLoad;