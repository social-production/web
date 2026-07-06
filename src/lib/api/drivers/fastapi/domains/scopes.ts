import { apiClient, extractErrorMessage } from '../client';
import { mapPublicItem } from './feeds';
import { parseInviteToken } from '$lib/utils/invite-token';
import type { ScopeKind, ScopePageData } from '$lib/types/scope';
import type { ScopeDirectoryItem } from '$lib/types/bootstrap';
import type { CreateChannelInput, CreateCommunityInput, CreateResult, PublicFeedItem } from '$lib/types/feed';

// In-memory membership cache for toggle direction
const membershipCache = new Set<string>();

function cacheKey(kind: ScopeKind, slug: string) {
  return `${kind}:${slug}`;
}

function setScopeMembershipCache(kind: ScopeKind, slug: string, isMember: boolean) {
  const keys = new Set([cacheKey(kind, slug)]);
  if (slug === 'platform' || slug === 'stewardship') {
    keys.add(cacheKey('channel', slug));
    keys.add(cacheKey('platform', slug));
  } else if (kind === 'platform') {
    keys.add(cacheKey('channel', slug));
  }

  for (const key of keys) {
    if (isMember) membershipCache.add(key);
    else membershipCache.delete(key);
  }
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
  membership_state?: string;
  yes_count: number;
  no_count: number;
  vote_count: number;
  approval_ratio: number;
  weekly_active_users?: number;
  required_quorum?: number;
  grace_ends_at?: string | null;
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

    if (res.viewer_is_member) setScopeMembershipCache('channel', slug, true);
    else setScopeMembershipCache('channel', slug, false);

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
    }>(`/scopes/communities/${slug}`);

    if (res.viewer_is_member) membershipCache.add(cacheKey('community', slug));
    else membershipCache.delete(cacheKey('community', slug));

    const isPrivate = res.community.join_policy === 'closed';

    return {
      kind: 'community',
      slug: res.community.slug,
      title: res.community.name,
      description: res.community.description,
      badges: isPrivate ? ['Private'] : [],
      emptyFeedText: 'No activity in this community yet.',
      membership: {
        memberCount: res.member_count,
        viewerIsMember: res.viewer_is_member,
        viewerCanToggleMembership: !isPrivate,
        joinPolicy: isPrivate ? 'invite_only' : 'open',
        viewerCanSeeFeed: !isPrivate || res.viewer_is_member,
        hiddenFeedCopy: isPrivate && !res.viewer_is_member
          ? 'This feed is only visible to members. Use an invite link or code to join.'
          : undefined
      },
      feed: !isPrivate || res.viewer_is_member ? await fetchScopeFeed('community', res.community.slug) : [],
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
        setScopeMembershipCache('platform', channelSlug, true);
      } else {
        setScopeMembershipCache('platform', channelSlug, false);
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

export async function fetchToggleScopeMembership(
  kind: ScopeKind,
  slug: string,
  viewerIsMember: boolean,
): Promise<void> {
  const kindPlural = (kind === 'channel' || kind === 'platform') ? 'channels' : 'communities';

  try {
    if (viewerIsMember) {
      await apiClient.delete(`/scopes/${kindPlural}/${slug}/leave`);
      setScopeMembershipCache(kind, slug, false);
    } else {
      await apiClient.post(`/scopes/${kindPlural}/${slug}/join`);
      setScopeMembershipCache(kind, slug, true);
    }
  } catch (err) {
    throw err;
  }
}

export interface ScopeInviteRedeemResult {
  ok: boolean;
  joined: boolean;
  slug?: string;
}

export interface ScopeInviteCreateResult {
  token: string;
  redeemUrl: string;
}

export interface CommunityDirectInviteResult {
  ok: boolean;
  username: string;
  alreadyMember: boolean;
}

export async function fetchRedeemScopeInvite(
  _kind: ScopeKind,
  _slug: string,
  inviteValue: string
): Promise<ScopeInviteRedeemResult> {
  try {
    const res = await apiClient.post<{ joined: boolean; slug: string }>('/scopes/invites/redeem', {
      token: parseInviteToken(inviteValue)
    });
    return { ok: true, joined: res.joined, slug: res.slug };
  } catch {
    return { ok: false, joined: false };
  }
}

export async function fetchCreateScopeInvite(
  kind: 'channel' | 'community',
  slug: string
): Promise<ScopeInviteCreateResult> {
  const res = await apiClient.post<{ token: string; redeem_url: string }>(`/scopes/${kind}/${slug}/invites`);
  return { token: res.token, redeemUrl: res.redeem_url };
}

export async function fetchInviteUserToCommunity(
  slug: string,
  username: string
): Promise<CommunityDirectInviteResult> {
  const res = await apiClient.post<{ ok: boolean; username: string; already_member: boolean }>(
    `/scopes/communities/${slug}/invite-user`,
    { username: username.trim() }
  );
  return {
    ok: res.ok,
    username: res.username,
    alreadyMember: res.already_member
  };
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
