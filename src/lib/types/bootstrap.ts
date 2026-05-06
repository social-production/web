import type { ProjectMode } from '$lib/types/feed';

export interface ViewerSummary {
  id: string;
  username: string;
  bio?: string;
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
}

export interface ScopeDirectory {
  platform: ScopeDirectoryItem | null;
  channels: ScopeDirectoryItem[];
  communities: ScopeDirectoryItem[];
}

export interface RightRailActivityItem {
  id: string;
  subjectId: string;
  kind: 'project' | 'event';
  title: string;
  href: string;
  meta: string;
  createdAt: string;
  timeLabel?: string;
  countLabel?: string;
  viewerIsParticipating?: boolean;
  projectMode?: ProjectMode;
  projectSlug?: string;
  activityId?: string;
  activityRoleLabels?: string[];
  viewerAssignedRoleLabel?: string | null;
  projectHasOpenRole?: boolean;
}

export interface BootstrapPayload {
  viewer: ViewerSummary | null;
  featureFlags: FeatureFlags;
  unreadCounts: UnreadCounts;
  directory: ScopeDirectory;
  activityRail: RightRailActivityItem[];
}