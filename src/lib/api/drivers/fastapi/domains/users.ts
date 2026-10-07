import { apiClient, extractErrorMessage } from '../client';
import { mapPersonalItem, registerFeedEntity } from './feeds';
import { DEFAULT_FEED_PAGE_SIZE } from '$lib/types/pagination';
import type {
  AccountTrust,
  ProfilePageData,
  SettingsPageData,
  SettingsUpdateInput,
} from '$lib/types/account';
import { normalizeNotificationCategories } from '$lib/types/account';
import type { ViewerSummary } from '$lib/types/bootstrap';
import {
  buildFeedQueryString,
  normalizeFeedFilter,
  normalizeFeedWindow,
  toFeedSortPreference,
} from '$lib/utils/feedQuery';

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
  display_timezone?: string | null;
  combine_feeds?: boolean;
  text_size?: string;
  default_location_id?: string | null;
  notification_categories?: string[] | null;
}

interface BackendFollowItem extends BackendUser {
  follow_status: string;
  real_r?: number | null;
  bootstrap_floor?: boolean;
}

interface BackendAccountTrust {
  real_r: number;
  vouch_weight: number;
  bot_weight: number;
  bootstrap_floor: boolean;
  bootstrap_floor_value?: number | null;
  vouchers: Array<string | { username: string; profile_image_url?: string | null }>;
  bot_markers: Array<string | { username: string; profile_image_url?: string | null }>;
  viewer_stance: 'vouch' | 'bot' | null;
  viewer_can_vouch: boolean;
  viewer_can_mark_bot: boolean;
  viewer_can_clear: boolean;
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
  trust?: BackendAccountTrust;
}

interface BackendFollowRequestList {
  total: number;
  items: BackendFollowItem[];
}

function mapTrustPeople(
  people: BackendAccountTrust['vouchers'] | undefined
): AccountTrust['vouchers'] {
  return (people ?? []).flatMap((person) => {
    if (typeof person === 'string') {
      return [{ username: person, profileImageUrl: null }];
    }
    if (!person?.username) return [];
    return [
      {
        username: person.username,
        profileImageUrl: person.profile_image_url ?? null
      }
    ];
  });
}

function mapTrust(trust: BackendAccountTrust): AccountTrust {
  return {
    realR: trust.real_r,
    vouchWeight: trust.vouch_weight,
    botWeight: trust.bot_weight,
    bootstrapFloor: trust.bootstrap_floor,
    bootstrapFloorValue:
      trust.bootstrap_floor && trust.bootstrap_floor_value != null
        ? trust.bootstrap_floor_value
        : null,
    vouchers: mapTrustPeople(trust.vouchers),
    botMarkers: mapTrustPeople(trust.bot_markers),
    viewerStance: trust.viewer_stance ?? null,
    viewerCanVouch: trust.viewer_can_vouch,
    viewerCanMarkBot: trust.viewer_can_mark_bot,
    viewerCanClear: trust.viewer_can_clear,
  };
}

