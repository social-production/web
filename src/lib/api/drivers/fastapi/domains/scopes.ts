import { apiClient } from '../client';
import type { ScopeKind, ScopePageData } from '$lib/types/scope';
import type { CreateChannelInput, CreateCommunityInput, CreateResult } from '$lib/types/feed';
import type { PublicFeedItem } from '$lib/types/feed';

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

async function fetchScopeFeed(kind: 'channel' | 'community', slug: string): Promise<PublicFeedItem[]> {
  try {
    const res = await apiClient.get<{
      items: Array<{
        id: string;
        entity_type: string;
        slug: string | null;
        title: string;
        body: string;
        author_username: string | null;
        vote_count: number;
        comment_count: number;
        member_count: number;
        going_count: number;
        signal_count: number;
        last_activity_at: string;
        created_at: string;
        project_mode: string | null;
        project_subtype: string | null;
        stage_label: string | null;
        location_label: string | null;
        is_private: boolean;
        scheduled_at: string | null;
        time_label: string | null;
        channel_tags: Array<{ slug: string; label: string; kind: 'channel' | 'community' }>;
        community_tags: Array<{ slug: string; label: string; kind: 'channel' | 'community' }>;
      }>;
    }>(`/feeds/scope?kind=${kind}&slug=${encodeURIComponent(slug)}`);

    return res.items.flatMap((item): PublicFeedItem[] => {
      const channelTags = item.channel_tags ?? [];
      const communityTags = item.community_tags ?? [];

      if (item.entity_type === 'project' && item.slug) {
        return [{
          kind: 'project' as const,
          id: item.id,
          slug: item.slug,
          href: `/projects/${item.slug}`,
          createdAt: item.created_at,
          title: item.title,
          authorUsername: item.author_username ?? '',
          projectMode: (item.project_mode ?? 'productive') as never,
          projectSubtype: (item.project_subtype as never) ?? null,
          summary: item.body,
          channelTags,
          communityTags,
          stage: item.stage_label ?? '',
          locationLabel: item.location_label ?? '',
          voteCount: item.vote_count,
          activeVote: 0 as never,
          signalCount: item.signal_count,
          commentCount: item.comment_count,
          memberCount: item.member_count,
          lastActivityAt: item.last_activity_at
        }];
      }
      if (item.entity_type === 'thread' && item.slug) {
        return [{
          kind: 'thread' as const,
          id: item.id,
          slug: item.slug,
          href: `/threads/${item.slug}`,
          createdAt: item.created_at,
          title: item.title,
          body: item.body,
          authorUsername: item.author_username ?? '',
          channelTags,
          communityTags,
          voteCount: item.vote_count,
          activeVote: 0 as never,
          commentCount: item.comment_count,
          lastActivityAt: item.last_activity_at
        }];
      }
      if (item.entity_type === 'event' && item.slug) {
        return [{
          kind: 'event' as const,
          id: item.id,
          slug: item.slug,
          href: `/events/${item.slug}`,
          createdAt: item.created_at,
          title: item.title,
          description: item.body,
          isPrivate: item.is_private,
          scheduledAt: item.scheduled_at ?? undefined,
          channelTags,
          communityTags,
          createdByUsername: item.author_username ?? '',
          timeLabel: item.time_label ?? '',
          locationLabel: item.location_label ?? '',
          voteCount: item.vote_count,
          activeVote: 0 as never,
          commentCount: item.comment_count,
          memberCount: item.member_count,
          lastActivityAt: item.last_activity_at
        }];
      }
      return [];
    });
  } catch {
    return [];
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
