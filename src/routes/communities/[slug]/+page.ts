import { error, redirect } from '@sveltejs/kit';
import { getCommunity } from '$lib/services/queries/scopes';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  const scope = await getCommunity(params.slug);

  if (!scope) {
    // Private communities are hidden from non-members, so an invite link has to be redeemed first.
    const invite = url.searchParams.get('invite') ?? url.searchParams.get('token');
    if (invite) {
      throw redirect(307, `/scopes/invites/redeem?token=${encodeURIComponent(invite)}`);
    }
    // This also covers people who left or were removed.
    throw error(404, 'This community is private or no longer exists. Ask a member for an invite link to join.');
  }

  return { scope };
}) satisfies PageLoad;
