import type { ViewerSummary } from '$lib/types/bootstrap';

export type TagKind = 'channel' | 'community';
export type ProjectMode = 'productive' | 'collective-service' | 'personal-service';
export type SubjectKind = 'project' | 'thread' | 'event' | 'post';
export type VoteDirection = -1 | 0 | 1;

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
  summary: string;
  locationLabel: string;
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

export interface CreateEventInput {
  title: string;
  description: string;
  startTimeLabel: string;
  finishTimeLabel: string;
  locationLabel: string;
  channelTags: TagRef[];
  communityTags: TagRef[];
  invitedUsernames: string[];
}

export interface CreatePostInput {
  body: string;
  audience: 'followers' | 'public';
}

export interface CreateChannelInput {
  name: string;
  description: string;
}

export interface CreateCommunityInput {
  name: string;
  description: string;
  joinPolicy: 'open' | 'invite_only';
}

export interface PublicProjectItem {
  kind: 'project';
  id: string;
  slug: string;
  href: string;
  createdAt: string;
  title: string;
  authorUsername: string;
  projectMode: ProjectMode;
  summary: string;
  latestDescription?: string;
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
}

export interface PublicThreadItem {
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

export interface PublicEventItem {
  kind: 'event';
  id: string;
  slug: string;
  href: string;
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
  goingCount: number;
  lastActivityAt: string;
}

export type PublicFeedItem =
  | PublicProjectItem
  | PublicThreadItem
  | PublicEventItem;

export interface PersonalPostItem {
  kind: 'post';
  id: string;
  href: string;
  author: ViewerSummary;
  audience: 'followers' | 'public';
  voteTargetId: string;
  body: string;
  voteCount: number;
  activeVote: VoteDirection;
  commentCount: number;
  createdAt: string;
}

export interface PersonalActivityItem {
  kind: 'activity';
  id: string;
  subjectId: string;
  href: string;
  author: ViewerSummary;
  actionLabel: string;
  subjectKind: Exclude<SubjectKind, 'post'>;
  subjectProjectMode?: ProjectMode;
  title: string;
  body: string;
  meta: string;
  voteCount: number;
  activeVote: VoteDirection;
  commentCount: number;
  createdAt: string;
  channelTags: TagRef[];
  communityTags: TagRef[];
}

export type PersonalFeedItem = PersonalPostItem | PersonalActivityItem;