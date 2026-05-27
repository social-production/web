import { apiClient } from '../client';
import type { MessagesPageData, MessageConversationResult, CreateGroupMessageInput } from '$lib/types/inbox';
import type { ViewerSummary } from '$lib/types/bootstrap';

interface BackendUser { id: string; username: string; bio: string | null; profile_image_url: string | null; }
interface BackendParticipant { id: string; username: string; }
interface BackendConversation {
  id: string; kind: string; title: string | null; created_by: string | null;
  created_at: string; updated_at: string; last_message_at: string | null;
  participants: BackendParticipant[];
}
interface BackendConversationResponse { conversation: BackendConversation; }
interface BackendConversationsListResponse { total: number; items: BackendConversation[]; }

function mapParticipant(p: BackendParticipant): ViewerSummary {
  return { id: p.id, username: p.username };
}

function mapConversation(c: BackendConversation) {
  return {
    id: c.id,
    kind: c.kind as 'direct' | 'group',
    title: c.title ?? c.participants.map(p => p.username).join(', '),
    participants: c.participants.map(mapParticipant),
    preview: '',
    lastMessageAt: c.last_message_at ?? c.created_at,
    unreadCount: 0,
    messages: []
  };
}

export async function fetchMessages(): Promise<MessagesPageData | null> {
  try {
    const [convsRes, meRes] = await Promise.all([
      apiClient.get<BackendConversationsListResponse>('/messages/conversations'),
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
      conversations: convsRes.items.map(mapConversation),
      linkedChats: [],
      suggestedContacts: [],
      activeConversationId: null
    };
  } catch (err) {
    if ((err as { status?: number }).status === 401) return null;
    throw err;
  }
}

export async function fetchSendMessage(conversationId: string, body: string): Promise<void> {
  await apiClient.post(`/messages/conversations/${conversationId}/messages`, { body });
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
    const message = (err as { body?: { detail?: string } }).body?.detail ?? 'Could not start conversation';
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
    const message = (err as { body?: { detail?: string } }).body?.detail ?? 'Could not create group';
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
    const message = (err as { body?: { detail?: string } }).body?.detail ?? 'Could not rename conversation';
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
    const message = (err as { body?: { detail?: string } }).body?.detail ?? 'Could not add member';
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
    const message = (err as { body?: { detail?: string } }).body?.detail ?? 'Could not remove member';
    return { ok: false, error: message };
  }
}

export async function fetchMarkConversationRead(conversationId: string): Promise<void> {
  await apiClient.post(`/messages/conversations/${conversationId}/read`);
}
