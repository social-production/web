import { apiClient } from '../client';
import type { AppAdapter } from '$lib/services/adapters/types';
import type { ScopeDirectoryItem } from '$lib/types/bootstrap';
import type { CreateChannelInput, CreateCommunityInput, CreateResult } from '$lib/types/feed';
import type {
  CommunityDirectInviteResult,
  ScopeInviteCreateResult,
  ScopeInviteRedeemResult
} from '$lib/types/invites';
import type { ScopeKind, ScopePageData } from '$lib/types/scope';
import type { PlatformAssetsPageData } from '$lib/types/assets';
import { mapGatewayPublicItems } from '../mappers/feed';

function normalizeScopePage(page: ScopePageData): ScopePageData {
  return {
    ...page,
    feed: mapGatewayPublicItems(page.feed ?? [])
  };
}

export async function fetchChannel(slug: string): Promise<ScopePageData | null> {
  try {
    return normalizeScopePage(
      await apiClient.get<ScopePageData>(`/scopes/channels/${encodeURIComponent(slug)}`)
    );
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export async function fetchCommunity(slug: string): Promise<ScopePageData | null> {
  try {
    return normalizeScopePage(
      await apiClient.get<ScopePageData>(`/scopes/communities/${encodeURIComponent(slug)}`)
    );
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export async function fetchPlatform(): Promise<ScopePageData | null> {
  try {
    return normalizeScopePage(await apiClient.get<ScopePageData>('/scopes/platform'));
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export async function fetchToggleScopeMembership(
  kind: ScopeKind,
  slug: string,
  viewerIsMember: boolean
): Promise<void> {
  const normalizedKind = kind === 'platform' ? 'channel' : kind;
  const normalizedSlug = kind === 'platform' ? 'platform' : slug;
  await apiClient.post('/scopes/membership', {
    kind: normalizedKind,
    slug: normalizedSlug,
    viewerIsMember
  });
}

export async function fetchRedeemScopeInvite(
  kind: ScopeKind,
  slug: string,
  inviteValue: string
): Promise<ScopeInviteRedeemResult> {
  return apiClient.post<ScopeInviteRedeemResult>('/scopes/invites/redeem', {
    kind,
    slug,
    inviteValue
  });
}

export async function fetchCreateScopeInvite(
  kind: 'channel' | 'community',
  slug: string
): Promise<ScopeInviteCreateResult> {
  return apiClient.post<ScopeInviteCreateResult>('/scopes/invites', { kind, slug });
}

export async function fetchInviteUserToCommunity(
  slug: string,
  username: string
): Promise<CommunityDirectInviteResult> {
  return apiClient.post<CommunityDirectInviteResult>(
    `/scopes/communities/${encodeURIComponent(slug)}/invite`,
    { username }
  );
}

export async function fetchVolunteerForBoard(): Promise<boolean> {
  const res = await apiClient.post<{ ok?: boolean }>('/scopes/platform/volunteer');
  return res.ok !== false;
}

export async function fetchRemoveVolunteer(): Promise<boolean> {
  const res = await apiClient.post<{ ok?: boolean }>('/scopes/platform/volunteer/remove');
  return res.ok !== false;
}

export async function fetchCastModeratorVote(targetUserId: string, vote: string): Promise<boolean> {
  const res = await apiClient.post<{ ok?: boolean }>('/scopes/platform/moderator-vote', {
    targetUserId,
    vote
  });
  return res.ok !== false;
}

export async function fetchCreateChannel(input: CreateChannelInput): Promise<CreateResult> {
  return apiClient.post<CreateResult>('/scopes/channels', input);
}

export async function fetchCreateCommunity(input: CreateCommunityInput): Promise<CreateResult> {
  return apiClient.post<CreateResult>('/scopes/communities', input);
}

export async function fetchTaggableScopes(
  query: string,
  kind?: 'channel' | 'community',
  limit?: number
): Promise<{ channels: ScopeDirectoryItem[]; communities: ScopeDirectoryItem[] }> {
  const params = new URLSearchParams({ q: query });
  if (kind) params.set('kind', kind);
  if (limit) params.set('limit', String(limit));
  try {
    return await apiClient.get<{ channels: ScopeDirectoryItem[]; communities: ScopeDirectoryItem[] }>(
      `/scopes/taggable?${params}`
    );
  } catch (err) {
    if ((err as { status?: number }).status === 404) {
      return { channels: [], communities: [] };
    }
    throw err;
  }
}

export const scopesDomain: Partial<AppAdapter> = {
  getChannel: fetchChannel,
  getCommunity: fetchCommunity,
  getPlatform: fetchPlatform,
  getPlatformAssets: async () => null as PlatformAssetsPageData | null,
  toggleScopeMembership: fetchToggleScopeMembership,
  redeemScopeInvite: fetchRedeemScopeInvite,
  createScopeInvite: fetchCreateScopeInvite,
  inviteUserToCommunity: fetchInviteUserToCommunity,
  volunteerForBoard: fetchVolunteerForBoard,
  removeVolunteer: fetchRemoveVolunteer,
  castModeratorVote: fetchCastModeratorVote,
  createChannel: fetchCreateChannel,
  createCommunity: fetchCreateCommunity,
  getTaggableScopes: fetchTaggableScopes
};
