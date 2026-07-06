import { error, redirect } from '@sveltejs/kit';
import { getMessages } from '$lib/services/queries/inbox';
import type { PageLoad } from './$types';

export const load = (async ({ url, depends }) => {
  depends('inbox:messages');

  const messages = await getMessages();

  if (!messages) {
    throw redirect(307, '/onboarding');
  }

  return {
    messages,
    openConversationId: url.searchParams.get('conversation'),
    composeToUsername: url.searchParams.get('to')
  };
}) satisfies PageLoad;