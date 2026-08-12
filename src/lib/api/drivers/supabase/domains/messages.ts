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

export async function fetchMessages(): Promise<MessagesPageData | null> {
  try {
    // Conversations payload already embeds linkedChats — avoid a second round-trip.
    const page = await apiClient.get<MessagesPageData & { linkedChats?: MessageLinkedChat[] }>(
      '/messages/conversations'
    );

    return {
      ...page,
      linkedChats: page.linkedChats ?? []
    };
  } catch (err) {
    if ((err as { status?: number }).status === 401) return null;
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
