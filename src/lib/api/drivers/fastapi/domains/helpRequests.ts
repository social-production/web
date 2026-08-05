import { apiClient, extractErrorMessage } from '../client';
import { mapComment, type BackendComment } from './content';
import { registerCommentIds, registerEntityType } from '../typeRegistry';
import type { CreateHelpRequestInput, CreateResult, VoteDirection } from '$lib/types/feed';
import type { HelpRequestPageData } from '$lib/types/detail';
import { mapContentReport, mapModerationState } from '$lib/utils/moderation';

interface BackendHelpRequestRole {
  role_id: string;
  title: string;
  description: string;
  slots: number;
  filled_count: number;
  is_viewer_assigned: boolean;
}

interface BackendHelpRequest {
  id: string;
  author_id: string | null;
  author_username: string;
  title: string;
  body: string;
  location_label: string;
  schedule_label: string;
  needed_at: string;
  ends_at?: string | null;
  roles: BackendHelpRequestRole[];
  vote_count: number;
  comment_count: number;
  active_vote: number;
  discussion: BackendComment[];
  channel_tags: Array<{ slug: string; label: string; kind: 'channel' | 'community' }>;
  community_tags: Array<{ slug: string; label: string; kind: 'channel' | 'community' }>;
  created_at: string;
  report?: unknown;
  is_removed_by_report?: boolean;
  isRemovedByReport?: boolean;
  moderation_state?: string;
  moderationState?: string;
}

function mapHelpRequest(request: BackendHelpRequest): HelpRequestPageData {
  registerEntityType(request.id, 'help_request');
  const mappedDiscussion = (request.discussion ?? []).map(mapComment);
  if (mappedDiscussion.length > 0) {
    registerCommentIds(mappedDiscussion);
  }

  const report = mapContentReport(request.report);
  const moderationState = mapModerationState(request);

  return {
    id: request.id,
    authorUsername: request.author_username,
    title: request.title,
    body: request.body,
    locationLabel: request.location_label,
    scheduleLabel: request.schedule_label ?? '',
    neededAt: request.needed_at ?? request.schedule_label,
    endsAt: request.ends_at ?? null,
    roles: (request.roles ?? []).map((role) => ({
      roleId: role.role_id,
      title: role.title,
      description: role.description ?? '',
      slots: role.slots,
      filledCount: role.filled_count ?? 0,
      isViewerAssigned: role.is_viewer_assigned ?? false
    })),
    voteCount: request.vote_count ?? 0,
    activeVote: (request.active_vote ?? 0) as VoteDirection,
    commentCount: request.comment_count ?? 0,
    discussion: mappedDiscussion,
    channelTags: request.channel_tags ?? [],
    communityTags: request.community_tags ?? [],
    createdAt: request.created_at,
    report,
    isRemovedByReport:
      Boolean(request.isRemovedByReport ?? request.is_removed_by_report) ||
      moderationState === 'removed' ||
      report?.resolution === 'removed',
    ...(moderationState ? { moderationState } : {})
  };
}

export async function fetchHelpRequest(id: string): Promise<HelpRequestPageData | null> {
  try {
    const res = await apiClient.get<{ help_request: BackendHelpRequest }>(`/content/help-requests/${id}`);
    return mapHelpRequest(res.help_request);
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export async function fetchCommitHelpRequestRole(
  helpRequestId: string,
  roleId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await apiClient.post(`/content/help-requests/${helpRequestId}/roles/${roleId}/commit`, {});
    return { ok: true };
  } catch (err) {
    return { ok: false, error: extractErrorMessage(err, 'Could not take role.') };
  }
}

export async function fetchUncommitHelpRequestRole(
  helpRequestId: string,
  roleId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await apiClient.delete(`/content/help-requests/${helpRequestId}/roles/${roleId}/commit`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: extractErrorMessage(err, 'Could not leave role.') };
  }
}

export async function fetchCreateHelpRequest(input: CreateHelpRequestInput): Promise<CreateResult> {
  try {
    const res = await apiClient.post<{ help_request: BackendHelpRequest }>('/content/help-requests', {
      title: input.title,
      body: input.body,
      location_label: input.locationLabel,
      location_id: input.locationId ?? null,
      needed_at: input.neededAt,
      ends_at: input.endsAt ?? null,
      roles: input.roles.map((role) => ({
        title: role.title,
        description: role.description,
        slots: role.slots
      })),
      channel_slugs: input.channelTags.map((tag) => tag.slug),
      community_slugs: input.communityTags.map((tag) => tag.slug)
    });
    return { ok: true, id: res.help_request.id };
  } catch (err) {
    return { ok: false, error: extractErrorMessage(err, 'Could not create help request.') };
  }
}