function mapUser(u: BackendFollowItem | BackendUser): ViewerSummary {
  const follow = u as BackendFollowItem;
  return {
    id: u.id,
    username: u.username,
    bio: u.bio ?? undefined,
    profileImageUrl: u.profile_image_url ?? undefined,
    realR: typeof follow.real_r === 'number' ? follow.real_r : undefined,
    bootstrapFloor: Boolean(follow.bootstrap_floor),
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
      scope: s.public_feed_scope as SettingsPageData['publicFeedPreferences']['scope'],
      filter: normalizeFeedFilter(
        s.public_feed_filter
      ) as SettingsPageData['publicFeedPreferences']['filter'],
      sort: toFeedSortPreference(s.public_feed_sort),
      window: normalizeFeedWindow(s.public_feed_window),
    },
    personalFeedPreferences: {
      scope: s.personal_feed_scope as SettingsPageData['personalFeedPreferences']['scope'],
      filter: (s.personal_feed_filter === 'help_requests'
        ? 'help_requests'
        : s.personal_feed_filter === 'activity' ||
            s.personal_feed_filter === 'posts' ||
            s.personal_feed_filter === 'events'
          ? s.personal_feed_filter
          : 'all') as SettingsPageData['personalFeedPreferences']['filter'],
      sort: toFeedSortPreference(s.personal_feed_sort),
      window: normalizeFeedWindow(s.personal_feed_window),
    },
    hidePublicActivityFromPersonalFeeds: s.hide_public_activity_from_personal_feeds,
    hidePersonalFeedFromNonFollowers: s.hide_personal_feed_from_non_followers,
    hidePublicProfileActivityFromNonFollowers: s.hide_public_profile_activity_from_non_followers,
    requireFollowApproval: s.require_follow_approval,
    preferredLanguage: (s.preferred_language === 'nl'
      ? 'nl'
      : 'en') as SettingsPageData['preferredLanguage'],
    displayTimezone: s.display_timezone ?? null,
    combineFeeds: Boolean(s.combine_feeds),
    textSize: s.text_size === 'small' || s.text_size === 'large' ? s.text_size : 'medium',
    defaultLocationId: s.default_location_id ?? null,
    notificationCategories: normalizeNotificationCategories(s.notification_categories),
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
  if (input.appearanceThemeMode !== undefined)
    body.appearance_theme_mode = input.appearanceThemeMode;
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
    body.hide_public_profile_activity_from_non_followers =
      input.hidePublicProfileActivityFromNonFollowers;
  if (input.requireFollowApproval !== undefined)
    body.require_follow_approval = input.requireFollowApproval;
  if (input.preferredLanguage !== undefined) body.preferred_language = input.preferredLanguage;
  if (input.displayTimezone !== undefined) body.display_timezone = input.displayTimezone;
  if (input.combineFeeds !== undefined) body.combine_feeds = input.combineFeeds;
  if (input.textSize !== undefined) body.text_size = input.textSize;
  if (input.defaultLocationId !== undefined) body.default_location_id = input.defaultLocationId;
  if (input.notificationCategories !== undefined)
    body.notification_categories = input.notificationCategories;
  await apiClient.patch('/users/me/settings', body);
}

export async function fetchProfile(username: string): Promise<ProfilePageData | null> {
  try {
    const profileRes = await apiClient.get<BackendProfileResponse>(`/users/${username}`);
    const [followersRes, followingRes, feedRes, followRequestsRes] = await Promise.all([
      apiClient.get<BackendFollowList>(`/users/${username}/followers`),
      apiClient.get<BackendFollowList>(`/users/${username}/following`),
      apiClient.get<{ items: Parameters<typeof mapPersonalItem>[0][] }>(
        `/feeds/user/${encodeURIComponent(username)}${buildFeedQueryString({
          sort: 'recent',
          limit: DEFAULT_FEED_PAGE_SIZE,
          offset: 0,
        })}`
      ),
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
      viewerFollowStatus:
        (profileRes.viewer_follow_status as ProfilePageData['viewerFollowStatus']) ?? null,
      isOwnProfile: profileRes.is_own_profile,
      trust: profileRes.trust ? mapTrust(profileRes.trust) : undefined,
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
  const res = await apiClient.post<{ follow_status?: string | null }>(
    `/users/${encodeURIComponent(username)}/follow`,
    {}
  );
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

export async function setAccountStance(
  username: string,
  stance: 'vouch' | 'bot' | 'clear'
): Promise<void> {
  try {
    await apiClient.post(`/users/${encodeURIComponent(username)}/stance`, { stance });
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Could not update that stance.'));
  }
}

export async function fetchPeopleSuggestions(
  query: string
): Promise<Array<{ id: string; username: string }>> {
  const res = await apiClient.get<{ items: Array<{ id: string; username: string }> }>(
    `/users/suggestions?q=${encodeURIComponent(query)}&limit=8`
  );
  return (res.items ?? []).map((item) => ({ id: item.id, username: item.username }));
}
