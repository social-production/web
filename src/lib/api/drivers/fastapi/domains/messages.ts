import { apiClient, extractErrorMessage } from '../client';
import type {
  CreateGroupMessageInput,
  DirectMessage,
  MessageConversationResult,
  MessagesPageData
} from '$lib/types/inbox';
import type { ViewerSummary } from '$lib/types/bootstrap';

interface BackendUser {
  id: string;
  username: string;
  bio: string | null;
  profile_image_url: string | null;
}

interface BackendParticipant {
  id: string;
  username: string;
}

interface BackendConversation {
  id: string;
  kind: string;
  title: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  preview?: string;
  unread_count?: number;
  participants: BackendParticipant[];
}

interface BackendConversationResponse {
  conversation: BackendConversation;
}

interface BackendConversationsListResponse {
  total: number;
  items: BackendConversation[];
}

interface BackendMessage {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

interface BackendConversationMessagesResponse {
  conversation_id: string;
  total: number;
  items: BackendMessage[];
}

interface BackendLinkedChat {
  id: string;
  kind: string;
  entity_id: string;
  entity_slug: string;
  title: string;
  preview: string;
  last_message_at: string;
  comment_count: number;
  unread_count?: number;
}

interface BackendLinkedChatsResponse {
  total: number;
  items: BackendLinkedChat[];
}

interface BackendMessageContact {
  id: string;
  username: string;
  bio: string | null;
  profileImageUrl: string | null;
}

interface BackendMessageContactsResponse {
  total: number;
  items: BackendMessageContact[];
}

function mapParticipant(p: BackendParticipant): ViewerSummary {
  return { id: p.id, username: p.username };
}

function mapConversation(c: BackendConversation, viewerId?: string) {
  const participants = c.participants.map(mapParticipant);
  const directPartner =
    c.kind === 'direct'
      ? participants.find((participant) => participant.id !== viewerId) ?? participants[0]
      : null;

  return {
    id: c.id,
    kind: c.kind as 'direct' | 'group',
    title:
      c.kind === 'direct'
        ? (directPartner?.username ?? c.participants.map((p) => p.username).join(', '))
        : (c.title ?? c.participants.map((p) => p.username).join(', ')),
    participants,
    preview: c.preview ?? '',
    lastMessageAt: c.last_message_at ?? c.created_at,
    unreadCount: c.unread_count ?? 0,
    messages: [] as DirectMessage[]
  };
}

function mapMessage(
  message: BackendMessage,
  viewerId: string,
  participants: ViewerSummary[]
): DirectMessage {
  const participantById = new Map(participants.map((participant) => [participant.id, participant]));
  const senderId = message.sender_id ?? '';
  const sender = participantById.get(senderId) ?? { id: senderId, username: 'unknown' };

  return {
    id: message.id,
    sender,
    body: message.body,
    createdAt: message.created_at,
    isOwn: senderId === viewerId,
    report: null
  };
}

export async function fetchMessages(): Promise<MessagesPageData | null> {
  try {
    const [convsRes, linkedRes, meRes] = await Promise.all([
      apiClient.get<BackendConversationsListResponse>('/messages/conversations'),
      apiClient.get<BackendLinkedChatsResponse>('/messages/linked-chats'),
      apiClient.get<{ user: BackendUser }>('/users/me')
    ]);
    const viewer: ViewerSummary = {
      id: meRes.user.id,
      username: meRes.user.username,
      bio: meRes.user.bio ?? undefined,
      profileImageUrl: meRes.user.profile_image_url ?? undefined
    };
    return {
      viewer,
      conversations: convsRes.items.map((conversation) => mapConversation(conversation, viewer.id)),
      linkedChats: linkedRes.items.map((chat) => ({
        id: chat.id,
        kind: chat.kind as 'project' | 'event',
        subjectId: chat.entity_id,
        title: chat.title,
        href: `/${chat.kind}s/${chat.entity_slug}`,
        meta: `${chat.comment_count} comments`,
        preview: chat.preview,
        lastMessageAt: chat.last_message_at,
        unreadCount: chat.unread_count ?? 0,
        comments: []
      })),
      suggestedContacts: [],
      activeConversationId: null
    };
  } catch (err) {
    if ((err as { status?: number }).status === 401) return null;
    throw err;
  }
}

export async function fetchConversationMessages(
  conversationId: string,
  viewerId: string,
  participants: ViewerSummary[]
): Promise<DirectMessage[]> {
  const res = await apiClient.get<BackendConversationMessagesResponse>(
    `/messages/conversations/${conversationId}/messages`
  );
  return res.items.map((message) => mapMessage(message, viewerId, participants));
}

export async function fetchMessageContacts(query: string, limit = 8): Promise<ViewerSummary[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (query.trim()) {
    params.set('q', query.trim());
  }

  const res = await apiClient.get<BackendMessageContactsResponse>(`/messages/contacts?${params.toString()}`);
  return res.items.map((contact) => ({
    id: contact.id,
    username: contact.username,
    bio: contact.bio ?? undefined,
    profileImageUrl: contact.profileImageUrl ?? undefined
  }));
}

export async function fetchSendMessage(conversationId: string, body: string): Promise<void> {
  try {
    await apiClient.post(`/messages/conversations/${conversationId}/messages`, { body });
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Could not send message'));
  }
}

export async function fetchStartDirectMessage(
  participantUsername: string,
  body: string
): Promise<MessageConversationResult> {
  try {
    const res = await apiClient.post<BackendConversationResponse>('/messages/direct', {
      other_username: participantUsername
    });
    const conversationId = res.conversation.id;
    await apiClient.post(`/messages/conversations/${conversationId}/messages`, { body });
    return { ok: true, conversationId };
  } catch (err) {
    const message = extractErrorMessage(err, 'Could not start conversation');
    return { ok: false, error: message };
  }
}

export async function fetchCreateGroupConversation(
  input: CreateGroupMessageInput
): Promise<MessageConversationResult> {
  try {
    const res = await apiClient.post<BackendConversationResponse>('/messages/group', {
      title: input.title,
      participant_usernames: input.memberUsernames
    });
    const conversationId = res.conversation.id;
    if (input.body) {
      await apiClient.post(`/messages/conversations/${conversationId}/messages`, { body: input.body });
    }
    return { ok: true, conversationId };
  } catch (err) {
    const message = extractErrorMessage(err, 'Could not create group');
    return { ok: false, error: message };
  }
}

export async function fetchRenameGroupConversation(
  conversationId: string,
  title: string
): Promise<MessageConversationResult> {
  try {
    await apiClient.patch(`/messages/conversations/${conversationId}`, { title });
    return { ok: true, conversationId };
  } catch (err) {
    const message = extractErrorMessage(err, 'Could not rename conversation');
    return { ok: false, error: message };
  }
}

export async function fetchAddGroupConversationMember(
  conversationId: string,
  username: string
): Promise<MessageConversationResult> {
  try {
    await apiClient.post(`/messages/conversations/${conversationId}/members`, { username });
    return { ok: true, conversationId };
  } catch (err) {
    const message = extractErrorMessage(err, 'Could not add member');
    return { ok: false, error: message };
  }
}

export async function fetchRemoveGroupConversationMember(
  conversationId: string,
  username: string
): Promise<MessageConversationResult> {
  try {
    await apiClient.delete(`/messages/conversations/${conversationId}/members/${username}`);
    return { ok: true, conversationId };
  } catch (err) {
    const message = extractErrorMessage(err, 'Could not remove member');
    return { ok: false, error: message };
  }
}

export async function fetchMarkConversationRead(conversationId: string): Promise<void> {
  await apiClient.post(`/messages/conversations/${conversationId}/read`);
}

export async function fetchMarkLinkedChatRead(subjectType: string, subjectId: string): Promise<void> {
  await apiClient.post(`/messages/linked-chats/${subjectType}/${subjectId}/read`);
}
