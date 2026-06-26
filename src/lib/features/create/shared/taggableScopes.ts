import { getTaggableScopes } from '$lib/services/queries/create';
import type { ScopeDirectoryItem } from '$lib/types/bootstrap';

const MIN_QUERY_LENGTH = 1;

export async function loadTaggableScopeOptions(
  channelQuery: string,
  communityQuery: string
): Promise<{ channels: ScopeDirectoryItem[]; communities: ScopeDirectoryItem[] }> {
  const normalizedChannelQuery = channelQuery.trim();
  const normalizedCommunityQuery = communityQuery.trim();

  const [channels, communities] = await Promise.all([
    normalizedChannelQuery.length >= MIN_QUERY_LENGTH
      ? getTaggableScopes(normalizedChannelQuery, 'channel', 8)
      : Promise.resolve({ channels: [], communities: [] }),
    normalizedCommunityQuery.length >= MIN_QUERY_LENGTH
      ? getTaggableScopes(normalizedCommunityQuery, 'community', 8)
      : Promise.resolve({ channels: [], communities: [] })
  ]);

  return {
    channels: channels.channels,
    communities: communities.communities
  };
}
