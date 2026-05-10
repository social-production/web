import { currentAdapter } from '$lib/services/adapters';
import type { CreateGroupMessageInput } from '$lib/types/inbox';

export function getNotifications() {
  return currentAdapter.getNotifications();
}

export function getMessages() {
  return currentAdapter.getMessages();
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