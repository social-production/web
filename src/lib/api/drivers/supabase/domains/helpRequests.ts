import { apiClient } from '../client';
import type { AppAdapter } from '$lib/services/adapters/types';
import type { HelpRequestPageData } from '$lib/types/detail';
import type { CreateHelpRequestInput, CreateResult } from '$lib/types/feed';

export async function fetchHelpRequest(id: string): Promise<HelpRequestPageData | null> {
  try {
    return await apiClient.get<HelpRequestPageData>(`/help-requests/${encodeURIComponent(id)}`);
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export async function fetchCreateHelpRequest(input: CreateHelpRequestInput): Promise<CreateResult> {
  return apiClient.post<CreateResult>('/help-requests', input);
}

export async function fetchCommitHelpRequestRole(
  helpRequestId: string,
  roleId: string
): Promise<{ ok: boolean; error?: string }> {
  return apiClient.post<{ ok: boolean; error?: string }>(
    `/help-requests/${encodeURIComponent(helpRequestId)}/roles/${encodeURIComponent(roleId)}/commit`
  );
}

export async function fetchUncommitHelpRequestRole(
  helpRequestId: string,
  roleId: string
): Promise<{ ok: boolean; error?: string }> {
  return apiClient.post<{ ok: boolean; error?: string }>(
    `/help-requests/${encodeURIComponent(helpRequestId)}/roles/${encodeURIComponent(roleId)}/uncommit`
  );
}

export const helpRequestsDomain: Partial<AppAdapter> = {
  getHelpRequest: fetchHelpRequest,
  createHelpRequest: fetchCreateHelpRequest,
  commitHelpRequestRole: fetchCommitHelpRequestRole,
  uncommitHelpRequestRole: fetchUncommitHelpRequestRole
};
