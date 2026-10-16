import type { PublicFeedItem, VoteDirection } from '$lib/types/feed';

export type ScopeKind = 'channel' | 'community' | 'platform';

export type ConfidenceStandingState = 'active' | 'grace' | 'below-threshold' | 'qualifying';

export interface ScopeMemberSummary {
  id: string;
  username: string;
  profileImageUrl?: string | null;
  bio?: string;
  confidenceTargetId?: string;
  confidenceVoteCount?: number;
  confidenceActiveVote?: VoteDirection;
  confidenceUpVotes?: number;
  confidenceDownVotes?: number;
  confidenceRatio?: number;
  confidenceReviewCount?: number;
  confidenceVotesRequired?: number;
  confidenceWeeklyActiveUserCount?: number;
  confidenceStandingState?: ConfidenceStandingState;
  confidenceGraceEndsAt?: string;
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

export interface ScopePlaceholderSection {
  id: string;
  title: string;
  body: string;
  statusLabel?: string;
}

export interface ScopePageData {
  kind: ScopeKind;
  slug: string;
  title: string;
  description: string;
  /** Uploaded picture; null keeps the default channel/community icon. */
  imageUrl?: string | null;
  /** Open settings votes the viewer hasn't voted on yet. */
  openVotes?: number;
  governance?: 'collaborative' | 'organizer';
  note?: string;
  badges: string[];
  moderatorNote?: string;
  emptyFeedText: string;
  membership: ScopeMembershipState;
  feed: PublicFeedItem[];
  moderators?: ScopeMemberSummary[];
  moderatorCandidates?: ScopeMemberSummary[];
  moderatorCandidacyOptions?: { viewerState: string | null; canVolunteer: boolean } | null;
  moderatorFeatureFrames?: ScopePlaceholderSection[];
  stats: ScopeStats;
}