import { redirect } from '@sveltejs/kit';
import { getPendingInvites } from '$lib/services/queries/invites';
import type { PageLoad } from './$types';

export const load = (async ({ parent }) => {
  const { bootstrap } = await parent();
  if (!bootstrap?.viewer) {
    throw redirect(307, '/onboarding?mode=login&next=%2Finvites');
  }
  return { invites: await getPendingInvites() };
}) satisfies PageLoad;
