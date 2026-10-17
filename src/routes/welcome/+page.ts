import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ parent }) => {
  const { bootstrap } = await parent();
  if (!bootstrap?.viewer) {
    throw redirect(307, '/onboarding');
  }
  return {};
}) satisfies PageLoad;
