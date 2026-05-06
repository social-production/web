import { redirect } from '@sveltejs/kit';
import { getSettings } from '$lib/services/queries/account';
import { getBootstrap } from '$lib/services/queries/bootstrap';
import type { LayoutLoad } from './$types';

const protectedPrefixes = ['/personal', '/messages', '/notifications', '/settings', '/create'];

export const load = (async ({ url }) => {
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