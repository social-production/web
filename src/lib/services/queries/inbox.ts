import { currentAdapter } from '$lib/services/adapters';
import type { CreateGroupMessageInput, DirectMessage } from '$lib/types/inbox';
import type { ViewerSummary } from '$lib/types/bootstrap';

export function getNotifications() {
  return currentAdapter.getNotifications();
}

export function getMessages() {
  return currentAdapter.getMessages();
}

export function getConversationMessages(
  conversationId: string,
  viewerId: string,
  participants: ViewerSummary[]
): Promise<DirectMessage[]> {
  return currentAdapter.getConversationMessages(conversationId, viewerId, participants);
}

export function getMessageContacts(query: string, limit?: number): Promise<ViewerSummary[]> {
  return currentAdapter.getMessageContacts(query, limit);
}

export function markNotificationRead(notificationId: string) {
  return currentAdapter.markNotificationRead(notificationId);
}

export function markAllNotificationsRead() {
  return currentAdapter.markAllNotificationsRead();
}

export function markConversationRead(conversationId: string) {
  return currentAdapter.markConversationRead(conversationId);
}

export function markLinkedChatRead(subjectType: string, subjectId: string) {
  return currentAdapter.markLinkedChatRead(subjectType, subjectId);
}

export function sendMessage(threadId: string, body: string) {
  return currentAdapter.sendMessage(threadId, body);
}

export function startDirectMessage(participantUsername: string, body: string) {
  return currentAdapter.startDirectMessage(participantUsername, body);
}

export function createGroupConversation(input: CreateGroupMessageInput) {
  return currentAdapter.createGroupConversation(input);
}

export function renameGroupConversation(conversationId: string, title: string) {
  return currentAdapter.renameGroupConversation(conversationId, title);
}

export function addGroupConversationMember(conversationId: string, username: string) {
  return currentAdapter.addGroupConversationMember(conversationId, username);
}

export function removeGroupConversationMember(conversationId: string, username: string) {
  return currentAdapter.removeGroupConversationMember(conversationId, username);
}