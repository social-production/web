import type { PostBodyLink, ProjectMode, ProjectSubtype, TagRef, VoteDirection } from '$lib/types/feed';
import type { ContentReportSummary, DecisionHistoryEntry, DetailComment, DetailMember, DetailUpdate, EventEditRequest, EventLifecycleData, EventRoleMember, EventUpdateRequest, GovernanceSignalSummary, ProjectEditRequest, ProjectInventoryFrameData, ProjectLifecycleData, ProjectLinksFrameData, ProjectRoleMember, ProjectUpdateRequest } from './shared';

export interface ProjectPageData {
  id: string;
  slug: string;
  createdAt: string;
  title: string;
  authorUsername: string;
  projectMode: ProjectMode;
  projectSubtype?: ProjectSubtype | null;
  description: string;
  channelTags: TagRef[];
  communityTags: TagRef[];
  stage: string;
  locationLabel: string;
  voteCount: number;
  activeVote: VoteDirection;
  signalCount: number;
  commentCount: number;
  memberCount: number;
  lastActivityAt: string;
  lifecycle: ProjectLifecycleData;
  updates: DetailUpdate[];
  updateRequests: ProjectUpdateRequest[];
  viewerCanRequestUpdate: boolean;
  viewerCanVoteOnUpdateRequests: boolean;
  editRequests: ProjectEditRequest[];
  viewerCanRequestEdit: boolean;
  viewerCanVoteOnEditRequests: boolean;
  linksFrame: ProjectLinksFrameData;
  inventoryFrame: ProjectInventoryFrameData | null;
  history: DecisionHistoryEntry[];
  members: ProjectRoleMember[];
  viewerIsMember: boolean;
  viewerCanToggleMembership: boolean;
  viewerCanShare: boolean;
  shareContacts: DetailMember[];
  report: ContentReportSummary | null;
  isRemovedByReport: boolean;
  discussionNote: string;
  discussion: DetailComment[];
}

export interface ThreadPageData {
  id: string;
  slug: string;
  title: string;
  body: string;
  authorUsername: string;
  channelTags: TagRef[];
  communityTags: TagRef[];
  voteCount: number;
  activeVote: VoteDirection;
  commentCount: number;
  lastActivityAt: string;
  report: ContentReportSummary | null;
  isRemovedByReport: boolean;
  discussionNote: string;
  discussion: DetailComment[];
}

export interface PostPageData {
  id: string;
  authorUsername: string;
  authorProfileImageUrl?: string | null;
  body: string;
  linkedSubjects?: PostBodyLink[];
  audience: 'followers' | 'public';
  voteCount: number;
  activeVote: VoteDirection;
  commentCount: number;
  createdAt: string;
  report: ContentReportSummary | null;
  isRemovedByReport: boolean;
  discussionNote: string;
  discussion: DetailComment[];
}

export interface HelpRequestRoleData {
  roleId: string;
  title: string;
  description: string;
  slots: number;
  filledCount: number;
  isViewerAssigned: boolean;
}

export interface HelpRequestPageData {
  id: string;
  authorUsername: string;
  title: string;
  body: string;
  locationLabel: string;
  scheduleLabel: string;
  neededAt: string;
  roles: HelpRequestRoleData[];
  voteCount: number;
  activeVote: VoteDirection;
  commentCount: number;
  discussion: DetailComment[];
  channelTags: TagRef[];
  communityTags: TagRef[];
  createdAt: string;
}

export interface EventPageData {
  id: string;
  slug: string;
  createdAt: string;
  title: string;
  description: string;
  isPrivate: boolean;
  scheduledAt?: string;
  channelTags: TagRef[];
  communityTags: TagRef[];
  createdByUsername: string;
  timeLabel: string;
  locationLabel: string;
  voteCount: number;
  activeVote: VoteDirection;
  commentCount: number;
  memberCount: number;
  lastActivityAt: string;
  signalSummary: GovernanceSignalSummary | null;
  lifecycle: EventLifecycleData;
  attendanceNote: string;
  agenda: string[];
  updates: DetailUpdate[];
  updateRequests: EventUpdateRequest[];
  viewerCanRequestUpdate: boolean;
  viewerCanVoteOnUpdateRequests: boolean;
  editRequests: EventEditRequest[];
  viewerCanRequestEdit: boolean;
  viewerCanVoteOnEditRequests: boolean;
  history: DecisionHistoryEntry[];
  attendees: string[];
  invitedUsernames: string[];
  eventEditors: EventRoleMember[];
  members: EventRoleMember[];
  viewerIsMember: boolean;
  viewerCanToggleMembership: boolean;
  viewerHasEventEditAccess: boolean;
  viewerCanManageEditors: boolean;
  viewerCanShare: boolean;
  availableEditorInvitees: DetailMember[];
  shareContacts: DetailMember[];
  report: ContentReportSummary | null;
  isRemovedByReport: boolean;
  discussionNote: string;
  discussion: DetailComment[];
}