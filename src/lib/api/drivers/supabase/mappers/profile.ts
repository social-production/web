/**
 * Map gateway /users/{username} payloads into ProfilePageData.
 */
import type { FollowStatus, ProfilePageData } from '$lib/types/account';
import type { ViewerSummary } from '$lib/types/bootstrap';
import { mapGatewayPersonalItems } from './feed';

type GatewayProfile = {
  username?: string;
  bio?: string | null;
  profileImageUrl?: string | null;
  followersCount?: number;
  followerCount?: number;
  followingCount?: number;
  followers?: ViewerSummary[];
  following?: ViewerSummary[];
  pendingFollowRequests?: ViewerSummary[];
  canViewPersonalFeed?: boolean;
  canViewPublicProfileActivity?: boolean;
  viewerIsFollowing?: boolean;
  viewerFollowStatus?: FollowStatus;
  followStatus?: FollowStatus | string | null;
  isOwnProfile?: boolean;
  feed?: unknown[];
};

export function mapGatewayProfile(
  raw: unknown,
  viewerUsername?: string | null
): ProfilePageData | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as GatewayProfile;
  if (!data.username) return null;

  const followStatus = (data.viewerFollowStatus ??
    data.followStatus ??
    null) as FollowStatus;
  const isOwnProfile =
    typeof data.isOwnProfile === 'boolean'
      ? data.isOwnProfile
      : Boolean(viewerUsername && viewerUsername === data.username);

  return {
    username: data.username,
    bio: data.bio ?? undefined,
    profileImageUrl: data.profileImageUrl ?? undefined,
    followersCount: data.followersCount ?? data.followerCount ?? 0,
    followingCount: data.followingCount ?? 0,
    followers: Array.isArray(data.followers) ? data.followers : [],
    following: Array.isArray(data.following) ? data.following : [],
    pendingFollowRequests: Array.isArray(data.pendingFollowRequests)
      ? data.pendingFollowRequests
      : [],
    canViewPersonalFeed:
      typeof data.canViewPersonalFeed === 'boolean'
        ? data.canViewPersonalFeed
        : true,
    canViewPublicProfileActivity:
      typeof data.canViewPublicProfileActivity === 'boolean'
        ? data.canViewPublicProfileActivity
        : true,
    viewerIsFollowing:
      typeof data.viewerIsFollowing === 'boolean'
        ? data.viewerIsFollowing
        : followStatus === 'accepted',
    viewerFollowStatus: followStatus === 'pending' || followStatus === 'accepted' ? followStatus : null,
    isOwnProfile,
    feed: mapGatewayPersonalItems(Array.isArray(data.feed) ? data.feed : [])
  };
}
