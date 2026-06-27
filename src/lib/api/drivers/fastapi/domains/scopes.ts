import { apiClient, extractErrorMessage } from '../client';
import { mapPublicItem } from './feeds';
import type { ScopeKind, ScopePageData } from '$lib/types/scope';
import type { ScopeDirectoryItem } from '$lib/types/bootstrap';
import type { CreateChannelInput, CreateCommunityInput, CreateResult, PublicFeedItem } from '$lib/types/feed';

// In-memory membership cache for toggle direction
const membershipCache = new Set<string>();

function cacheKey(kind: ScopeKind, slug: string) {
  return `${kind}:${slug}`;
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

interface BackendChannel {
  id: string;
  slug: string;
  name: string;
  description: string;
}

interface BackendCommunity extends BackendChannel {
  join_policy: string;
}

interface BackendTaggableScopeItem {
  slug: string;
  label: string;
  href: string;
  visibility: 'public' | 'private';
  viewer_is_member: boolean;
}

interface BackendTaggableScopes {
  channels: BackendTaggableScopeItem[];
  communities: BackendTaggableScopeItem[];
}

interface BackendBoardPerson {
  user_id: string;
  username: string;
  standing_state: string;
  yes_count: number;
  no_count: number;
  vote_count: number;
  approval_ratio: number;
  weekly_active_users?: number;
  required_quorum?: number;
  active_vote: string | null;
}

function mapBoardPerson(p: BackendBoardPerson) {
  return {
    id: p.user_id,
    username: p.username,
    confidenceTargetId: p.user_id,
    confidenceUpVotes: p.yes_count,
    confidenceDownVotes: p.no_count,
    confidenceVoteCount: p.vote_count,
    confidenceRatio: p.approval_ratio,
    confidenceStandingState: p.standing_state as never,
    confidenceVotesRequired: p.required_quorum ?? 0,
    confidenceWeeklyActiveUserCount: p.weekly_active_users ?? 0,
    confidenceReviewCount: p.vote_count,
    confidenceActiveVote: (p.active_vote === 'yes' ? 1 : p.active_vote === 'no' ? -1 : 0) as never,
  };
}

function mapTaggableScope(item: BackendTaggableScopeItem): ScopeDirectoryItem {
  return {
    slug: item.slug,
    label: item.label,
    href: item.href,
    visibility: item.visibility,
    viewerIsMember: item.viewer_is_member
  };
}

export async function fetchTaggableScopes(
  query: string,
  kind?: 'channel' | 'community',
  limit = 8
): Promise<{ channels: ScopeDirectoryItem[]; communities: ScopeDirectoryItem[] }> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (kind) params.set('kind', kind);

  const res = await apiClient.get<BackendTaggableScopes>(`/scopes/taggable?${params.toString()}`);
  return {
    channels: res.channels.map(mapTaggableScope),
    communities: res.communities.map(mapTaggableScope)
  };
}

async function fetchScopeFeed(kind: 'channel' | 'community', slug: string): Promise<PublicFeedItem[]> {
  try {
    const res = await apiClient.get<{
      items: Parameters<typeof mapPublicItem>[0][];
    }>(`/feeds/scope?kind=${kind}&slug=${encodeURIComponent(slug)}`);

    return res.items.flatMap((item) => {
      const mapped = mapPublicItem(item);
      return mapped ? [mapped] : [];
    });
  } catch (err) {
    if ((err as { status?: number }).status === 404) return [];
    throw err;
  }
}

