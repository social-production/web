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
  ProjectLocationEdit,
} from '$lib/types/detail';

export function toggleProjectMembership(projectSlug: string) {
  return currentAdapter.toggleProjectMembership(projectSlug);
}

export function toggleProjectDemandSignal(projectSlug: string) {
  return currentAdapter.toggleProjectDemandSignal(projectSlug);
}

export function setProjectSignal(projectSlug: string, signal: GovernanceSignalType) {
  return confirmed(currentAdapter.setProjectSignal(projectSlug, signal), 'Signal saved');
}

export function addProjectValue(projectSlug: string, label: string) {
  return currentAdapter.addProjectValue(projectSlug, label);
}

export function setProjectValueImportance(
  projectSlug: string,
  valueId: string,
  importance: ProjectImportanceVoteValue
) {
  return confirmed(
    currentAdapter.setProjectValueImportance(projectSlug, valueId, importance),
    'Vote recorded'
  );
}

export function addProjectProductionPlan(
  projectSlug: string,
  input: ProjectProductionPlanInput,
  projectMode?: string
) {
  return confirmed(
    currentAdapter.addProjectProductionPlan(projectSlug, input, projectMode),
    'Plan submitted'
  );
}

export function updateProjectProductionPlan(
  projectSlug: string,
  planId: string,
  input: ProjectProductionPlanInput
) {
  return currentAdapter.updateProjectProductionPlan(projectSlug, planId, input);
}

export function addProjectDistributionPlan(
  projectSlug: string,
  input: ProjectDistributionPlanInput,
  projectMode?: string
) {
  return confirmed(
    currentAdapter.addProjectDistributionPlan(projectSlug, input, projectMode),
    'Plan submitted'
  );
}

export function addProjectPullRequest(projectSlug: string, input: ProjectSoftwarePullRequestInput) {
  return currentAdapter.addProjectPullRequest(projectSlug, input);
}

export function requestProjectMergeCapabilityChange(
  projectSlug: string,
  input: ProjectSoftwareMergeCapabilityChangeInput
) {
  return currentAdapter.requestProjectMergeCapabilityChange(projectSlug, input);
}

export function requestProjectRepositoryReplacement(
  projectSlug: string,
  input: ProjectSoftwareRepositoryReplacementInput
) {
  return currentAdapter.requestProjectRepositoryReplacement(projectSlug, input);
}

export function setProjectPlanValueVote(
  projectSlug: string,
  phaseId: Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>,
  planId: string,
  valueId: string,
  vote: ProjectApprovalVote | null
) {
  return confirmed(
    currentAdapter.setProjectPlanValueVote(projectSlug, phaseId, planId, valueId, vote),
    'Assessment saved'
  );
}

export function setProjectPlanCriterionRating(
  projectSlug: string,
  planId: string,
  criterionId: string,
  rating: import('$lib/types/detail').PlanCriterionRating | null
) {
  return confirmed(
    currentAdapter.setProjectPlanCriterionRating(projectSlug, planId, criterionId, rating),
    rating === null ? 'Rating removed' : 'Rating saved'
  );
}

export function setProjectPlanOverallVote(
  projectSlug: string,
  phaseId: Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>,
  planId: string,
  vote: ProjectApprovalVote | null,
  comment?: string | null
) {
  return confirmed(
    currentAdapter.setProjectPlanOverallVote(projectSlug, phaseId, planId, vote, comment),
    comment != null ? 'Assessment saved' : 'Vote recorded'
  );
}

export function addProjectActivity(projectSlug: string, input: ProjectActivityInput) {
  return confirmed(currentAdapter.addProjectActivity(projectSlug, input), 'Activity created');
}

export function setProjectActivityCommitment(
  projectSlug: string,
  activityId: string,
  roleLabel: string | null
) {
  return confirmed(
    currentAdapter.setProjectActivityCommitment(projectSlug, activityId, roleLabel),
    // The button itself flips between Take role and Leave role.
    null
  );
}

