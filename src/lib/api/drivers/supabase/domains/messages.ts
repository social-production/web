import { apiClient } from '../client';
import type { AppAdapter } from '$lib/services/adapters/types';
import type { ViewerSummary } from '$lib/types/bootstrap';
import type {
  CreateGroupMessageInput,
  DirectMessage,
  MessageConversationResult,
  MessageLinkedChat,
  MessagesPageData
} from '$lib/types/inbox';

type ConversationsPayload = Partial<MessagesPageData> & {
  viewer?: ViewerSummary;
  conversations?: MessagesPageData['conversations'];
  linkedChats?: MessageLinkedChat[];
  suggestedContacts?: ViewerSummary[];
  activeConversationId?: string | null;
};

type LinkedChatsPayload = {
  items?: Array<{
    id: string;
    kind: 'project' | 'event' | 'help_request';
    entity_id?: string;
    entity_slug?: string;
    subjectId?: string;
    title: string;
    href?: string;
    meta?: string;
    preview?: string;
    last_message_at?: string;
    lastMessageAt?: string;
    comment_count?: number;
    unread_count?: number;
    unreadCount?: number;
  }>;
  linkedChats?: MessageLinkedChat[];
};

function mapLinkedChatItems(payload: LinkedChatsPayload | null | undefined): MessageLinkedChat[] {
  if (!payload) return [];
  if (Array.isArray(payload.linkedChats)) return payload.linkedChats;
  if (!Array.isArray(payload.items)) return [];

  return payload.items.map((chat) => ({
    id: chat.id,
    kind: chat.kind,
    subjectId: chat.subjectId ?? chat.entity_id ?? chat.id,
    title: chat.title,
    href:
      chat.href ??
      (chat.kind === 'help_request'
        ? `/help-requests/${chat.entity_id ?? chat.id}`
        : `/${chat.kind}s/${chat.entity_slug ?? chat.id}`),
    meta: chat.meta ?? `${chat.comment_count ?? 0} comments`,
    preview: chat.preview ?? '',
    lastMessageAt: chat.lastMessageAt ?? chat.last_message_at ?? new Date(0).toISOString(),
    unreadCount: chat.unreadCount ?? chat.unread_count ?? 0,
    comments: []
  }));
}

export async function fetchMessages(): Promise<MessagesPageData | null> {
  try {
    // Conversations only on the critical path. Linked chats hydrate after first paint.
    const page = await apiClient.get<ConversationsPayload>('/messages/conversations');

    if (!page.viewer) {
      return null;
    }

    return {
      viewer: page.viewer,
      conversations: Array.isArray(page.conversations) ? page.conversations : [],
      linkedChats: [],
      suggestedContacts: Array.isArray(page.suggestedContacts) ? page.suggestedContacts : [],
      activeConversationId: page.activeConversationId ?? null
    };
  } catch (err) {
    if ((err as { status?: number }).status === 401) return null;
    throw err;
  }
}

export async function fetchLinkedChats(): Promise<MessageLinkedChat[]> {
  try {
    const payload = await apiClient.get<LinkedChatsPayload>('/messages/linked-chats');
    return mapLinkedChatItems(payload);
  } catch (err) {
    if ((err as { status?: number }).status === 401 || (err as { status?: number }).status === 404) {
      return [];
    }
    throw err;
  }
}

export async function fetchConversationMessages(
  conversationId: string,
  _viewerId: string,
  _participants: ViewerSummary[]
): Promise<DirectMessage[]> {
  try {
    const res = await apiClient.get<{ messages?: DirectMessage[] }>(
      `/messages/conversations/${encodeURIComponent(conversationId)}/messages`
    );
    return res.messages ?? [];
  } catch (err) {
    if ((err as { status?: number }).status === 401 || (err as { status?: number }).status === 404) {
      return [];
    }
    throw err;
  }
}

export async function fetchMessageContacts(query: string, limit = 8): Promise<ViewerSummary[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  try {
    const res = await apiClient.get<{ items?: ViewerSummary[] }>(`/messages/contacts?${params}`);
    return res.items ?? [];
  } catch (err) {
    if ((err as { status?: number }).status === 404) return [];
    throw err;
  }
}

export async function fetchSendMessage(conversationId: string, body: string): Promise<void> {
  await apiClient.post(`/messages/conversations/${encodeURIComponent(conversationId)}/messages`, {
    body
  });
}

export async function fetchStartDirectMessage(
  username: string,
  body: string
): Promise<MessageConversationResult> {
  return apiClient.post<MessageConversationResult>('/messages/direct', {
    participantUsername: username,
    username,
    body
  });
}

export async function fetchCreateGroupConversation(
  input: CreateGroupMessageInput
): Promise<MessageConversationResult> {
  return apiClient.post<MessageConversationResult>('/messages/groups', input);
}

export async function fetchRenameGroupConversation(
  id: string,
  title: string
): Promise<MessageConversationResult> {
  return apiClient.post<MessageConversationResult>(
    `/messages/conversations/${encodeURIComponent(id)}/rename`,
    { title }
  );
}

export async function fetchAddGroupConversationMember(
  id: string,
  username: string
): Promise<MessageConversationResult> {
  return apiClient.post<MessageConversationResult>(
    `/messages/conversations/${encodeURIComponent(id)}/members`,
    { username }
  );
}

export async function fetchRemoveGroupConversationMember(
  id: string,
  username: string
): Promise<MessageConversationResult> {
  return apiClient.post<MessageConversationResult>(
    `/messages/conversations/${encodeURIComponent(id)}/members/remove`,
    { username }
  );
}

export async function fetchMarkConversationRead(conversationId: string): Promise<void> {
  await apiClient.post(`/messages/conversations/${encodeURIComponent(conversationId)}/read`);
}

export async function fetchMarkLinkedChatRead(subjectType: string, subjectId: string): Promise<void> {
  await apiClient.post('/messages/linked-chats/read', { subjectType, subjectId });
}

export const messagesDomain: Partial<AppAdapter> = {
  getMessages: fetchMessages,
  getLinkedChats: fetchLinkedChats,
  getConversationMessages: fetchConversationMessages,
  getMessageContacts: fetchMessageContacts,
  sendMessage: fetchSendMessage,
  startDirectMessage: fetchStartDirectMessage,
  createGroupConversation: fetchCreateGroupConversation,
  renameGroupConversation: fetchRenameGroupConversation,
  addGroupConversationMember: fetchAddGroupConversationMember,
  removeGroupConversationMember: fetchRemoveGroupConversationMember,
  markConversationRead: fetchMarkConversationRead,
  markLinkedChatRead: fetchMarkLinkedChatRead
};
