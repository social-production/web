import { apiClient } from '../client';
import type { ScopeKind, ScopePageData } from '$lib/types/scope';
import type { CreateChannelInput, CreateCommunityInput, CreateResult } from '$lib/types/feed';

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

interface BackendBoardPerson {
  user_id: string;
  username: string;
  standing_state: string;
  yes_count: number;
  no_count: number;
  vote_count: number;
  approval_ratio: number;
}

function mapBoardPerson(p: BackendBoardPerson) {
  return {
    id: p.user_id,
    username: p.username,
    confidenceUpVotes: p.yes_count,
    confidenceDownVotes: p.no_count,
    confidenceVoteCount: p.vote_count,
    confidenceRatio: p.approval_ratio,
    confidenceStandingState: p.standing_state as never
  };
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
      feed: [],
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
        viewerCanSeeFeed: true
      },
      feed: [],
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
      board_members: BackendBoardPerson[];
      board_candidates: BackendBoardPerson[];
      board_candidacy_options: { viewer_state: string | null; can_volunteer: boolean } | null;
    }>('/platform');

    return {
      kind: 'platform',
      slug: 'platform',
      title: res.channel?.name ?? 'Platform',
      description: res.channel?.description ?? '',
      badges: [],
      emptyFeedText: 'No platform activity yet.',
      membership: {
        memberCount: 0,
        viewerIsMember: false,
        viewerCanToggleMembership: false,
        joinPolicy: 'open',
        viewerCanSeeFeed: true
      },
      feed: [],
      boardMembers: res.board_members.map(mapBoardPerson),
      boardCandidates: res.board_candidates.map(mapBoardPerson),
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
  const kindPlural = kind === 'channel' ? 'channels' : 'communities';

  if (isMember) {
    await apiClient.delete(`/scopes/${kindPlural}/${slug}/leave`);
    membershipCache.delete(key);
  } else {
    await apiClient.post(`/scopes/${kindPlural}/${slug}/join`);
    membershipCache.add(key);
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

export async function fetchCreateChannel(input: CreateChannelInput): Promise<CreateResult> {
  try {
    const res = await apiClient.post<{ channel: BackendChannel }>('/scopes/channels', {
      slug: slugify(input.name),
      name: input.name,
      description: input.description
    });
    return { ok: true, slug: res.channel.slug };
  } catch (err) {
    const message = (err as { body?: { detail?: string } }).body?.detail ?? 'Could not create channel';
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
    const message = (err as { body?: { detail?: string } }).body?.detail ?? 'Could not create community';
    return { ok: false, error: message };
  }
}
