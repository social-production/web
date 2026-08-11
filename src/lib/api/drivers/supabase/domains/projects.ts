import { apiClient } from '../client';
import type { AppAdapter } from '$lib/services/adapters/types';
import type {
  ProjectActivityInput,
  ProjectApprovalVote,
  ProjectDistributionPlanInput,
  ProjectImportanceVoteValue,
  ProjectLifecyclePhaseId,
  ProjectPageData,
  ProjectPhaseChangeRequestOptions,
  ProjectProductionPlanInput,
  ProjectServiceHistoryCompletionChoice,
  ProjectServiceHistoryCompletionRole,
  ProjectServiceRequestInput,
  ProjectServiceRequestPlanInput,
  ProjectServiceRequestSettingsChangeInput,
  ProjectServiceRequestStatus,
  ProjectSoftwareMergeCapabilityChangeInput,
  ProjectSoftwarePullRequestInput,
  ProjectSoftwareRepositoryReplacementInput,
  ShareTargetResult,
  GovernanceSignalType
} from '$lib/types/detail';
import type { CreateProjectInput, CreateResult, SignalToggleResult } from '$lib/types/feed';

export async function fetchProject(slug: string): Promise<ProjectPageData | null> {
  try {
    return await apiClient.get<ProjectPageData>(`/projects/${encodeURIComponent(slug)}`);
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export async function fetchCreateProject(input: CreateProjectInput): Promise<CreateResult> {
  return apiClient.post<CreateResult>('/projects', input);
}

async function projectAction<T = { ok?: boolean }>(slug: string, action: string, body?: unknown): Promise<T> {
  return apiClient.post<T>(`/projects/${encodeURIComponent(slug)}/${action}`, body ?? {});
}

export async function fetchToggleProjectMembership(projectSlug: string): Promise<void> {
  await projectAction(projectSlug, 'membership');
}

export async function fetchToggleProjectDemandSignal(projectSlug: string): Promise<void> {
  await projectAction(projectSlug, 'demand-signal');
}

export async function fetchSetProjectSignal(
  projectSlug: string,
  signal: GovernanceSignalType
): Promise<SignalToggleResult> {
  return projectAction<SignalToggleResult>(projectSlug, 'signal', { signal });
}

export async function fetchAddProjectValue(projectSlug: string, label: string): Promise<void> {
  await projectAction(projectSlug, 'values', { label });
}

export async function fetchSetProjectValueImportance(
  projectSlug: string,
  valueId: string,
  importance: ProjectImportanceVoteValue
): Promise<void> {
  await projectAction(projectSlug, 'values/importance', { valueId, importance });
}

export async function fetchAddProjectProductionPlan(
  projectSlug: string,
  input: ProjectProductionPlanInput,
  projectMode?: string
): Promise<{ ok: boolean; error?: string }> {
  return projectAction(projectSlug, 'production-plans', { ...input, projectMode });
}

export async function fetchUpdateProjectProductionPlan(
  projectSlug: string,
  planId: string,
  input: ProjectProductionPlanInput
): Promise<{ ok: boolean; error?: string }> {
  return projectAction(projectSlug, `production-plans/${planId}`, input);
}

export async function fetchAddProjectDistributionPlan(
  projectSlug: string,
  input: ProjectDistributionPlanInput,
  projectMode?: string
): Promise<{ ok: boolean; error?: string }> {
  return projectAction(projectSlug, 'distribution-plans', { ...input, projectMode });
}

export async function fetchSetProjectPlanOverallVote(
  projectSlug: string,
  phaseId: Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>,
  planId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  await projectAction(projectSlug, 'plans/overall-vote', { phaseId, planId, vote });
}

export async function fetchSetProjectPlanValueVote(
  projectSlug: string,
  phaseId: Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>,
  planId: string,
  valueId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  await projectAction(projectSlug, 'plans/value-vote', { phaseId, planId, valueId, vote });
}

export async function fetchSetProjectPlanCriterionRating(
  projectSlug: string,
  planId: string,
  criterionId: string,
  rating: import('$lib/types/detail').PlanCriterionRating | null
): Promise<void> {
  await projectAction(projectSlug, 'plans/criterion-rating', { planId, criterionId, rating });
}

export async function fetchAddProjectActivity(
  projectSlug: string,
  input: ProjectActivityInput
): Promise<void> {
  await projectAction(projectSlug, 'activities', input);
}

export async function fetchSetProjectActivityCommitment(
  projectSlug: string,
  activityId: string,
  roleLabel: string | null
): Promise<void> {
  await projectAction(projectSlug, 'activities/commitment', { activityId, roleLabel });
}

export async function fetchSetProjectActivityRating(
  projectSlug: string,
  activityId: string,
  rating: number,
  comment: string | null
): Promise<void> {
  await projectAction(projectSlug, 'activities/rating', { activityId, rating, comment });
}

export async function fetchDeleteProjectActivityRating(
  projectSlug: string,
  activityId: string
): Promise<void> {
  await projectAction(projectSlug, 'activities/rating/delete', { activityId });
}

export async function fetchAddProjectPullRequest(
  projectSlug: string,
  input: ProjectSoftwarePullRequestInput
): Promise<void> {
  await projectAction(projectSlug, 'pull-requests', input);
}

export async function fetchSetProjectPullRequestVote(
  projectSlug: string,
  decisionId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  await projectAction(projectSlug, 'pull-requests/vote', { decisionId, vote });
}

export async function fetchRecordProjectPullRequestMerge(
  projectSlug: string,
  requestId: string,
  mergeId: string,
  mergeUrl: string
): Promise<void> {
  await projectAction(projectSlug, 'pull-requests/merge', { requestId, mergeId, mergeUrl });
}

export async function fetchRequestProjectMergeCapabilityChange(
  projectSlug: string,
  input: ProjectSoftwareMergeCapabilityChangeInput
): Promise<void> {
  await projectAction(projectSlug, 'merge-capability', input);
}

export async function fetchSetProjectMergeCapabilityChangeVote(
  projectSlug: string,
  decisionId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  await projectAction(projectSlug, 'merge-capability/vote', { decisionId, vote });
}

export async function fetchRequestProjectRepositoryReplacement(
  projectSlug: string,
  input: ProjectSoftwareRepositoryReplacementInput
): Promise<void> {
  await projectAction(projectSlug, 'repository-replacement', input);
}

export async function fetchSetProjectRepositoryReplacementVote(
  projectSlug: string,
  decisionId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  await projectAction(projectSlug, 'repository-replacement/vote', { decisionId, vote });
}

export async function fetchAddProjectServiceRequest(
  projectSlug: string,
  input: ProjectServiceRequestInput
): Promise<{ conversationId?: string }> {
  return projectAction(projectSlug, 'service-requests', input);
}

export async function fetchSetProjectServiceRequestStatus(
  projectSlug: string,
  requestId: string,
  status: ProjectServiceRequestStatus
): Promise<void> {
  await projectAction(projectSlug, 'service-requests/status', { requestId, status });
}

export async function fetchPlanProjectServiceRequest(
  projectSlug: string,
  requestId: string,
  input: ProjectServiceRequestPlanInput
): Promise<void> {
  await projectAction(projectSlug, 'service-requests/plan', { requestId, ...input });
}

export async function fetchRequestProjectServiceRequestSettingsChange(
  projectSlug: string,
  input: ProjectServiceRequestSettingsChangeInput
): Promise<void> {
  await projectAction(projectSlug, 'service-requests/settings-change', input);
}

export async function fetchSetProjectServiceRequestSettingsChangeVote(
  projectSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  await projectAction(projectSlug, 'service-requests/settings-change/vote', { requestId, vote });
}

export async function fetchToggleProjectServiceHistoryCompletion(
  projectSlug: string,
  historyId: string,
  role: ProjectServiceHistoryCompletionRole,
  selection?: ProjectServiceHistoryCompletionChoice
): Promise<void> {
  await projectAction(projectSlug, 'service-history/completion', { historyId, role, selection });
}

export async function fetchRequestProjectPhaseChange(
  projectSlug: string,
  targetPhaseId: ProjectLifecyclePhaseId,
  reason: string,
  options?: ProjectPhaseChangeRequestOptions
): Promise<void> {
  await projectAction(projectSlug, 'phase-change', { targetPhaseId, reason, ...(options ?? {}) });
}

export async function fetchSetProjectPhaseChangeVote(
  projectSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  await projectAction(projectSlug, 'phase-change/vote', { requestId, vote });
}

export async function fetchAdvanceProjectPhase(projectSlug: string, closeNote?: string): Promise<void> {
  await projectAction(projectSlug, 'phase/advance', { closeNote });
}

export async function fetchRevertProjectPhase(
  projectSlug: string,
  targetPhaseId: Extract<ProjectLifecyclePhaseId, 'phase-1' | 'phase-2' | 'phase-3'>,
  reason: string
): Promise<void> {
  await projectAction(projectSlug, 'phase/revert', { targetPhaseId, reason });
}

export async function fetchRequestProjectUpdate(projectSlug: string, body: string): Promise<void> {
  await projectAction(projectSlug, 'update-requests', { body });
}

export async function fetchSetProjectUpdateVote(
  projectSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  await projectAction(projectSlug, 'update-requests/vote', { requestId, vote });
}

export async function fetchUpdateProjectDetails(
  projectSlug: string,
  title: string,
  description: string
): Promise<void> {
  await projectAction(projectSlug, 'details', { title, description });
}

export async function fetchRequestProjectEdit(
  projectSlug: string,
  title: string,
  description: string
): Promise<void> {
  await projectAction(projectSlug, 'edit-requests', { title, description });
}

export async function fetchSetProjectEditVote(
  projectSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  await projectAction(projectSlug, 'edit-requests/vote', { requestId, vote });
}

export async function fetchAddProjectUpdate(
  projectSlug: string,
  title: string,
  body: string
): Promise<void> {
  await projectAction(projectSlug, 'updates', { title, body });
}

export async function fetchCreateProjectManualLinkRequest(
  projectSlug: string,
  targetKind: 'project' | 'event',
  targetSlug: string,
  summary: string,
  label?: string | null
): Promise<void> {
  await projectAction(projectSlug, 'manual-links', { targetKind, targetSlug, summary, label });
}

export async function fetchSetProjectManualLinkVote(
  projectSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  await projectAction(projectSlug, 'manual-links/vote', { requestId, vote });
}

export async function fetchCreateProjectManualLinkSeverRequest(
  projectSlug: string,
  linkId: string,
  summary?: string | null
): Promise<void> {
  await projectAction(projectSlug, 'manual-links/sever', { linkId, summary });
}

export async function fetchShareProjectWithUser(
  projectSlug: string,
  username: string
): Promise<ShareTargetResult> {
  return projectAction<ShareTargetResult>(projectSlug, 'share', { username });
}

export const projectsDomain: Partial<AppAdapter> = {
  getProject: fetchProject,
  createProject: fetchCreateProject,
  toggleProjectMembership: fetchToggleProjectMembership,
  toggleProjectDemandSignal: fetchToggleProjectDemandSignal,
  setProjectSignal: fetchSetProjectSignal,
  addProjectValue: fetchAddProjectValue,
  setProjectValueImportance: fetchSetProjectValueImportance,
  addProjectProductionPlan: fetchAddProjectProductionPlan,
  updateProjectProductionPlan: fetchUpdateProjectProductionPlan,
  addProjectDistributionPlan: fetchAddProjectDistributionPlan,
  setProjectPlanOverallVote: fetchSetProjectPlanOverallVote,
  setProjectPlanValueVote: fetchSetProjectPlanValueVote,
  setProjectPlanCriterionRating: fetchSetProjectPlanCriterionRating,
  addProjectActivity: fetchAddProjectActivity,
  setProjectActivityCommitment: fetchSetProjectActivityCommitment,
  setProjectActivityRating: fetchSetProjectActivityRating,
  deleteProjectActivityRating: fetchDeleteProjectActivityRating,
  addProjectPullRequest: fetchAddProjectPullRequest,
  setProjectPullRequestVote: fetchSetProjectPullRequestVote,
  recordProjectPullRequestMerge: fetchRecordProjectPullRequestMerge,
  requestProjectMergeCapabilityChange: fetchRequestProjectMergeCapabilityChange,
  setProjectMergeCapabilityChangeVote: fetchSetProjectMergeCapabilityChangeVote,
  requestProjectRepositoryReplacement: fetchRequestProjectRepositoryReplacement,
  setProjectRepositoryReplacementVote: fetchSetProjectRepositoryReplacementVote,
  addProjectServiceRequest: fetchAddProjectServiceRequest,
  setProjectServiceRequestStatus: fetchSetProjectServiceRequestStatus,
  planProjectServiceRequest: fetchPlanProjectServiceRequest,
  requestProjectServiceRequestSettingsChange: fetchRequestProjectServiceRequestSettingsChange,
  setProjectServiceRequestSettingsChangeVote: fetchSetProjectServiceRequestSettingsChangeVote,
  toggleProjectServiceHistoryCompletion: fetchToggleProjectServiceHistoryCompletion,
  requestProjectPhaseChange: fetchRequestProjectPhaseChange,
  setProjectPhaseChangeVote: fetchSetProjectPhaseChangeVote,
  advanceProjectPhase: fetchAdvanceProjectPhase,
  revertProjectPhase: fetchRevertProjectPhase,
  requestProjectUpdate: fetchRequestProjectUpdate,
  setProjectUpdateVote: fetchSetProjectUpdateVote,
  updateProjectDetails: fetchUpdateProjectDetails,
  requestProjectEdit: fetchRequestProjectEdit,
  setProjectEditVote: fetchSetProjectEditVote,
  addProjectUpdate: fetchAddProjectUpdate,
  createProjectManualLinkRequest: fetchCreateProjectManualLinkRequest,
  setProjectManualLinkVote: fetchSetProjectManualLinkVote,
  createProjectManualLinkSeverRequest: fetchCreateProjectManualLinkSeverRequest,
  shareProjectWithUser: fetchShareProjectWithUser
};