export function setProjectActivityRating(
  projectSlug: string,
  activityId: string,
  rating: number,
  comment: string | null
) {
  return confirmed(
    currentAdapter.setProjectActivityRating(projectSlug, activityId, rating, comment),
    'Rating saved'
  );
}

export function deleteProjectActivityRating(projectSlug: string, activityId: string) {
  return confirmed(currentAdapter.deleteProjectActivityRating(projectSlug, activityId), 'Rating removed');
}

export function addProjectServiceRequest(projectSlug: string, input: ProjectServiceRequestInput) {
  return confirmed(currentAdapter.addProjectServiceRequest(projectSlug, input), 'Request sent');
}

export function createProjectManualLinkRequest(
  projectSlug: string,
  targetKind: 'project' | 'event',
  targetSlug: string,
  summary: string,
  relationshipLabel?: string | null
) {
  return currentAdapter.createProjectManualLinkRequest(
    projectSlug,
    targetKind,
    targetSlug,
    summary,
    relationshipLabel
  );
}

export function setProjectManualLinkVote(
  projectSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  return confirmed(
    currentAdapter.setProjectManualLinkVote(projectSlug, requestId, vote),
    'Vote recorded'
  );
}

export function createProjectManualLinkSeverRequest(
  projectSlug: string,
  linkId: string,
  summary?: string | null
) {
  return currentAdapter.createProjectManualLinkSeverRequest(projectSlug, linkId, summary);
}

export function planProjectServiceRequest(
  projectSlug: string,
  requestId: string,
  input: ProjectServiceRequestPlanInput
) {
  return currentAdapter.planProjectServiceRequest(projectSlug, requestId, input);
}

export function setProjectServiceRequestStatus(
  projectSlug: string,
  requestId: string,
  status: ProjectServiceRequestStatus,
  holdSlot = false,
  reason?: string | null
) {
  const labels: Partial<Record<ProjectServiceRequestStatus, string>> = {
    accepted: 'Request accepted',
    declined: 'Request declined',
    cancelled: 'Request cancelled',
  };
  return confirmed(
    currentAdapter.setProjectServiceRequestStatus(projectSlug, requestId, status, holdSlot, reason),
    labels[status] ?? 'Request updated'
  );
}

export function createProjectAvailabilityRule(
  projectSlug: string,
  input: { weekday: number; startTime: string; endTime: string; timezone?: string; note?: string }
) {
  return currentAdapter.createProjectAvailabilityRule(projectSlug, input);
}

export function deleteProjectAvailabilityRule(projectSlug: string, ruleId: string) {
  return currentAdapter.deleteProjectAvailabilityRule(projectSlug, ruleId);
}

export function suggestProjectActivityRole(
  projectSlug: string,
  activityId: string,
  roleId: string,
  suggestedUserId: string
) {
  return currentAdapter.suggestProjectActivityRole(
    projectSlug,
    activityId,
    roleId,
    suggestedUserId
  );
}

export function declineProjectActivityRoleSuggestion(
  projectSlug: string,
  activityId: string,
  roleId: string
) {
  return currentAdapter.declineProjectActivityRoleSuggestion(projectSlug, activityId, roleId);
}

export function requestProjectServiceRequestSettingsChange(
  projectSlug: string,
  input: ProjectServiceRequestSettingsChangeInput
) {
  return confirmed(
    currentAdapter.requestProjectServiceRequestSettingsChange(projectSlug, input),
    'Settings saved'
  );
}

export function setProjectServiceRequestSettingsChangeVote(
  projectSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  return confirmed(
    currentAdapter.setProjectServiceRequestSettingsChangeVote(projectSlug, requestId, vote),
    'Vote recorded'
  );
}

export function toggleProjectServiceHistoryCompletion(
  projectSlug: string,
  historyId: string,
  role: ProjectServiceHistoryCompletionRole,
  selection?: ProjectServiceHistoryCompletionChoice
) {
  return currentAdapter.toggleProjectServiceHistoryCompletion(
    projectSlug,
    historyId,
    role,
    selection
  );
}

