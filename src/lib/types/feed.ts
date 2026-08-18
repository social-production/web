import type { ViewerSummary } from '$lib/types/bootstrap';
import type { ContentReportSummary, ModerationState } from '$lib/types/detail/shared';

export type TagKind = 'channel' | 'community';
export type ProjectMode = 'productive' | 'collective-service' | 'personal-service';
export type ProjectSubtype = 'standard' | 'software' | 'asset-management';
export type SubjectKind = 'project' | 'thread' | 'event' | 'post' | 'help-request';
export type VoteDirection = -1 | 0 | 1;
export type ViewerSignal = 'demand' | 'opposition' | null;
export type SignalToggleAction = 'added' | 'removed' | 'switched';

export interface FeedModerationFields {
  moderationState?: ModerationState;
  report?: ContentReportSummary | null;
  isUnderReview?: boolean;
  hasActiveReport?: boolean;
}

export interface SignalCounts {
  demand: number;
  opposition: number;
  total: number;
}

export interface SignalToggleResult {
  ok: boolean;
  slug: string;
  action: SignalToggleAction;
  signalType: 'demand' | 'opposition';
  signals: SignalCounts;
}
export type FeedSort = 'trending' | 'recent';
export type FeedWindow = 'today' | 'week' | 'month' | 'all';
export type FeedEntityFilter = 'all' | 'projects' | 'threads' | 'events' | 'help_requests';

export interface PostBodyLink {
  kind: 'project' | 'event';
  label: string;
  href: string;
}

export interface TagRef {
  slug: string;
  label: string;
  kind: TagKind;
}

export interface CreateResult {
  ok: boolean;
  slug?: string;
  id?: string;
  error?: string;
}

export interface CreateProjectInput {
  title: string;
  description: string;
  locationLabel: string;
  locationId?: string | null;
  locationIsOnline?: boolean;
  providerPlaceId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  region?: string | null;
  country?: string | null;
  precision?: string;
  projectMode: ProjectMode;
  channelTags: TagRef[];
  communityTags: TagRef[];
  note?: string;
  serviceRequestMode?: 'calendar' | 'direct' | 'both';
}

export interface CreateThreadInput {
  title: string;
  body: string;
  channelTags: TagRef[];
  communityTags: TagRef[];
}

export type EventAudience = 'public' | 'private_community' | 'invite_only';
export type EventGovernance = 'collaborative' | 'organizer_controlled';

export interface CreateEventInput {
  title: string;
  description: string;
  isPrivate?: boolean;
  audience: EventAudience;
  governance: EventGovernance;
  homeCommunitySlug?: string | null;
  channelTags: TagRef[];
  communityTags: TagRef[];
  invitedUsernames: string[];
  editorUsernames?: string[];
  locationLabel?: string;
  locationId?: string | null;
  timeLabel?: string;
  planTitle?: string;
  planDescription?: string;
  schedulePayload?: Record<string, unknown>;
  planPayload?: Record<string, unknown>;
}

export interface CreatePostInput {
  body: string;
  audience: 'followers' | 'public';
}

export interface CreateChannelInput {
  name: string;
  description: string;
  slug?: string;
}

export interface CreateCommunityInput {
  name: string;
  description: string;
  joinPolicy: 'open' | 'invite_only';
  slug?: string;
}

export interface HelpRequestRoleInput {
  title: string;
  description: string;
  slots: number;
}

export interface CreateHelpRequestInput {
  title: string;
  body: string;
  locationLabel: string;
  locationId?: string | null;
  neededAt: string;
  endsAt?: string | null;
  roles: HelpRequestRoleInput[];
  channelTags: TagRef[];
  communityTags: TagRef[];
}

export interface ProjectFundProgress {
  title: string;
  progressPercent: number;
  raisedLabel: string;
  targetLabel: string;
  status: 'active' | 'completed';
}

export interface PublicProjectItem extends FeedModerationFields {
  kind: 'project';
  id: string;
  slug: string;
  href: string;
  createdAt: string;
  title: string;
  authorUsername: string;
  projectMode: ProjectMode;
  projectSubtype?: ProjectSubtype | null;
  summary: string;
  latestDescription?: string;
  latestUpdateAt?: string;
  activityKind?: 'created' | 'updated';
  channelTags: TagRef[];
  communityTags: TagRef[];
  stage: string;
  locationLabel: string;
  voteCount: number;
  activeVote: VoteDirection;
  signalCount: number;
  supportCount: number;
  opposeCount: number;
  favorability: number | null;
  viewerSignal: ViewerSignal;
  isClosed?: boolean;
  commentCount: number;
  memberCount: number;
  lastActivityAt: string;
  fundProgress?: ProjectFundProgress;
}

