import { currentAdapter } from '$lib/services/adapters';
import type {
  ProjectActivityInput,
  ProjectServiceHistoryCompletionChoice,
  ProjectServiceHistoryCompletionRole,
  ProjectApprovalVote,
  ProjectDistributionPlanInput,
  ProjectImportanceVoteValue,
  ProjectLifecyclePhaseId,
  ProjectProductionPlanInput,
  ProjectServiceRequestInput,
  ProjectServiceRequestPlanInput,
  ProjectServiceRequestSettingsChangeInput,
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

export function getEvent(slug: string) {
  return currentAdapter.getEvent(slug);
}

export function toggleEventGoing(eventId: string) {
  return currentAdapter.toggleEventGoing(eventId);
}

export function toggleProjectMembership(projectSlug: string) {
  return currentAdapter.toggleProjectMembership(projectSlug);
}

export function toggleProjectDemandSignal(projectSlug: string) {
  return currentAdapter.toggleProjectDemandSignal(projectSlug);
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

export function addProjectProductionPlan(projectSlug: string, input: ProjectProductionPlanInput) {
  return currentAdapter.addProjectProductionPlan(projectSlug, input);
}

export function addProjectDistributionPlan(projectSlug: string, input: ProjectDistributionPlanInput) {
  return currentAdapter.addProjectDistributionPlan(projectSlug, input);
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

export function addProjectServiceRequest(projectSlug: string, input: ProjectServiceRequestInput) {
  return currentAdapter.addProjectServiceRequest(projectSlug, input);
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
  reason: string
) {
  return currentAdapter.requestProjectPhaseChange(projectSlug, targetPhaseId, reason);
}

export function setProjectPhaseChangeVote(
  projectSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  return currentAdapter.setProjectPhaseChangeVote(projectSlug, requestId, vote);
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

export function toggleProjectManagerNomination(projectSlug: string) {
  return currentAdapter.toggleProjectManagerNomination(projectSlug);
}

export function toggleEventManagerNomination(eventSlug: string) {
  return currentAdapter.toggleEventManagerNomination(eventSlug);
}

export function inviteEventManager(eventSlug: string, userId: string) {
  return currentAdapter.inviteEventManager(eventSlug, userId);
}

export function addComment(subjectId: string, body: string, parentId?: string) {
  return currentAdapter.addComment(subjectId, body, parentId);
}

export function addProjectUpdate(projectSlug: string, title: string, body: string) {
  return currentAdapter.addProjectUpdate(projectSlug, title, body);
}

export function addEventUpdate(eventSlug: string, title: string, body: string) {
  return currentAdapter.addEventUpdate(eventSlug, title, body);
}

export function shareProjectWithUser(projectSlug: string, username: string) {
  return currentAdapter.shareProjectWithUser(projectSlug, username);
}

export function shareEventWithUser(eventSlug: string, username: string) {
  return currentAdapter.shareEventWithUser(eventSlug, username);
}