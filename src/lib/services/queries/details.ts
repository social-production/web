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


export * from '$lib/services/commands/projects';
export * from '$lib/services/commands/events';
export * from '$lib/services/commands/shared';
