import type { ViewerSummary } from '$lib/types/bootstrap';
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
}

export interface MessageThread {
  id: string;
  participant: ViewerSummary;
  preview: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: DirectMessage[];
}

export interface MessagesPageData {
  viewer: ViewerSummary;
  threads: MessageThread[];
  suggestedContacts: ViewerSummary[];
  activeThreadId: string | null;
}