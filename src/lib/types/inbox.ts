import type { ViewerSummary } from '$lib/types/bootstrap';
import type { ContentReportSummary, DetailComment, ModerationState } from '$lib/types/detail';
import type { ProjectMode, SubjectKind, TagRef } from '$lib/types/feed';

export interface NotificationItem {
  id: string;
  kind: 'reply' | 'mention' | 'message' | 'project' | 'event' | 'follow-request' | 'follow-accepted' | 'new-follower' | 'help-request';
  surface: 'public' | 'personal';
  subjectKind: SubjectKind;
  projectMode?: ProjectMode;
  actorUsername?: string;
  actorProfileImageUrl?: string | null;
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

export interface MessageAttachment {
  id: string;
  kind: 'image' | 'file';
  filename: string;
  contentType: string;
  byteSize: number;
  url: string;
}

export interface DirectMessage {
  id: string;
  sender: ViewerSummary;
  body: string;
  createdAt: string;
  isOwn: boolean;
  report?: ContentReportSummary | null;
  moderationState?: ModerationState;
  attachments?: MessageAttachment[];
  pinned?: boolean;
  editedAt?: string | null;
  replyAuthor?: string | null;
  replyPreview?: string | null;
}

export interface ConversationPin {
  messageId: string;
  preview: string;
  pinnedAt: string;
}

export interface ConversationMessagesResult {
  messages: DirectMessage[];
  pins: ConversationPin[];
  canPin: boolean;
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
  pinned?: boolean;
  muted?: boolean;
  messages: DirectMessage[];
}

export interface MessageLinkedChat {
  id: string;
  kind: 'project' | 'event' | 'help_request';
  subjectId: string;
  title: string;
  href: string;
  meta: string;
  memberCount?: number;
  members?: string[];
  preview: string;
  lastMessageAt: string;
  unreadCount: number;
  pinned?: boolean;
  muted?: boolean;
  comments: DetailComment[];
}

export interface MessagesPageData {
  viewer: ViewerSummary;
  conversations: MessageConversation[];
  linkedChats: MessageLinkedChat[];
  suggestedContacts: ViewerSummary[];
  activeConversationId: string | null;
}