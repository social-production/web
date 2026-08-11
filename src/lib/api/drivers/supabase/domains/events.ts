import { apiClient } from '../client';
import type { AppAdapter } from '$lib/services/adapters/types';
import type {
  EventPageData,
  EventPlanInput,
  GovernanceSignalType,
  ProjectActivityInput,
  ProjectApprovalVote,
  ProjectImportanceVoteValue,
  ShareTargetResult
} from '$lib/types/detail';
import type { CreateEventInput, CreateResult, SignalToggleResult } from '$lib/types/feed';

export async function fetchEvent(slug: string): Promise<EventPageData | null> {
  try {
    return await apiClient.get<EventPageData>(`/events/${encodeURIComponent(slug)}`);
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export async function fetchCreateEvent(input: CreateEventInput): Promise<CreateResult> {
  return apiClient.post<CreateResult>('/events', input);
}

async function eventAction<T = { ok?: boolean }>(slug: string, action: string, body?: unknown): Promise<T> {
  return apiClient.post<T>(`/events/${encodeURIComponent(slug)}/${action}`, body ?? {});
}

export async function fetchToggleEventMembership(eventSlug: string): Promise<void> {
  await eventAction(eventSlug, 'membership');
}

export async function fetchSetEventSignal(
  eventSlug: string,
  signal: GovernanceSignalType
): Promise<SignalToggleResult> {
  return eventAction<SignalToggleResult>(eventSlug, 'signal', { signal });
}

export async function fetchAddEventValue(eventSlug: string, label: string): Promise<void> {
  await eventAction(eventSlug, 'values', { label });
}

export async function fetchSetEventValueImportance(
  eventSlug: string,
  valueId: string,
  importance: ProjectImportanceVoteValue
): Promise<void> {
  await eventAction(eventSlug, 'values/importance', { valueId, importance });
}

export async function fetchAddEventPlan(eventSlug: string, input: EventPlanInput): Promise<boolean> {
  const res = await eventAction<{ ok?: boolean }>(eventSlug, 'plans', input);
  return res.ok !== false;
}

export async function fetchSetEventPlanOverallVote(
  eventSlug: string,
  planId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  await eventAction(eventSlug, 'plans/overall-vote', { planId, vote });
}

export async function fetchSetEventPlanValueVote(
  eventSlug: string,
  planId: string,
  valueId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  await eventAction(eventSlug, 'plans/value-vote', { planId, valueId, vote });
}

export async function fetchSetEventPlanCriterionRating(
  eventSlug: string,
  planId: string,
  criterionId: string,
  rating: import('$lib/types/detail').PlanCriterionRating | null
): Promise<void> {
  await eventAction(eventSlug, 'plans/criterion-rating', { planId, criterionId, rating });
}

export async function fetchAddEventActivity(
  eventSlug: string,
  input: ProjectActivityInput
): Promise<void> {
  await eventAction(eventSlug, 'activities', input);
}

export async function fetchSetEventActivityCommitment(
  eventSlug: string,
  activityId: string,
  roleLabel: string | null
): Promise<void> {
  await eventAction(eventSlug, 'activities/commitment', { activityId, roleLabel });
}

export async function fetchSetEventActivityRating(
  eventSlug: string,
  activityId: string,
  rating: number,
  comment: string | null
): Promise<void> {
  await eventAction(eventSlug, 'activities/rating', { activityId, rating, comment });
}

export async function fetchDeleteEventActivityRating(
  eventSlug: string,
  activityId: string
): Promise<void> {
  await eventAction(eventSlug, 'activities/rating/delete', { activityId });
}

export async function fetchToggleEventHistoryCompletion(
  eventSlug: string,
  historyId: string,
  role: import('$lib/types/detail').ProjectServiceHistoryCompletionRole,
  selection?: import('$lib/types/detail').ProjectServiceHistoryCompletionChoice
): Promise<void> {
  await eventAction(eventSlug, 'history/completion', { historyId, role, selection });
}

export async function fetchRequestEventPhaseChange(
  eventSlug: string,
  targetPhaseId: import('$lib/types/detail').EventLifecyclePhaseId,
  reason: string
): Promise<void> {
  await eventAction(eventSlug, 'phase-change', { targetPhaseId, reason });
}

export async function fetchSetEventPhaseChangeVote(
  eventSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  await eventAction(eventSlug, 'phase-change/vote', { requestId, vote });
}

export async function fetchRequestEventUpdate(eventSlug: string, body: string): Promise<void> {
  await eventAction(eventSlug, 'update-requests', { body });
}

export async function fetchSetEventUpdateVote(
  eventSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  await eventAction(eventSlug, 'update-requests/vote', { requestId, vote });
}

export async function fetchRequestEventEdit(
  eventSlug: string,
  title: string,
  description: string
): Promise<void> {
  await eventAction(eventSlug, 'edit-requests', { title, description });
}

export async function fetchSetEventEditVote(
  eventSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  await eventAction(eventSlug, 'edit-requests/vote', { requestId, vote });
}

export async function fetchCreateEventManualLinkRequest(
  eventSlug: string,
  targetKind: 'project' | 'event',
  targetSlug: string,
  summary: string,
  label?: string | null
): Promise<void> {
  await eventAction(eventSlug, 'manual-links', { targetKind, targetSlug, summary, label });
}

export async function fetchSetEventManualLinkVote(
  eventSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  await eventAction(eventSlug, 'manual-links/vote', { requestId, vote });
}

export async function fetchCreateEventManualLinkSeverRequest(
  eventSlug: string,
  linkId: string,
  summary?: string | null
): Promise<void> {
  await eventAction(eventSlug, 'manual-links/sever', { linkId, summary });
}

export async function fetchGrantEventEditAccess(eventSlug: string, userId: string): Promise<void> {
  await eventAction(eventSlug, 'edit-access/grant', { userId });
}

export async function fetchRevokeEventEditAccess(eventSlug: string, userId: string): Promise<void> {
  await eventAction(eventSlug, 'edit-access/revoke', { userId });
}

export async function fetchShareEventWithUser(
  eventSlug: string,
  username: string
): Promise<ShareTargetResult> {
  return eventAction<ShareTargetResult>(eventSlug, 'share', { username });
}

export const eventsDomain: Partial<AppAdapter> = {
  getEvent: fetchEvent,
  createEvent: fetchCreateEvent,
  toggleEventMembership: fetchToggleEventMembership,
  setEventSignal: fetchSetEventSignal,
  addEventValue: fetchAddEventValue,
  setEventValueImportance: fetchSetEventValueImportance,
  addEventPlan: fetchAddEventPlan,
  setEventPlanOverallVote: fetchSetEventPlanOverallVote,
  setEventPlanValueVote: fetchSetEventPlanValueVote,
  setEventPlanCriterionRating: fetchSetEventPlanCriterionRating,
  addEventActivity: fetchAddEventActivity,
  setEventActivityCommitment: fetchSetEventActivityCommitment,
  setEventActivityRating: fetchSetEventActivityRating,
  deleteEventActivityRating: fetchDeleteEventActivityRating,
  toggleEventHistoryCompletion: fetchToggleEventHistoryCompletion,
  requestEventPhaseChange: fetchRequestEventPhaseChange,
  setEventPhaseChangeVote: fetchSetEventPhaseChangeVote,
  requestEventUpdate: fetchRequestEventUpdate,
  setEventUpdateVote: fetchSetEventUpdateVote,
  requestEventEdit: fetchRequestEventEdit,
  setEventEditVote: fetchSetEventEditVote,
  createEventManualLinkRequest: fetchCreateEventManualLinkRequest,
  setEventManualLinkVote: fetchSetEventManualLinkVote,
  createEventManualLinkSeverRequest: fetchCreateEventManualLinkSeverRequest,
  grantEventEditAccess: fetchGrantEventEditAccess,
  revokeEventEditAccess: fetchRevokeEventEditAccess,
  shareEventWithUser: fetchShareEventWithUser
};
