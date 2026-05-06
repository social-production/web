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
  visibilityOptions: AccountOption[];
  starterChannels: string[];
  starterCommunities: string[];
}

export interface ProfilePageData {
  username: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  followers: ViewerSummary[];
  following: ViewerSummary[];
  canViewPersonalFeed: boolean;
  feed: PersonalFeedItem[];
}

export type AppearanceThemeMode = 'dark' | 'light';
export type DefaultFeedMode = 'public' | 'personal';

export interface SettingsPageData {
  profileUsername: string;
  profileBio: string;
  appearanceThemeMode: AppearanceThemeMode;
  defaultFeed: DefaultFeedMode;
  hidePublicActivityFromPersonalFeeds: boolean;
  hidePersonalFeedFromNonFollowers: boolean;
  requireFollowApproval: boolean;
}

export interface SettingsUpdateInput {
  profileBio?: string;
  appearanceThemeMode?: AppearanceThemeMode;
  defaultFeed?: DefaultFeedMode;
  hidePublicActivityFromPersonalFeeds?: boolean;
  hidePersonalFeedFromNonFollowers?: boolean;
  requireFollowApproval?: boolean;
}