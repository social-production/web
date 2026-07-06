import type { ScopeDirectoryItem } from '$lib/types/bootstrap';
import type { ScopeKind } from '$lib/types/scope';

export function buildScopedCreateHref(
  contentPath: '/create/thread' | '/create/project' | '/create/event' | '/create/help-request',
  scopeKind: ScopeKind,
  slug: string
) {
  const params = new URLSearchParams();
  if (scopeKind === 'platform' || scopeKind === 'channel') {
    params.set('channel', slug);
  } else if (scopeKind === 'community') {
    params.set('community', slug);
  }
  const query = params.toString();
  return query ? `${contentPath}?${query}` : contentPath;
}

export function readScopePrefillFromSearchParams(searchParams: URLSearchParams) {
  const channelSlug = searchParams.get('channel')?.trim().toLowerCase() ?? '';
  const communitySlug = searchParams.get('community')?.trim().toLowerCase() ?? '';
  return {
    channelSlugs: channelSlug ? [channelSlug] : [],
    communitySlugs: communitySlug ? [communitySlug] : [],
    primaryTagType: communitySlug && !channelSlug ? ('community' as const) : ('channel' as const)
  };
}

export function applyScopePrefillToSelections(
  prefill: ReturnType<typeof readScopePrefillFromSearchParams>,
  channels: ScopeDirectoryItem[],
  communities: ScopeDirectoryItem[],
  selectedChannelIds: string[],
  selectedCommunityIds: string[]
) {
  let nextChannelIds = [...selectedChannelIds];
  let nextCommunityIds = [...selectedCommunityIds];
  let nextChannelOptions: ScopeDirectoryItem[] = [];
  let nextCommunityOptions: ScopeDirectoryItem[] = [];

  for (const slug of prefill.channelSlugs) {
    const option = channels.find((item) => item.slug === slug);
    if (!option || nextChannelIds.includes(slug)) {
      continue;
    }
    nextChannelOptions.push(option);
    nextChannelIds = nextChannelIds.length === 0 ? [slug] : [...nextChannelIds, slug];
  }

  for (const slug of prefill.communitySlugs) {
    const option = communities.find((item) => item.slug === slug);
    if (!option || nextCommunityIds.includes(slug)) {
      continue;
    }
    nextCommunityOptions.push(option);
    nextCommunityIds =
      prefill.primaryTagType === 'community' && nextCommunityIds.length === 0
        ? [slug]
        : [...nextCommunityIds, slug];
  }

  return {
    primaryTagType: prefill.primaryTagType,
    selectedChannelIds: nextChannelIds,
    selectedCommunityIds: nextCommunityIds,
    selectedChannelOptions: nextChannelOptions,
    selectedCommunityOptions: nextCommunityOptions
  };
}
