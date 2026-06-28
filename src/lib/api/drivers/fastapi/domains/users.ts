import { apiClient } from '../client';
import { mapPersonalItem, registerFeedEntity } from './feeds';
import type { ProfilePageData, SettingsPageData, SettingsUpdateInput } from '$lib/types/account';
import type { ViewerSummary } from '$lib/types/bootstrap';

interface BackendUser {
  id: string;
  username: string;
  bio: string | null;
  profile_image_url: string | null;
  is_active: boolean;
}

interface BackendSettings {
  appearance_theme_mode: string;
  default_feed: string;
  public_feed_scope: string;
  public_feed_filter: string;
  public_feed_sort: string;
  public_feed_window: string;
  personal_feed_scope: string;
  personal_feed_filter: string;
  personal_feed_sort: string;
  personal_feed_window: string;
  hide_public_activity_from_personal_feeds: boolean;
  hide_personal_feed_from_non_followers: boolean;
  hide_public_profile_activity_from_non_followers: boolean;
  require_follow_approval: boolean;
  preferred_language: string;
}

interface BackendFollowItem extends BackendUser {
  follow_status: string;
}

interface BackendFollowList {
  username: string;
  total: number;
  items: BackendFollowItem[];
}

interface BackendProfileResponse {
  user: BackendUser;
  viewer_is_following: boolean;
  viewer_follow_status: string | null;
  is_own_profile: boolean;
  can_view_personal_feed: boolean;
  can_view_public_profile_activity: boolean;
}

interface BackendFollowRequestList {
  total: number;
  items: BackendFollowItem[];
}

function mapUser(u: BackendUser): ViewerSummary {
  return {
    id: u.id,
    username: u.username,
    bio: u.bio ?? undefined,
    profileImageUrl: u.profile_image_url ?? undefined,
  };
}

function mapSettings(user: BackendUser, s: BackendSettings): SettingsPageData {
  return {
    profileUsername: user.username,
    profileBio: user.bio ?? '',
    profileImageUrl: user.profile_image_url ?? '',
    appearanceThemeMode: s.appearance_theme_mode as SettingsPageData['appearanceThemeMode'],
    defaultFeed: s.default_feed as SettingsPageData['defaultFeed'],
    publicFeedPreferences: {
      scope: s.public_feed_scope as never,
      filter: s.public_feed_filter as never,
      sort: s.public_feed_sort as never,
      window: s.public_feed_window as never,
    },
    personalFeedPreferences: {
      scope: s.personal_feed_scope as never,
      filter: s.personal_feed_filter as never,
      sort: s.personal_feed_sort as never,
      window: s.personal_feed_window as never,
    },
    hidePublicActivityFromPersonalFeeds: s.hide_public_activity_from_personal_feeds,
    hidePersonalFeedFromNonFollowers: s.hide_personal_feed_from_non_followers,
    hidePublicProfileActivityFromNonFollowers: s.hide_public_profile_activity_from_non_followers,
    requireFollowApproval: s.require_follow_approval,
    preferredLanguage: (s.preferred_language === 'nl' ? 'nl' : 'en') as SettingsPageData['preferredLanguage'],
  };
}

export async function fetchSettings(): Promise<SettingsPageData | null> {
  try {
    const res = await apiClient.get<{ user: BackendUser; settings: BackendSettings }>('/users/me');
    return mapSettings(res.user, res.settings);
  } catch (err) {
    if ((err as { status?: number }).status === 401) {
      return null;
    }

    throw err;
  }
}

