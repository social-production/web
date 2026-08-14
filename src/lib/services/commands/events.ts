import { currentAdapter } from '$lib/services/adapters';
import { requestActivityRailRefresh } from '$lib/services/queries/bootstrap';
import { invalidateFeedEngagementCache } from '$lib/utils/feedSignals';
import type {
  EventLifecyclePhaseId,
  EventPlanInput,
  GovernanceSignalType,
  ProjectActivityInput,
  ProjectServiceHistoryCompletionChoice,
  ProjectServiceHistoryCompletionRole,
  ProjectApprovalVote,
  ProjectDistributionPlanInput,
  ProjectImportanceVoteValue,
  ProjectLifecyclePhaseId,
  ProjectPhaseChangeRequestOptions,
  ProjectProductionPlanInput,
  ProjectServiceRequestInput,
  ProjectServiceRequestPlanInput,
  ProjectServiceRequestSettingsChangeInput,
  ProjectSoftwareMergeCapabilityChangeInput,
  ProjectSoftwarePullRequestInput,
  ProjectSoftwareRepositoryReplacementInput,
  ProjectServiceRequestStatus,
} from '$lib/types/detail';

export function toggleEventMembership(eventSlug: string) {
  return currentAdapter.toggleEventMembership(eventSlug);
}

export function setEventSignal(eventSlug: string, signal: GovernanceSignalType) {
  return currentAdapter.setEventSignal(eventSlug, signal);
}

export function addEventValue(eventSlug: string, label: string) {
  return currentAdapter.addEventValue(eventSlug, label);
}

export function setEventValueImportance(
  eventSlug: string,
  valueId: string,
  importance: ProjectImportanceVoteValue
) {
  return currentAdapter.setEventValueImportance(eventSlug, valueId, importance);
}

export function addEventPlan(eventSlug: string, input: EventPlanInput) {
  return currentAdapter.addEventPlan(eventSlug, input);
}

export function setEventPlanValueVote(
  eventSlug: string,
  planId: string,
  valueId: string,
  vote: ProjectApprovalVote | null
) {
  return currentAdapter.setEventPlanValueVote(eventSlug, planId, valueId, vote);
}

export function setEventPlanCriterionRating(
  eventSlug: string,
  planId: string,
  criterionId: string,
  rating: import('$lib/types/detail').PlanCriterionRating | null
) {
  return currentAdapter.setEventPlanCriterionRating(eventSlug, planId, criterionId, rating);
}

export function setEventPlanOverallVote(
  eventSlug: string,
  planId: string,
  vote: ProjectApprovalVote | null
) {
  return currentAdapter.setEventPlanOverallVote(eventSlug, planId, vote);
}

export function addEventActivity(eventSlug: string, input: ProjectActivityInput) {
  return currentAdapter.addEventActivity(eventSlug, input);
}

export async function setEventActivityCommitment(
  eventSlug: string,
  activityId: string,
  roleLabel: string | null
) {
  const result = await currentAdapter.setEventActivityCommitment(eventSlug, activityId, roleLabel);
  requestActivityRailRefresh();
  return result;
}

export function setEventActivityRating(
  eventSlug: string,
  activityId: string,
  rating: number,
  comment: string | null
) {
  return currentAdapter.setEventActivityRating(eventSlug, activityId, rating, comment);
}

export function deleteEventActivityRating(eventSlug: string, activityId: string) {
  return currentAdapter.deleteEventActivityRating(eventSlug, activityId);
}

export function toggleEventHistoryCompletion(
  eventSlug: string,
  historyId: string,
  role: ProjectServiceHistoryCompletionRole,
  selection?: ProjectServiceHistoryCompletionChoice
) {
  return currentAdapter.toggleEventHistoryCompletion(eventSlug, historyId, role, selection);
}

export function requestEventPhaseChange(
  eventSlug: string,
  targetPhaseId: EventLifecyclePhaseId,
  reason: string
) {
  return currentAdapter.requestEventPhaseChange(eventSlug, targetPhaseId, reason);
}

export function setEventPhaseChangeVote(
  eventSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  return currentAdapter.setEventPhaseChangeVote(eventSlug, requestId, vote);
}

export function requestEventUpdate(eventSlug: string, body: string) {
  return currentAdapter.requestEventUpdate(eventSlug, body).then(async (result) => {
    await invalidateFeedEngagementCache();
    return result;
  });
}

export function setEventUpdateVote(
  eventSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  return currentAdapter.setEventUpdateVote(eventSlug, requestId, vote).then(async (result) => {
    await invalidateFeedEngagementCache();
    return result;
  });
}

export function requestEventEdit(eventSlug: string, title: string, description: string) {
  return currentAdapter.requestEventEdit(eventSlug, title, description).then(async (result) => {
    await invalidateFeedEngagementCache();
    return result;
  });
}

export function setEventEditVote(
  eventSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  return currentAdapter.setEventEditVote(eventSlug, requestId, vote).then(async (result) => {
    await invalidateFeedEngagementCache();
    return result;
  });
}

export function createEventManualLinkRequest(
  eventSlug: string,
  targetKind: 'project' | 'event',
  targetSlug: string,
  summary: string,
  relationshipLabel?: string | null
) {
  return currentAdapter.createEventManualLinkRequest(
    eventSlug,
    targetKind,
    targetSlug,
    summary,
    relationshipLabel
  );
}

export function setEventManualLinkVote(
  eventSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  return currentAdapter.setEventManualLinkVote(eventSlug, requestId, vote);
}

export function createEventManualLinkSeverRequest(
  eventSlug: string,
  linkId: string,
  summary?: string | null
) {
  return currentAdapter.createEventManualLinkSeverRequest(eventSlug, linkId, summary);
}

export function grantEventEditAccess(eventSlug: string, userId: string) {
  return currentAdapter.grantEventEditAccess(eventSlug, userId);
}

export function revokeEventEditAccess(eventSlug: string, userId: string) {
  return currentAdapter.revokeEventEditAccess(eventSlug, userId);
}

export function shareEventWithUser(eventSlug: string, username: string) {
  return currentAdapter.shareEventWithUser(eventSlug, username);
}
