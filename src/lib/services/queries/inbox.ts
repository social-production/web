import { currentAdapter } from '$lib/services/adapters';
import type { CreateGroupMessageInput, DirectMessage } from '$lib/types/inbox';
import type { ViewerSummary } from '$lib/types/bootstrap';

export function getNotifications() {
  return currentAdapter.getNotifications();
}

export function getMessages() {
  return currentAdapter.getMessages();
}

export function getLinkedChats() {
  return currentAdapter.getLinkedChats();
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

export function getSubjectComments(subjectType: string, subjectId: string) {
  return currentAdapter.getComments(subjectType, subjectId);
}

/** @deprecated Import mutations from `$lib/services/commands/inbox`. */
export {
  syncUnreadCountsFromBootstrap,
  refreshUnreadCounts,
  markNotificationRead,
  markAllNotificationsRead,
  markConversationRead,
  markLinkedChatRead,
  sendMessage,
  startDirectMessage,
  createGroupConversation,
  renameGroupConversation,
  addGroupConversationMember,
  removeGroupConversationMember
} from '$lib/services/commands/inbox';

export type { CreateGroupMessageInput, DirectMessage };
