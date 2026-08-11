import { apiClient } from '../client';
import type { AppAdapter } from '$lib/services/adapters/types';
import type { ProfilePageData, SettingsPageData, SettingsUpdateInput } from '$lib/types/account';
import type { ViewerSummary } from '$lib/types/bootstrap';
import { mapGatewayProfile } from '../mappers/profile';

export async function fetchSettings(): Promise<SettingsPageData | null> {
  try {
    return await apiClient.get<SettingsPageData>('/users/me/settings');
  } catch (err) {
    if ((err as { status?: number }).status === 401) return null;
    throw err;
  }
}

export async function fetchUpdateSettings(input: SettingsUpdateInput): Promise<void> {
  await apiClient.patch('/users/me/settings', input);
}

export async function fetchProfile(username: string): Promise<ProfilePageData | null> {
  try {
    const raw = await apiClient.get<unknown>(`/users/${encodeURIComponent(username)}`);
    return mapGatewayProfile(raw);
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export async function fetchFollowUser(username: string): Promise<{ followStatus: string | null }> {
  return apiClient.post<{ followStatus: string | null }>(
    `/users/${encodeURIComponent(username)}/follow`
  );
}

export async function fetchUnfollowUser(username: string): Promise<void> {
  await apiClient.delete(`/users/${encodeURIComponent(username)}/follow`);
}

export async function fetchAcceptFollowRequest(username: string): Promise<void> {
  await apiClient.post(`/users/${encodeURIComponent(username)}/follow/accept`);
}

export async function fetchRejectFollowRequest(username: string): Promise<void> {
  await apiClient.post(`/users/${encodeURIComponent(username)}/follow/reject`);
}

export async function fetchFollowRequests(): Promise<ViewerSummary[]> {
  try {
    const res = await apiClient.get<{ items?: ViewerSummary[] }>('/users/me/follow-requests');
    return res.items ?? [];
  } catch (err) {
    if ((err as { status?: number }).status === 404) return [];
    throw err;
  }
}

export const usersDomain: Partial<AppAdapter> = {
  getSettings: fetchSettings,
  updateSettings: fetchUpdateSettings,
  getProfile: fetchProfile,
  followUser: fetchFollowUser,
  unfollowUser: fetchUnfollowUser,
  acceptFollowRequest: fetchAcceptFollowRequest,
  rejectFollowRequest: fetchRejectFollowRequest,
  getFollowRequests: fetchFollowRequests
};
