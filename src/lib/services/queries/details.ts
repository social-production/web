import { currentAdapter } from '$lib/services/adapters';
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
  ProjectServiceRequestStatus
} from '$lib/types/detail';

export function getProject(slug: string) {
  return currentAdapter.getProject(slug);
}

export function getThread(slug: string) {
  return currentAdapter.getThread(slug);
}

export function getPost(id: string) {
  return currentAdapter.getPost(id);
}

export function getHelpRequest(id: string) {
  return currentAdapter.getHelpRequest(id);
}

export function commitHelpRequestRole(helpRequestId: string, roleId: string) {
  return currentAdapter.commitHelpRequestRole(helpRequestId, roleId);
}

export function uncommitHelpRequestRole(helpRequestId: string, roleId: string) {
  return currentAdapter.uncommitHelpRequestRole(helpRequestId, roleId);
}

export function getEvent(slug: string) {
  return currentAdapter.getEvent(slug);
}

export function toggleEventMembership(eventSlug: string) {
  return currentAdapter.toggleEventMembership(eventSlug);
}

export function toggleProjectMembership(projectSlug: string) {
  return currentAdapter.toggleProjectMembership(projectSlug);
}

export function toggleProjectDemandSignal(projectSlug: string) {
  return currentAdapter.toggleProjectDemandSignal(projectSlug);
}

export function setProjectSignal(projectSlug: string, signal: GovernanceSignalType) {
  return currentAdapter.setProjectSignal(projectSlug, signal);
}

export function addProjectValue(projectSlug: string, label: string) {
  return currentAdapter.addProjectValue(projectSlug, label);
}

export function setProjectValueImportance(
  projectSlug: string,
  valueId: string,
  importance: ProjectImportanceVoteValue
) {
  return currentAdapter.setProjectValueImportance(projectSlug, valueId, importance);
}

export function addProjectProductionPlan(
  projectSlug: string,
  input: ProjectProductionPlanInput,
  projectMode?: string
) {
  return currentAdapter.addProjectProductionPlan(projectSlug, input, projectMode);
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
  return currentAdapter.addProjectDistributionPlan(projectSlug, input, projectMode);
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
  return currentAdapter.setProjectPlanValueVote(projectSlug, phaseId, planId, valueId, vote);
}

export function setProjectPlanCriterionRating(
  projectSlug: string,
  planId: string,
  criterionId: string,
  rating: import('$lib/types/detail').PlanCriterionRating | null
) {
  return currentAdapter.setProjectPlanCriterionRating(projectSlug, planId, criterionId, rating);
}

export function setProjectPlanOverallVote(
  projectSlug: string,
  phaseId: Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>,
  planId: string,
  vote: ProjectApprovalVote | null
) {
  return currentAdapter.setProjectPlanOverallVote(projectSlug, phaseId, planId, vote);
}

export function addProjectActivity(projectSlug: string, input: ProjectActivityInput) {
  return currentAdapter.addProjectActivity(projectSlug, input);
}

export function setProjectActivityCommitment(
  projectSlug: string,
  activityId: string,
  roleLabel: string | null
) {
  return currentAdapter.setProjectActivityCommitment(projectSlug, activityId, roleLabel);
}

export function setProjectActivityRating(
  projectSlug: string,
  activityId: string,
  rating: number,
  comment: string | null
) {
  return currentAdapter.setProjectActivityRating(projectSlug, activityId, rating, comment);
}

export function deleteProjectActivityRating(projectSlug: string, activityId: string) {
  return currentAdapter.deleteProjectActivityRating(projectSlug, activityId);
}

export function addProjectServiceRequest(projectSlug: string, input: ProjectServiceRequestInput) {
  return currentAdapter.addProjectServiceRequest(projectSlug, input);
}

export function createProjectManualLinkRequest(
  projectSlug: string,
  targetProjectSlug: string,
  relationshipLabel: string,
  summary: string
) {
  return currentAdapter.createProjectManualLinkRequest(
    projectSlug,
    targetProjectSlug,
    relationshipLabel,
    summary
  );
}

export function setProjectManualLinkVote(
  projectSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  return currentAdapter.setProjectManualLinkVote(projectSlug, requestId, vote);
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
  status: ProjectServiceRequestStatus
) {
  return currentAdapter.setProjectServiceRequestStatus(projectSlug, requestId, status);
}

