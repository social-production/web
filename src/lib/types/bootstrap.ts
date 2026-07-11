import type { ProjectMode } from '$lib/types/feed';

export interface ViewerSummary {
  id: string;
  username: string;
  bio?: string;
  profileImageUrl?: string;
}

export interface FeatureFlags {
  assets: boolean;
  funding: boolean;
  platform: boolean;
}

export interface UnreadCounts {
  notifications: number;
  messages: number;
}

export interface ScopeDirectoryItem {
  slug: string;
  label: string;
  href: string;
  visibility?: 'public' | 'private';
  viewerIsMember?: boolean;
}

export interface ScopeDirectory {
  platform: ScopeDirectoryItem | null;
  channels: ScopeDirectoryItem[];
  communities: ScopeDirectoryItem[];
}

export interface RightRailActivityItem {
  id: string;
  subjectId: string;
  kind: 'project' | 'event' | 'request' | 'vote' | 'help-request-open' | 'help-request-signup' | 'help-request-owned';
  title: string;
  href: string;
  meta: string;
  createdAt: string;
  timeLabel?: string;
  countLabel?: string;
  body?: string;
  viewerIsAuthor?: boolean;
  viewerIsParticipating?: boolean;
  projectMode?: ProjectMode;
  projectSlug?: string;
  eventSlug?: string;
  activityId?: string;
  requestId?: string;
  requesterUsername?: string;
  conversationId?: string;
  activityRoleLabels?: string[];
  viewerAssignedRoleLabel?: string | null;
  hasOpenRole?: boolean;
  voteEntityKind?: 'project' | 'event';
  voteKindLabel?: string;
  voteTargetId?: string;
  voteSubKind?: 'criterion' | 'overall';
  planPhaseId?: 'phase-2' | 'phase-3';
  scheduledAt?: string;
  endsAt?: string;
  viewerParticipated?: boolean;
}

export interface BootstrapPayload {
  viewer: ViewerSummary | null;
  featureFlags: FeatureFlags;
  unreadCounts: UnreadCounts;
  directory: ScopeDirectory;
  suggestedContacts: ViewerSummary[];
  activityRail: RightRailActivityItem[];
  activityRailHistory: RightRailActivityItem[];
}