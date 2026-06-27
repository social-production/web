import { get } from 'svelte/store';
import { page } from '$app/stores';
import { currentAdapter } from '$lib/services/adapters';
import { unreadCounts } from '$lib/stores/unreadCounts';
import type { CreateGroupMessageInput, DirectMessage } from '$lib/types/inbox';
import type { UnreadCounts, ViewerSummary } from '$lib/types/bootstrap';

function currentUnreadBase(): UnreadCounts | undefined {
  return get(unreadCounts) ?? get(page).data.bootstrap?.unreadCounts;
}

export function syncUnreadCountsFromBootstrap(counts: UnreadCounts) {
  unreadCounts.set(counts);
}

export async function refreshUnreadCounts() {
  const bootstrap = await currentAdapter.getBootstrap();
  syncUnreadCountsFromBootstrap(bootstrap.unreadCounts);
  return bootstrap.unreadCounts;
}

function decrementUnreadMessages(clearedCount = 1) {
  unreadCounts.update((current) => {
    const base: UnreadCounts | undefined = current ?? currentUnreadBase();

    if (!base) {
      return current;
    }

    return {
      ...base,
      messages: Math.max(0, base.messages - clearedCount)
    };
  });
}

function decrementUnreadNotifications(clearedCount = 1) {
  unreadCounts.update((current) => {
    const base: UnreadCounts | undefined = current ?? currentUnreadBase();

    if (!base) {
      return current;
    }

    return {
      ...base,
      notifications: Math.max(0, base.notifications - clearedCount)
    };
  });
}

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
  return currentAdapter.markNotificationRead(notificationId).then(() => {
    decrementUnreadNotifications(1);
  });
}

export function markAllNotificationsRead() {
  return currentAdapter.markAllNotificationsRead().then(() => {
    const base = currentUnreadBase();
    if (base) {
      syncUnreadCountsFromBootstrap({ ...base, notifications: 0 });
    }
  });
}

export function markConversationRead(conversationId: string, clearedCount = 1) {
  return currentAdapter.markConversationRead(conversationId).then(() => {
    decrementUnreadMessages(clearedCount);
  });
}

export function markLinkedChatRead(subjectType: string, subjectId: string, clearedCount = 1) {
  return currentAdapter.markLinkedChatRead(subjectType, subjectId).then(() => {
    decrementUnreadMessages(clearedCount);
  });
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
