import type { ViewerSummary } from '$lib/types/bootstrap';
import type { PersonalFeedItem } from '$lib/types/feed';

export interface AccountOption {
  value: string;
  label: string;
  description: string;
}

export interface OnboardingPageData {
  title: string;
  intro: string;
  accountModes: AccountOption[];
  starterChannels: string[];
  starterCommunities: string[];
}

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export interface SignInInput {
  username: string;
  password: string;
}

export interface SignUpInput {
  username: string;
  password: string;
  profileBio?: string;
}

export type FollowStatus = 'pending' | 'accepted' | null;

export interface ProfilePageData {
  username: string;
  bio?: string;
  profileImageUrl?: string;
  followersCount: number;
  followingCount: number;
  followers: ViewerSummary[];
  following: ViewerSummary[];
  pendingFollowRequests: ViewerSummary[];
  canViewPersonalFeed: boolean;
  canViewPublicProfileActivity: boolean;
  viewerIsFollowing: boolean;
  viewerFollowStatus: FollowStatus;
  isOwnProfile: boolean;
  feed: PersonalFeedItem[];
}

export type AppearanceThemeMode = 'dark' | 'light';
export type PreferredLanguage = 'en' | 'nl';
export type DefaultFeedMode = 'public' | 'personal';
export type FeedSortPreference = 'trending' | 'recent';
export type FeedWindowPreference = 'today' | 'week' | 'month' | 'all';
export type PublicFeedScopePreference = 'home' | 'global' | 'region';
export type PublicFeedFilterPreference = 'all' | 'projects' | 'threads' | 'events' | 'help_requests';
export type PersonalFeedScopePreference = 'following' | 'popular';
export type PersonalFeedFilterPreference = 'all' | 'activity' | 'posts' | 'events' | 'help_requests';

export interface PublicFeedPreferences {
  scope: PublicFeedScopePreference;
  filter: PublicFeedFilterPreference;
  sort: FeedSortPreference;
  window: FeedWindowPreference;
}

export interface PersonalFeedPreferences {
  scope: PersonalFeedScopePreference;
  filter: PersonalFeedFilterPreference;
  sort: FeedSortPreference;
  window: FeedWindowPreference;
}

export const NOTIFICATION_CATEGORIES = [
  'follows',
  'comments',
  'shares_invites',
  'roles',
  'votes_needed',
  'phase_done',
  'plan_leading'
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const DEFAULT_NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  'follows',
  'comments',
  'shares_invites',
  'roles',
  'votes_needed',
  'phase_done'
];

export function normalizeNotificationCategories(value: unknown): NotificationCategory[] {
  const allowed = new Set<string>(NOTIFICATION_CATEGORIES);
  const raw = Array.isArray(value) ? value : DEFAULT_NOTIFICATION_CATEGORIES;
  const seen = new Set<string>();
  const categories: NotificationCategory[] = [];

  for (const item of raw) {
    const key = String(item);
    if (!allowed.has(key) || seen.has(key)) {
      continue;
    }
    seen.add(key);
    categories.push(key as NotificationCategory);
  }

  return categories;
}

export interface SettingsPageData {
  profileUsername: string;
  profileBio: string;
  profileImageUrl: string;
  appearanceThemeMode: AppearanceThemeMode;
  defaultFeed: DefaultFeedMode;
  publicFeedPreferences: PublicFeedPreferences;
  personalFeedPreferences: PersonalFeedPreferences;
  hidePublicActivityFromPersonalFeeds: boolean;
  hidePersonalFeedFromNonFollowers: boolean;
  hidePublicProfileActivityFromNonFollowers: boolean;
  requireFollowApproval: boolean;
  preferredLanguage: PreferredLanguage;
  displayTimezone: string | null;
  defaultLocationId: string | null;
  notificationCategories: NotificationCategory[];
}

export interface SettingsUpdateInput {
  profileBio?: string;
  profileImageUrl?: string;
  appearanceThemeMode?: AppearanceThemeMode;
  defaultFeed?: DefaultFeedMode;
  publicFeedPreferences?: PublicFeedPreferences;
  personalFeedPreferences?: PersonalFeedPreferences;
  hidePublicActivityFromPersonalFeeds?: boolean;
  hidePersonalFeedFromNonFollowers?: boolean;
  hidePublicProfileActivityFromNonFollowers?: boolean;
  requireFollowApproval?: boolean;
  preferredLanguage?: PreferredLanguage;
  displayTimezone?: string | null;
  defaultLocationId?: string | null;
  notificationCategories?: NotificationCategory[];
}