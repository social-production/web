import { currentAdapter } from '$lib/services/adapters';

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

export function markMessageThreadRead(threadId: string) {
  return currentAdapter.markMessageThreadRead(threadId);
}

export function sendMessage(threadId: string, body: string) {
  return currentAdapter.sendMessage(threadId, body);
}

export function startMessageThread(participantUsername: string, body: string) {
  return currentAdapter.startMessageThread(participantUsername, body);
}