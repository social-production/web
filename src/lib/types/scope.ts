import type { PublicFeedItem, VoteDirection } from '$lib/types/feed';

export type ScopeKind = 'channel' | 'community' | 'platform';

export interface ScopeMemberSummary {
  id: string;
  username: string;
  bio?: string;
  confidenceTargetId?: string;
  confidenceVoteCount?: number;
  confidenceActiveVote?: VoteDirection;
  confidenceRatio?: number;
  confidenceReviewCount?: number;
}

export interface ScopeStats {
  projects: number;
  threads: number;
  events: number;
  members: number;
}

export interface ScopeMembershipState {
  memberCount: number;
  viewerIsMember: boolean;
  viewerCanToggleMembership: boolean;
  joinPolicy: 'open' | 'invite_only';
  viewerCanSeeFeed: boolean;
  hiddenFeedCopy?: string;
  inviteLink?: string;
}

export interface ScopePageData {
  kind: ScopeKind;
  slug: string;
  title: string;
  description: string;
  note?: string;
  badges: string[];
  moderationLabel: string;
  membersNote: string;
  moderatorsNote: string;
  emptyFeedText: string;
  membership: ScopeMembershipState;
  feed: PublicFeedItem[];
  members: ScopeMemberSummary[];
  moderators: ScopeMemberSummary[];
  stats: ScopeStats;
}