export async function fetchUpdateSettings(input: SettingsUpdateInput): Promise<void> {
  const body: Record<string, unknown> = {};
  if (input.profileBio !== undefined) body.bio = input.profileBio;
  if (input.profileImageUrl !== undefined) body.profile_image_url = input.profileImageUrl;
  if (input.appearanceThemeMode !== undefined) body.appearance_theme_mode = input.appearanceThemeMode;
  if (input.defaultFeed !== undefined) body.default_feed = input.defaultFeed;
  if (input.publicFeedPreferences !== undefined) {
    body.public_feed_scope = input.publicFeedPreferences.scope;
    body.public_feed_filter = input.publicFeedPreferences.filter;
    body.public_feed_sort = input.publicFeedPreferences.sort;
    body.public_feed_window = input.publicFeedPreferences.window;
  }
  if (input.personalFeedPreferences !== undefined) {
    body.personal_feed_scope = input.personalFeedPreferences.scope;
    body.personal_feed_filter = input.personalFeedPreferences.filter;
    body.personal_feed_sort = input.personalFeedPreferences.sort;
    body.personal_feed_window = input.personalFeedPreferences.window;
  }
  if (input.hidePublicActivityFromPersonalFeeds !== undefined)
    body.hide_public_activity_from_personal_feeds = input.hidePublicActivityFromPersonalFeeds;
  if (input.hidePersonalFeedFromNonFollowers !== undefined)
    body.hide_personal_feed_from_non_followers = input.hidePersonalFeedFromNonFollowers;
  if (input.hidePublicProfileActivityFromNonFollowers !== undefined)
    body.hide_public_profile_activity_from_non_followers = input.hidePublicProfileActivityFromNonFollowers;
  if (input.requireFollowApproval !== undefined)
    body.require_follow_approval = input.requireFollowApproval;
  if (input.preferredLanguage !== undefined)
    body.preferred_language = input.preferredLanguage;
  await apiClient.patch('/users/me/settings', body);
}

export async function fetchProfile(username: string): Promise<ProfilePageData | null> {
  try {
    const profileRes = await apiClient.get<BackendProfileResponse>(`/users/${username}`);
    const [followersRes, followingRes, feedRes, followRequestsRes] = await Promise.all([
      apiClient.get<BackendFollowList>(`/users/${username}/followers`),
      apiClient.get<BackendFollowList>(`/users/${username}/following`),
      apiClient.get<{ items: Parameters<typeof mapPersonalItem>[0][] }>(`/feeds/user/${encodeURIComponent(username)}`),
      profileRes.is_own_profile
        ? apiClient.get<BackendFollowRequestList>('/users/me/follow-requests')
        : Promise.resolve({ total: 0, items: [] }),
    ]);
    return {
      username: profileRes.user.username,
      bio: profileRes.user.bio ?? undefined,
      profileImageUrl: profileRes.user.profile_image_url ?? undefined,
      followersCount: followersRes.total,
      followingCount: followingRes.total,
      followers: followersRes.items.map(mapUser),
      following: followingRes.items.map(mapUser),
      pendingFollowRequests: followRequestsRes.items.map(mapUser),
      canViewPersonalFeed: profileRes.can_view_personal_feed,
      canViewPublicProfileActivity: profileRes.can_view_public_profile_activity,
      viewerIsFollowing: profileRes.viewer_is_following,
      viewerFollowStatus: (profileRes.viewer_follow_status as ProfilePageData['viewerFollowStatus']) ?? null,
      isOwnProfile: profileRes.is_own_profile,
      feed: feedRes.items.flatMap((item) => {
        registerFeedEntity(item);
        const m = mapPersonalItem(item);
        return m ? [m] : [];
      }),
    };
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export async function fetchFollowUser(username: string): Promise<{ followStatus: string | null }> {
  const res = await apiClient.post<{ follow_status?: string | null }>(`/users/${encodeURIComponent(username)}/follow`, {});
  return { followStatus: res.follow_status ?? null };
}

export async function fetchUnfollowUser(username: string): Promise<void> {
  await apiClient.delete(`/users/${encodeURIComponent(username)}/follow`);
}

export async function fetchAcceptFollowRequest(username: string): Promise<void> {
  await apiClient.post(`/users/me/follow-requests/${encodeURIComponent(username)}/accept`, {});
}

export async function fetchRejectFollowRequest(username: string): Promise<void> {
  await apiClient.post(`/users/me/follow-requests/${encodeURIComponent(username)}/reject`, {});
}

export async function fetchFollowRequests(): Promise<ViewerSummary[]> {
  const res = await apiClient.get<BackendFollowRequestList>('/users/me/follow-requests');
  return res.items.map(mapUser);
}