export interface PublicThreadItem extends FeedModerationFields {
  kind: 'thread';
  id: string;
  slug: string;
  href: string;
  createdAt: string;
  title: string;
  body: string;
  authorUsername: string;
  channelTags: TagRef[];
  communityTags: TagRef[];
  voteCount: number;
  activeVote: VoteDirection;
  commentCount: number;
  lastActivityAt: string;
}

export interface PublicEventItem extends FeedModerationFields {
  kind: 'event';
  id: string;
  slug: string;
  href: string;
  createdAt: string;
  title: string;
  description: string;
  isPrivate: boolean;
  stage: string;
  scheduledAt?: string;
  channelTags: TagRef[];
  communityTags: TagRef[];
  createdByUsername: string;
  timeLabel: string;
  locationLabel: string;
  voteCount: number;
  activeVote: VoteDirection;
  supportCount: number;
  opposeCount: number;
  favorability: number | null;
  viewerSignal: ViewerSignal;
  isClosed?: boolean;
  commentCount: number;
  memberCount: number;
  lastActivityAt: string;
  latestUpdateBody?: string;
  latestUpdateAt?: string;
  activityKind?: 'created' | 'updated';
}

export interface PublicHelpRequestItem extends FeedModerationFields {
  kind: 'help-request';
  id: string;
  href: string;
  createdAt: string;
  title: string;
  body: string;
  authorUsername: string;
  locationLabel: string;
  scheduleLabel: string;
  neededAt?: string;
  roles: HelpRequestRoleInput[];
  channelTags: TagRef[];
  communityTags: TagRef[];
  voteCount: number;
  activeVote: VoteDirection;
  commentCount: number;
  lastActivityAt: string;
  signupCount?: number;
  slotsNeeded?: number;
}

export interface PublicProjectActivityItem {
  kind: 'project-activity';
  id: string;
  href: string;
  createdAt: string;
  title: string;
  parentTitle: string;
  projectMode: ProjectMode;
  scheduledAt: string;
  endsAt?: string | null;
  locationLabel: string;
  distanceKm: number;
  lastActivityAt: string;
}

export type PublicFeedItem =
  | PublicProjectItem
  | PublicProjectActivityItem
  | PublicThreadItem
  | PublicEventItem
  | PublicHelpRequestItem;

export interface PersonalPostItem extends FeedModerationFields {
  kind: 'post';
  id: string;
  href: string;
  author: ViewerSummary;
  feedSource?: 'following' | 'discovery';
  audience: 'followers' | 'public';
  voteTargetId: string;
  body: string;
  linkedSubjects?: PostBodyLink[];
  voteCount: number;
  activeVote: VoteDirection;
  commentCount: number;
  createdAt: string;
}

export interface PersonalActivityItem extends FeedModerationFields {
  kind: 'activity';
  id: string;
  subjectId: string;
  href: string;
  author: ViewerSummary;
  feedSource?: 'following' | 'discovery';
  actionLabel: string;
  subjectKind: Exclude<SubjectKind, 'post'>;
  subjectProjectMode?: ProjectMode;
  subjectSlug?: string;
  title: string;
  body: string;
  meta: string;
  voteCount: number;
  activeVote: VoteDirection;
  supportCount?: number;
  opposeCount?: number;
  favorability?: number | null;
  viewerSignal?: ViewerSignal;
  isClosed?: boolean;
  commentCount: number;
  createdAt: string;
  latestUpdateAt?: string;
  activityKind?: 'created' | 'updated';
  channelTags: TagRef[];
  communityTags: TagRef[];
  subjectFundProgress?: ProjectFundProgress;
}

export interface PersonalHelpRequestItem extends FeedModerationFields {
  kind: 'help-request';
  id: string;
  href: string;
  author: ViewerSummary;
  feedSource?: 'following' | 'discovery';
  title: string;
  body: string;
  locationLabel: string;
  scheduleLabel: string;
  neededAt?: string;
  roles: HelpRequestRoleInput[];
  channelTags: TagRef[];
  communityTags: TagRef[];
  voteCount: number;
  activeVote: VoteDirection;
  commentCount: number;
  signupCount?: number;
  slotsNeeded?: number;
  createdAt: string;
}

export type PersonalFeedItem =
  | PersonalPostItem
  | PersonalActivityItem
  | PersonalHelpRequestItem
  | PersonalCommentActivityItem;

export interface PersonalCommentActivityItem {
  kind: 'comment-activity';
  id: string;
  href: string;
  author: ViewerSummary;
  feedSource?: 'following' | 'discovery';
  subjectKind: SubjectKind;
  subjectTitle: string;
  commentExcerpt: string;
  voteTargetId: string;
  voteCount: number;
  activeVote: VoteDirection;
  commentCount: number;
  createdAt: string;
}