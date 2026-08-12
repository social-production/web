import { isRedirect, redirect } from '@sveltejs/kit';
import { toLoadError } from '$lib/services/errors';
import { getMessages } from '$lib/services/queries/inbox';
import type { MessagesPageData } from '$lib/types/inbox';
import type { PageLoad } from './$types';

function emptyMessages(viewer: MessagesPageData['viewer'] | null | undefined): MessagesPageData {
  return {
    viewer: viewer ?? { id: '', username: 'unknown' },
    conversations: [],
    linkedChats: [],
    suggestedContacts: [],
    activeConversationId: null
  };
}

export const load = (async ({ url, depends, parent }) => {
  depends('inbox:messages');

  try {
    const messages = await getMessages();

    if (!messages) {
      throw redirect(307, '/onboarding');
    }

    return {
      messages: {
        viewer: messages.viewer,
        conversations: Array.isArray(messages.conversations) ? messages.conversations : [],
        linkedChats: Array.isArray(messages.linkedChats) ? messages.linkedChats : [],
        suggestedContacts: Array.isArray(messages.suggestedContacts)
          ? messages.suggestedContacts
          : [],
        activeConversationId: messages.activeConversationId ?? null
      },
      openConversationId: url.searchParams.get('conversation'),
      composeToUsername: url.searchParams.get('to')
    };
  } catch (err) {
    if (isRedirect(err)) {
      throw err;
    }

    // Prefer a usable empty inbox over a dead route when the gateway is slow/partial.
    try {
      const parentData = await parent();
      const viewer = parentData.bootstrap?.viewer ?? null;
      if (!viewer) {
        throw redirect(307, '/onboarding');
      }
      console.warn('Could not load messages inbox; returning empty defaults', err);
      return {
        messages: emptyMessages(viewer),
        openConversationId: url.searchParams.get('conversation'),
        composeToUsername: url.searchParams.get('to')
      };
    } catch (fallbackErr) {
      if (isRedirect(fallbackErr)) {
        throw fallbackErr;
      }
      toLoadError(err, 'Could not load messages.');
    }
  }
}) satisfies PageLoad;
