import { currentAdapter } from '$lib/services/adapters';
import type {
  ProjectActivityInput,
  ProjectApprovalVote,
  ProjectDistributionPlanInput,
  ProjectImportanceVoteValue,
  ProjectLifecyclePhaseId,
  ProjectProductionPlanInput,
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

export function addProjectServiceRequest(projectSlug: string, title: string, body: string) {
  return currentAdapter.addProjectServiceRequest(projectSlug, title, body);
}

export function setProjectServiceRequestStatus(
  projectSlug: string,
  requestId: string,
  status: ProjectServiceRequestStatus
) {
  return currentAdapter.setProjectServiceRequestStatus(projectSlug, requestId, status);
}

export function advanceProjectPhase(projectSlug: string) {
  return currentAdapter.advanceProjectPhase(projectSlug);
}

export function revertProjectPhase(
  projectSlug: string,
  targetPhaseId: Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>,
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