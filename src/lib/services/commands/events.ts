import { showToast } from '$lib/stores/toast';
import { currentAdapter } from '$lib/services/adapters';
import { confirmed } from '$lib/services/commands/confirm';
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
  return confirmed(currentAdapter.setEventSignal(eventSlug, signal), 'Signal saved');
}

export function addEventValue(eventSlug: string, label: string) {
  return currentAdapter.addEventValue(eventSlug, label);
}

export function setEventValueImportance(
  eventSlug: string,
  valueId: string,
  importance: ProjectImportanceVoteValue
) {
  return confirmed(
    currentAdapter.setEventValueImportance(eventSlug, valueId, importance),
    'Vote recorded'
  );
}

export function addEventPlan(eventSlug: string, input: EventPlanInput) {
  return confirmed(currentAdapter.addEventPlan(eventSlug, input), 'Plan submitted');
}

export function setEventPlanValueVote(
  eventSlug: string,
  planId: string,
  valueId: string,
  vote: ProjectApprovalVote | null
) {
  return confirmed(
    currentAdapter.setEventPlanValueVote(eventSlug, planId, valueId, vote),
    'Assessment saved'
  );
}

export function setEventPlanCriterionRating(
  eventSlug: string,
  planId: string,
  criterionId: string,
  rating: import('$lib/types/detail').PlanCriterionRating | null
) {
  return confirmed(
    currentAdapter.setEventPlanCriterionRating(eventSlug, planId, criterionId, rating),
    rating === null ? 'Rating removed' : 'Rating saved'
  );
}

export function setEventPlanOverallVote(
  eventSlug: string,
  planId: string,
  vote: ProjectApprovalVote | null
) {
  return confirmed(
    currentAdapter.setEventPlanOverallVote(eventSlug, planId, vote),
    'Vote recorded'
  );
}

export function addEventActivity(eventSlug: string, input: ProjectActivityInput) {
  return confirmed(currentAdapter.addEventActivity(eventSlug, input), 'Activity created');
}

export function setEventActivityCommitment(
  eventSlug: string,
  activityId: string,
  roleLabel: string | null
) {
  return confirmed(
    currentAdapter.setEventActivityCommitment(eventSlug, activityId, roleLabel),
    // The button itself flips between Take role and Leave role.
    null
  );
}

export function setEventActivityRating(
  eventSlug: string,
  activityId: string,
  rating: number,
  comment: string | null
) {
  return confirmed(
    currentAdapter.setEventActivityRating(eventSlug, activityId, rating, comment),
    'Rating saved'
  );
}

export function deleteEventActivityRating(eventSlug: string, activityId: string) {
  return confirmed(currentAdapter.deleteEventActivityRating(eventSlug, activityId), 'Rating removed');
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
  return confirmed(
    currentAdapter.requestEventPhaseChange(eventSlug, targetPhaseId, reason),
    'Advance proposed. Your Yes is counted.'
  );
}

export function setEventPhaseChangeVote(
  eventSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  return confirmed(
    currentAdapter.setEventPhaseChangeVote(eventSlug, requestId, vote),
    'Vote recorded'
  );
}

export function requestEventUpdate(eventSlug: string, body: string) {
  return confirmed(
    currentAdapter.requestEventUpdate(eventSlug, body).then(async (result) => {
      void invalidateFeedEngagementCache();
      showToast(result?.applied ? 'Update posted' : 'Vote started on your update');
      return result;
    }),
    null
  );
}

export function setEventUpdateVote(
  eventSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  return confirmed(
    currentAdapter.setEventUpdateVote(eventSlug, requestId, vote).then(async (result) => {
      void invalidateFeedEngagementCache();
      return result;
    }),
    'Vote recorded'
  );
}

export function requestEventEdit(eventSlug: string, title: string, description: string) {
  return confirmed(
    currentAdapter.requestEventEdit(eventSlug, title, description).then(async (result) => {
      void invalidateFeedEngagementCache();
      showToast(result?.applied ? 'Edit applied' : 'Vote started on your edit');
      return result;
    }),
    null
  );
}

export function setEventEditVote(
  eventSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  return confirmed(
    currentAdapter.setEventEditVote(eventSlug, requestId, vote).then(async (result) => {
      void invalidateFeedEngagementCache();
      return result;
    }),
    'Vote recorded'
  );
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
  return confirmed(
    currentAdapter.setEventManualLinkVote(eventSlug, requestId, vote),
    'Vote recorded'
  );
}

export function createEventManualLinkSeverRequest(
  eventSlug: string,
  linkId: string,
  summary?: string | null
) {
  return currentAdapter.createEventManualLinkSeverRequest(eventSlug, linkId, summary);
}

export function grantEventEditAccess(eventSlug: string, userId: string) {
  return confirmed(currentAdapter.grantEventEditAccess(eventSlug, userId), 'Made an organizer');
}

export function revokeEventEditAccess(eventSlug: string, userId: string) {
  return confirmed(currentAdapter.revokeEventEditAccess(eventSlug, userId), 'Organizer removed');
}

export function shareEventWithUser(eventSlug: string, username: string) {
  return currentAdapter.shareEventWithUser(eventSlug, username);
}

export function suggestEventActivityRole(
  eventSlug: string,
  activityId: string,
  roleId: string,
  suggestedUserId: string
) {
  return currentAdapter.suggestEventActivityRole(eventSlug, activityId, roleId, suggestedUserId);
}

export function declineEventActivityRoleSuggestion(
  eventSlug: string,
  activityId: string,
  roleId: string
) {
  return currentAdapter.declineEventActivityRoleSuggestion(eventSlug, activityId, roleId);
}
