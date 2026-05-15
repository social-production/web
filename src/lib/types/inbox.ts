import type { ViewerSummary } from '$lib/types/bootstrap';
import type { ContentReportSummary, DetailComment } from '$lib/types/detail';
import type { ProjectMode, SubjectKind, TagRef } from '$lib/types/feed';

export interface NotificationItem {
  id: string;
  kind: 'reply' | 'mention' | 'message' | 'project' | 'event';
  surface: 'public' | 'personal';
  subjectKind: SubjectKind;
  projectMode?: ProjectMode;
  actorUsername?: string;
  actionLabel?: string;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  isUnread: boolean;
  channelTags: TagRef[];
  communityTags: TagRef[];
}

export interface NotificationsPageData {
  viewer: ViewerSummary;
  items: NotificationItem[];
}

export interface DirectMessage {
  id: string;
  sender: ViewerSummary;
  body: string;
  createdAt: string;
  isOwn: boolean;
  report?: ContentReportSummary | null;
}

export interface MessageConversationResult {
  ok: boolean;
  conversationId?: string;
  error?: string;
}

export interface CreateGroupMessageInput {
  title: string;
  memberUsernames: string[];
  body: string;
}

export interface MessageConversation {
  id: string;
  kind: 'direct' | 'group';
  title: string;
  participants: ViewerSummary[];
  preview: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: DirectMessage[];
}

export interface MessageLinkedChat {
  id: string;
  kind: 'project' | 'event';
  subjectId: string;
  title: string;
  href: string;
  meta: string;
  preview: string;
  lastMessageAt: string;
  comments: DetailComment[];
}

export interface MessagesPageData {
  viewer: ViewerSummary;
  conversations: MessageConversation[];
  linkedChats: MessageLinkedChat[];
  suggestedContacts: ViewerSummary[];
  activeConversationId: string | null;
}