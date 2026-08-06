/**
 * Supabase `projects` domain scaffold.
 * Responsibility: project detail + lifecycle mutations.
 * Replace stubs with real `web-supabase` calls mapped to `$lib/types/*`.
 */
import type { AppAdapter } from '$lib/services/adapters/types';
import { stubMethod } from '../../scaffold';

const provider = 'supabase' as const;
const domain = 'projects' as const;

export const projectsDomain: Partial<AppAdapter> = {
  getProject: stubMethod(provider, domain, 'getProject') as AppAdapter['getProject'],
  createProject: stubMethod(provider, domain, 'createProject') as AppAdapter['createProject'],
  toggleProjectMembership: stubMethod(provider, domain, 'toggleProjectMembership') as AppAdapter['toggleProjectMembership'],
  toggleProjectDemandSignal: stubMethod(provider, domain, 'toggleProjectDemandSignal') as AppAdapter['toggleProjectDemandSignal'],
  setProjectSignal: stubMethod(provider, domain, 'setProjectSignal') as AppAdapter['setProjectSignal'],
  addProjectValue: stubMethod(provider, domain, 'addProjectValue') as AppAdapter['addProjectValue'],
  setProjectValueImportance: stubMethod(provider, domain, 'setProjectValueImportance') as AppAdapter['setProjectValueImportance'],
  addProjectProductionPlan: stubMethod(provider, domain, 'addProjectProductionPlan') as AppAdapter['addProjectProductionPlan'],
  updateProjectProductionPlan: stubMethod(provider, domain, 'updateProjectProductionPlan') as AppAdapter['updateProjectProductionPlan'],
  addProjectDistributionPlan: stubMethod(provider, domain, 'addProjectDistributionPlan') as AppAdapter['addProjectDistributionPlan'],
  setProjectPlanValueVote: stubMethod(provider, domain, 'setProjectPlanValueVote') as AppAdapter['setProjectPlanValueVote'],
  setProjectPlanCriterionRating: stubMethod(provider, domain, 'setProjectPlanCriterionRating') as AppAdapter['setProjectPlanCriterionRating'],
  setProjectPlanOverallVote: stubMethod(provider, domain, 'setProjectPlanOverallVote') as AppAdapter['setProjectPlanOverallVote'],
  addProjectActivity: stubMethod(provider, domain, 'addProjectActivity') as AppAdapter['addProjectActivity'],
  setProjectActivityCommitment: stubMethod(provider, domain, 'setProjectActivityCommitment') as AppAdapter['setProjectActivityCommitment'],
  setProjectActivityRating: stubMethod(provider, domain, 'setProjectActivityRating') as AppAdapter['setProjectActivityRating'],
  deleteProjectActivityRating: stubMethod(provider, domain, 'deleteProjectActivityRating') as AppAdapter['deleteProjectActivityRating'],
  addProjectServiceRequest: stubMethod(provider, domain, 'addProjectServiceRequest') as AppAdapter['addProjectServiceRequest'],
  createProjectManualLinkRequest: stubMethod(provider, domain, 'createProjectManualLinkRequest') as AppAdapter['createProjectManualLinkRequest'],
  setProjectManualLinkVote: stubMethod(provider, domain, 'setProjectManualLinkVote') as AppAdapter['setProjectManualLinkVote'],
  createProjectManualLinkSeverRequest: stubMethod(provider, domain, 'createProjectManualLinkSeverRequest') as AppAdapter['createProjectManualLinkSeverRequest'],
  planProjectServiceRequest: stubMethod(provider, domain, 'planProjectServiceRequest') as AppAdapter['planProjectServiceRequest'],
  setProjectServiceRequestStatus: stubMethod(provider, domain, 'setProjectServiceRequestStatus') as AppAdapter['setProjectServiceRequestStatus'],
  requestProjectServiceRequestSettingsChange: stubMethod(provider, domain, 'requestProjectServiceRequestSettingsChange') as AppAdapter['requestProjectServiceRequestSettingsChange'],
  setProjectServiceRequestSettingsChangeVote: stubMethod(provider, domain, 'setProjectServiceRequestSettingsChangeVote') as AppAdapter['setProjectServiceRequestSettingsChangeVote'],
  toggleProjectServiceHistoryCompletion: stubMethod(provider, domain, 'toggleProjectServiceHistoryCompletion') as AppAdapter['toggleProjectServiceHistoryCompletion'],
  requestProjectPhaseChange: stubMethod(provider, domain, 'requestProjectPhaseChange') as AppAdapter['requestProjectPhaseChange'],
  setProjectPhaseChangeVote: stubMethod(provider, domain, 'setProjectPhaseChangeVote') as AppAdapter['setProjectPhaseChangeVote'],
  requestProjectUpdate: stubMethod(provider, domain, 'requestProjectUpdate') as AppAdapter['requestProjectUpdate'],
  setProjectUpdateVote: stubMethod(provider, domain, 'setProjectUpdateVote') as AppAdapter['setProjectUpdateVote'],
  updateProjectDetails: stubMethod(provider, domain, 'updateProjectDetails') as AppAdapter['updateProjectDetails'],
  requestProjectEdit: stubMethod(provider, domain, 'requestProjectEdit') as AppAdapter['requestProjectEdit'],
  setProjectEditVote: stubMethod(provider, domain, 'setProjectEditVote') as AppAdapter['setProjectEditVote'],
  addProjectPullRequest: stubMethod(provider, domain, 'addProjectPullRequest') as AppAdapter['addProjectPullRequest'],
  setProjectPullRequestVote: stubMethod(provider, domain, 'setProjectPullRequestVote') as AppAdapter['setProjectPullRequestVote'],
  requestProjectMergeCapabilityChange: stubMethod(provider, domain, 'requestProjectMergeCapabilityChange') as AppAdapter['requestProjectMergeCapabilityChange'],
  setProjectMergeCapabilityChangeVote: stubMethod(provider, domain, 'setProjectMergeCapabilityChangeVote') as AppAdapter['setProjectMergeCapabilityChangeVote'],
  requestProjectRepositoryReplacement: stubMethod(provider, domain, 'requestProjectRepositoryReplacement') as AppAdapter['requestProjectRepositoryReplacement'],
  setProjectRepositoryReplacementVote: stubMethod(provider, domain, 'setProjectRepositoryReplacementVote') as AppAdapter['setProjectRepositoryReplacementVote'],
  recordProjectPullRequestMerge: stubMethod(provider, domain, 'recordProjectPullRequestMerge') as AppAdapter['recordProjectPullRequestMerge'],
  advanceProjectPhase: stubMethod(provider, domain, 'advanceProjectPhase') as AppAdapter['advanceProjectPhase'],
  revertProjectPhase: stubMethod(provider, domain, 'revertProjectPhase') as AppAdapter['revertProjectPhase'],
  addProjectUpdate: stubMethod(provider, domain, 'addProjectUpdate') as AppAdapter['addProjectUpdate'],
  shareProjectWithUser: stubMethod(provider, domain, 'shareProjectWithUser') as AppAdapter['shareProjectWithUser'],
};