export async function fetchChannel(slug: string): Promise<ScopePageData | null> {
  try {
    const res = await apiClient.get<{
      channel: BackendChannel;
      member_count: number;
      viewer_is_member: boolean;
    }>(`/scopes/channels/${slug}`);

    if (res.viewer_is_member) membershipCache.add(cacheKey('channel', slug));
    else membershipCache.delete(cacheKey('channel', slug));

    return {
      kind: 'channel',
      slug: res.channel.slug,
      title: res.channel.name,
      description: res.channel.description,
      badges: [],
      emptyFeedText: 'No activity in this channel yet.',
      membership: {
        memberCount: res.member_count,
        viewerIsMember: res.viewer_is_member,
        viewerCanToggleMembership: true,
        joinPolicy: 'open',
        viewerCanSeeFeed: true
      },
      feed: await fetchScopeFeed('channel', res.channel.slug),
      stats: { projects: 0, threads: 0, events: 0, members: res.member_count }
    };
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export async function fetchCommunity(slug: string): Promise<ScopePageData | null> {
  try {
    const res = await apiClient.get<{
      community: BackendCommunity;
      member_count: number;
      viewer_is_member: boolean;
      invite_link?: string | null;
    }>(`/scopes/communities/${slug}`);

    if (res.viewer_is_member) membershipCache.add(cacheKey('community', slug));
    else membershipCache.delete(cacheKey('community', slug));

    return {
      kind: 'community',
      slug: res.community.slug,
      title: res.community.name,
      description: res.community.description,
      badges: [],
      emptyFeedText: 'No activity in this community yet.',
      membership: {
        memberCount: res.member_count,
        viewerIsMember: res.viewer_is_member,
        viewerCanToggleMembership: true,
        joinPolicy: res.community.join_policy === 'closed' ? 'invite_only' : 'open',
        viewerCanSeeFeed: true,
        inviteLink: res.invite_link ?? undefined
      },
      feed: await fetchScopeFeed('community', res.community.slug),
      stats: { projects: 0, threads: 0, events: 0, members: res.member_count }
    };
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export async function fetchPlatform(): Promise<ScopePageData | null> {
  try {
    const res = await apiClient.get<{
      channel: BackendChannel | null;
      moderators: BackendBoardPerson[];
      moderator_candidates: BackendBoardPerson[];
      moderator_candidacy_options: { viewer_state: string | null; can_volunteer: boolean } | null;
    }>('/platform');

    let memberCount = 0;
    let viewerIsMember = false;
    const channelSlug = res.channel?.slug ?? 'platform';

    if (res.channel) {
      const channelRes = await apiClient.get<{
        channel: BackendChannel;
        member_count: number;
        viewer_is_member: boolean;
      }>(`/scopes/channels/${channelSlug}`);

      memberCount = channelRes.member_count;
      viewerIsMember = channelRes.viewer_is_member;

      if (viewerIsMember) {
        membershipCache.add(cacheKey('channel', channelSlug));
        membershipCache.add(cacheKey('platform', channelSlug));
      } else {
        membershipCache.delete(cacheKey('channel', channelSlug));
        membershipCache.delete(cacheKey('platform', channelSlug));
      }
    }

    return {
      kind: 'platform',
      slug: channelSlug,
      title: res.channel?.name ?? 'Platform',
      description: res.channel?.description ?? '',
      badges: [],
      emptyFeedText: 'No platform activity yet.',
      membership: {
        memberCount,
        viewerIsMember,
        viewerCanToggleMembership: !!res.channel,
        joinPolicy: 'open',
        viewerCanSeeFeed: true
      },
      feed: await fetchScopeFeed('channel', channelSlug),
      moderators: res.moderators.map(mapBoardPerson),
      moderatorCandidates: res.moderator_candidates.map(mapBoardPerson),
      moderatorCandidacyOptions: res.moderator_candidacy_options
        ? { viewerState: res.moderator_candidacy_options.viewer_state, canVolunteer: res.moderator_candidacy_options.can_volunteer }
        : null,
      stats: { projects: 0, threads: 0, events: 0, members: 0 }
    };
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export async function fetchToggleScopeMembership(kind: ScopeKind, slug: string): Promise<void> {
  const key = cacheKey(kind, slug);
  const isMember = membershipCache.has(key);
  const kindPlural = (kind === 'channel' || kind === 'platform') ? 'channels' : 'communities';

  try {
    if (isMember) {
      await apiClient.delete(`/scopes/${kindPlural}/${slug}/leave`);
      membershipCache.delete(key);
      // Also clear the channel-keyed cache when leaving via platform kind
      if (kind === 'platform') membershipCache.delete(cacheKey('channel', slug));
    } else {
      await apiClient.post(`/scopes/${kindPlural}/${slug}/join`);
      membershipCache.add(key);
      // Also set the channel-keyed cache when joining via platform kind
      if (kind === 'platform') membershipCache.add(cacheKey('channel', slug));
    }
  } catch (err) {
    // On failure, don't update cache — let the server be source of truth
    throw err;
  }
}

export async function fetchRedeemScopeInvite(
  _kind: ScopeKind,
  _slug: string,
  inviteValue: string
): Promise<boolean> {
  try {
    await apiClient.post('/scopes/invites/redeem', { token: inviteValue });
    return true;
  } catch {
    return false;
  }
}

export async function fetchVolunteerForBoard(): Promise<boolean> {
  try {
    await apiClient.post('/board/volunteer');
    return true;
  } catch {
    return false;
  }
}

export async function fetchRemoveVolunteer(): Promise<boolean> {
  try {
    await apiClient.delete('/board/volunteer');
    return true;
  } catch {
    return false;
  }
}

export async function fetchCastModeratorVote(targetUserId: string, vote: string): Promise<boolean> {
  try {
    await apiClient.post('/board/votes', { target_user_id: targetUserId, vote });
    return true;
  } catch {
    return false;
  }
}

export async function fetchCreateChannel(input: CreateChannelInput): Promise<CreateResult> {
  try {
    const res = await apiClient.post<{ channel: BackendChannel }>('/scopes/channels', {
      slug: slugify(input.name),
      name: input.name,
      description: input.description
    });
    return { ok: true, slug: res.channel.slug };
  } catch (err) {
    const message = extractErrorMessage(err, 'Could not create channel');
    return { ok: false, error: message };
  }
}

export async function fetchCreateCommunity(input: CreateCommunityInput): Promise<CreateResult> {
  try {
    const res = await apiClient.post<{ community: BackendCommunity }>('/scopes/communities', {
      slug: slugify(input.name),
      name: input.name,
      description: input.description,
      join_policy: input.joinPolicy === 'invite_only' ? 'closed' : 'open'
    });
    return { ok: true, slug: res.community.slug };
  } catch (err) {
    const message = extractErrorMessage(err, 'Could not create community');
    return { ok: false, error: message };
  }
}
