import { apiAssetUrl, apiClient } from '../client';
import type { BootstrapPayload, ScopeDirectoryItem } from '$lib/types/bootstrap';
import type { OnboardingPageData } from '$lib/types/account';

export async function fetchBootstrapSummary(): Promise<Pick<BootstrapPayload, 'unreadCounts'>> {
  return apiClient.get<Pick<BootstrapPayload, 'unreadCounts'>>('/bootstrap/summary');
}

function withAssetUrl(item: ScopeDirectoryItem): ScopeDirectoryItem {
  return { ...item, imageUrl: item.imageUrl ? apiAssetUrl(item.imageUrl) : null };
}

export async function fetchBootstrap(): Promise<BootstrapPayload> {
  const payload = await apiClient.get<BootstrapPayload>('/bootstrap');
  const { directory } = payload;
  return {
    ...payload,
    directory: {
      platform: directory.platform ? withAssetUrl(directory.platform) : null,
      channels: directory.channels.map(withAssetUrl),
      communities: directory.communities.map(withAssetUrl)
    }
  };
}

export async function fetchOnboarding(): Promise<OnboardingPageData> {
  return apiClient.get<OnboardingPageData>('/onboarding');
}