export function requestProjectPhaseChange(
  projectSlug: string,
  targetPhaseId: ProjectLifecyclePhaseId,
  reason: string,
  options?: ProjectPhaseChangeRequestOptions
) {
  return confirmed(
    currentAdapter.requestProjectPhaseChange(projectSlug, targetPhaseId, reason, options),
    'Advance proposed. Your Yes is counted.'
  );
}

export function setProjectPhaseChangeVote(
  projectSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  return confirmed(
    currentAdapter.setProjectPhaseChangeVote(projectSlug, requestId, vote),
    'Vote recorded'
  );
}

export function requestProjectUpdate(projectSlug: string, body: string) {
  return currentAdapter.requestProjectUpdate(projectSlug, body).then(async (result) => {
    void invalidateFeedEngagementCache();
    return result;
  });
}

export function setProjectUpdateVote(
  projectSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  return confirmed(
    currentAdapter.setProjectUpdateVote(projectSlug, requestId, vote).then(async (result) => {
      void invalidateFeedEngagementCache();
      return result;
    }),
    'Vote recorded'
  );
}

export function updateProjectDetails(
  projectSlug: string,
  title: string,
  description: string,
  location?: ProjectLocationEdit | null
) {
  return confirmed(
    currentAdapter
      .updateProjectDetails(projectSlug, title, description, location)
      .then(async (result) => {
        void invalidateFeedEngagementCache();
        return result;
      }),
    'Details saved'
  );
}

export function requestProjectEdit(
  projectSlug: string,
  title: string,
  description: string,
  location?: ProjectLocationEdit | null
) {
  return confirmed(
    currentAdapter.requestProjectEdit(projectSlug, title, description, location).then(async (result) => {
      void invalidateFeedEngagementCache();
      return result;
    }),
    'Edit proposed'
  );
}

export function setProjectEditVote(
  projectSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  return confirmed(
    currentAdapter.setProjectEditVote(projectSlug, requestId, vote).then(async (result) => {
      void invalidateFeedEngagementCache();
      return result;
    }),
    'Vote recorded'
  );
}

export function setProjectPullRequestVote(
  projectSlug: string,
  decisionId: string,
  vote: ProjectApprovalVote | null
) {
  return currentAdapter.setProjectPullRequestVote(projectSlug, decisionId, vote);
}

export function setProjectMergeCapabilityChangeVote(
  projectSlug: string,
  decisionId: string,
  vote: ProjectApprovalVote | null
) {
  return currentAdapter.setProjectMergeCapabilityChangeVote(projectSlug, decisionId, vote);
}

export function setProjectRepositoryReplacementVote(
  projectSlug: string,
  decisionId: string,
  vote: ProjectApprovalVote | null
) {
  return currentAdapter.setProjectRepositoryReplacementVote(projectSlug, decisionId, vote);
}

export function recordProjectPullRequestMerge(
  projectSlug: string,
  requestId: string,
  mergeId: string,
  mergeUrl: string
) {
  return currentAdapter.recordProjectPullRequestMerge(projectSlug, requestId, mergeId, mergeUrl);
}

export function advanceProjectPhase(projectSlug: string, closeNote?: string) {
  return currentAdapter.advanceProjectPhase(projectSlug, closeNote);
}

export function revertProjectPhase(
  projectSlug: string,
  targetPhaseId: Extract<ProjectLifecyclePhaseId, 'phase-1' | 'phase-2' | 'phase-3'>,
  reason: string
) {
  return currentAdapter.revertProjectPhase(projectSlug, targetPhaseId, reason);
}

export function addProjectUpdate(projectSlug: string, title: string, body: string) {
  return currentAdapter.addProjectUpdate(projectSlug, title, body).then(async (result) => {
    void invalidateFeedEngagementCache();
    return result;
  });
}

export function shareProjectWithUser(projectSlug: string, username: string) {
  return currentAdapter.shareProjectWithUser(projectSlug, username);
}