export function requestProjectServiceRequestSettingsChange(
  projectSlug: string,
  input: ProjectServiceRequestSettingsChangeInput
) {
  return currentAdapter.requestProjectServiceRequestSettingsChange(projectSlug, input);
}

export function setProjectServiceRequestSettingsChangeVote(
  projectSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  return currentAdapter.setProjectServiceRequestSettingsChangeVote(projectSlug, requestId, vote);
}

export function toggleProjectServiceHistoryCompletion(
  projectSlug: string,
  historyId: string,
  role: ProjectServiceHistoryCompletionRole,
  selection?: ProjectServiceHistoryCompletionChoice
) {
  return currentAdapter.toggleProjectServiceHistoryCompletion(projectSlug, historyId, role, selection);
}

export function requestProjectPhaseChange(
  projectSlug: string,
  targetPhaseId: ProjectLifecyclePhaseId,
  reason: string,
  options?: ProjectPhaseChangeRequestOptions
) {
  return currentAdapter.requestProjectPhaseChange(projectSlug, targetPhaseId, reason, options);
}

export function setProjectPhaseChangeVote(
  projectSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  return currentAdapter.setProjectPhaseChangeVote(projectSlug, requestId, vote);
}

export function requestProjectUpdate(projectSlug: string, body: string) {
  return currentAdapter.requestProjectUpdate(projectSlug, body);
}

export function setProjectUpdateVote(
  projectSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  return currentAdapter.setProjectUpdateVote(projectSlug, requestId, vote);
}

export function updateProjectDetails(
  projectSlug: string,
  title: string,
  description: string
) {
  return currentAdapter.updateProjectDetails(projectSlug, title, description);
}

export function requestProjectEdit(
  projectSlug: string,
  title: string,
  description: string
) {
  return currentAdapter.requestProjectEdit(projectSlug, title, description);
}

export function setProjectEditVote(
  projectSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  return currentAdapter.setProjectEditVote(projectSlug, requestId, vote);
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
  mergeId: string
) {
  return currentAdapter.recordProjectPullRequestMerge(projectSlug, requestId, mergeId);
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

export function addComment(
  subjectId: string,
  body: string,
  parentId?: string,
  subjectType?: 'thread' | 'post' | 'event' | 'project' | 'help_request'
) {
  return currentAdapter.addComment(subjectId, body, parentId, subjectType);
}

export function submitReport(subjectId: string, targetId: string, reason: string, details: string) {
  return currentAdapter.submitReport(subjectId, targetId, reason, details);
}

export function setReportVote(targetId: string, vote: 'yes' | 'no') {
  return currentAdapter.setReportVote(targetId, vote);
}

export function addProjectUpdate(projectSlug: string, title: string, body: string) {
  return currentAdapter.addProjectUpdate(projectSlug, title, body);
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

export function setEventActivityCommitment(
  eventSlug: string,
  activityId: string,
  roleLabel: string | null
) {
  return currentAdapter.setEventActivityCommitment(eventSlug, activityId, roleLabel);
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
  return currentAdapter.requestEventUpdate(eventSlug, body);
}

export function setEventUpdateVote(
  eventSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  return currentAdapter.setEventUpdateVote(eventSlug, requestId, vote);
}

export function requestEventEdit(eventSlug: string, title: string, description: string) {
  return currentAdapter.requestEventEdit(eventSlug, title, description);
}

export function setEventEditVote(
  eventSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  return currentAdapter.setEventEditVote(eventSlug, requestId, vote);
}

export function grantEventEditAccess(eventSlug: string, userId: string) {
  return currentAdapter.grantEventEditAccess(eventSlug, userId);
}

export function revokeEventEditAccess(eventSlug: string, userId: string) {
  return currentAdapter.revokeEventEditAccess(eventSlug, userId);
}

export function shareProjectWithUser(projectSlug: string, username: string) {
  return currentAdapter.shareProjectWithUser(projectSlug, username);
}

export function shareEventWithUser(eventSlug: string, username: string) {
  return currentAdapter.shareEventWithUser(eventSlug, username);
}