import { c as currentAdapter } from "./index2.js";
function getProject(slug) {
  return currentAdapter.getProject(slug);
}
function getThread(slug) {
  return currentAdapter.getThread(slug);
}
function getPost(id) {
  return currentAdapter.getPost(id);
}
function getEvent(slug) {
  return currentAdapter.getEvent(slug);
}
function addProjectValue(projectSlug, label) {
  return currentAdapter.addProjectValue(projectSlug, label);
}
function setProjectValueImportance(projectSlug, valueId, importance) {
  return currentAdapter.setProjectValueImportance(projectSlug, valueId, importance);
}
function addProjectProductionPlan(projectSlug, input) {
  return currentAdapter.addProjectProductionPlan(projectSlug, input);
}
function addProjectDistributionPlan(projectSlug, input) {
  return currentAdapter.addProjectDistributionPlan(projectSlug, input);
}
function addProjectPullRequest(projectSlug, input) {
  return currentAdapter.addProjectPullRequest(projectSlug, input);
}
function requestProjectMergeCapabilityChange(projectSlug, input) {
  return currentAdapter.requestProjectMergeCapabilityChange(projectSlug, input);
}
function requestProjectRepositoryReplacement(projectSlug, input) {
  return currentAdapter.requestProjectRepositoryReplacement(projectSlug, input);
}
function setProjectPlanValueVote(projectSlug, phaseId, planId, valueId, vote) {
  return currentAdapter.setProjectPlanValueVote(projectSlug, phaseId, planId, valueId, vote);
}
function setProjectPlanOverallVote(projectSlug, phaseId, planId, vote) {
  return currentAdapter.setProjectPlanOverallVote(projectSlug, phaseId, planId, vote);
}
function addProjectActivity(projectSlug, input) {
  return currentAdapter.addProjectActivity(projectSlug, input);
}
function setProjectActivityCommitment(projectSlug, activityId, roleLabel) {
  return currentAdapter.setProjectActivityCommitment(projectSlug, activityId, roleLabel);
}
function addProjectServiceRequest(projectSlug, input) {
  return currentAdapter.addProjectServiceRequest(projectSlug, input);
}
function planProjectServiceRequest(projectSlug, requestId, input) {
  return currentAdapter.planProjectServiceRequest(projectSlug, requestId, input);
}
function setProjectServiceRequestStatus(projectSlug, requestId, status) {
  return currentAdapter.setProjectServiceRequestStatus(projectSlug, requestId, status);
}
function requestProjectServiceRequestSettingsChange(projectSlug, input) {
  return currentAdapter.requestProjectServiceRequestSettingsChange(projectSlug, input);
}
function setProjectServiceRequestSettingsChangeVote(projectSlug, requestId, vote) {
  return currentAdapter.setProjectServiceRequestSettingsChangeVote(projectSlug, requestId, vote);
}
function toggleProjectServiceHistoryCompletion(projectSlug, historyId, role, selection) {
  return currentAdapter.toggleProjectServiceHistoryCompletion(projectSlug, historyId, role, selection);
}
function requestProjectPhaseChange(projectSlug, targetPhaseId, reason, options) {
  return currentAdapter.requestProjectPhaseChange(projectSlug, targetPhaseId, reason, options);
}
function setProjectPhaseChangeVote(projectSlug, requestId, vote) {
  return currentAdapter.setProjectPhaseChangeVote(projectSlug, requestId, vote);
}
function setProjectUpdateVote(projectSlug, requestId, vote) {
  return currentAdapter.setProjectUpdateVote(projectSlug, requestId, vote);
}
function setProjectEditVote(projectSlug, requestId, vote) {
  return currentAdapter.setProjectEditVote(projectSlug, requestId, vote);
}
function setProjectPullRequestVote(projectSlug, decisionId, vote) {
  return currentAdapter.setProjectPullRequestVote(projectSlug, decisionId, vote);
}
function setProjectMergeCapabilityChangeVote(projectSlug, decisionId, vote) {
  return currentAdapter.setProjectMergeCapabilityChangeVote(projectSlug, decisionId, vote);
}
function setProjectRepositoryReplacementVote(projectSlug, decisionId, vote) {
  return currentAdapter.setProjectRepositoryReplacementVote(projectSlug, decisionId, vote);
}
function recordProjectPullRequestMerge(projectSlug, requestId, mergeId) {
  return currentAdapter.recordProjectPullRequestMerge(projectSlug, requestId, mergeId);
}
function advanceProjectPhase(projectSlug, closeNote) {
  return currentAdapter.advanceProjectPhase(projectSlug, closeNote);
}
function revertProjectPhase(projectSlug, targetPhaseId, reason) {
  return currentAdapter.revertProjectPhase(projectSlug, targetPhaseId, reason);
}
function addComment(subjectId, body, parentId) {
  return currentAdapter.addComment(subjectId, body, parentId);
}
function addEventValue(eventSlug, label) {
  return currentAdapter.addEventValue(eventSlug, label);
}
function setEventValueImportance(eventSlug, valueId, importance) {
  return currentAdapter.setEventValueImportance(eventSlug, valueId, importance);
}
function addEventPlan(eventSlug, input) {
  return currentAdapter.addEventPlan(eventSlug, input);
}
function setEventPlanValueVote(eventSlug, planId, valueId, vote) {
  return currentAdapter.setEventPlanValueVote(eventSlug, planId, valueId, vote);
}
function setEventPlanOverallVote(eventSlug, planId, vote) {
  return currentAdapter.setEventPlanOverallVote(eventSlug, planId, vote);
}
function addEventActivity(eventSlug, input) {
  return currentAdapter.addEventActivity(eventSlug, input);
}
function setEventActivityCommitment(eventSlug, activityId, roleLabel) {
  return currentAdapter.setEventActivityCommitment(eventSlug, activityId, roleLabel);
}
function requestEventPhaseChange(eventSlug, targetPhaseId, reason) {
  return currentAdapter.requestEventPhaseChange(eventSlug, targetPhaseId, reason);
}
function setEventPhaseChangeVote(eventSlug, requestId, vote) {
  return currentAdapter.setEventPhaseChangeVote(eventSlug, requestId, vote);
}
function setEventUpdateVote(eventSlug, requestId, vote) {
  return currentAdapter.setEventUpdateVote(eventSlug, requestId, vote);
}
function setEventEditVote(eventSlug, requestId, vote) {
  return currentAdapter.setEventEditVote(eventSlug, requestId, vote);
}
function shareProjectWithUser(projectSlug, username) {
  return currentAdapter.shareProjectWithUser(projectSlug, username);
}
function shareEventWithUser(eventSlug, username) {
  return currentAdapter.shareEventWithUser(eventSlug, username);
}
export {
  setProjectPlanValueVote as A,
  setProjectPlanOverallVote as B,
  addProjectValue as C,
  addProjectActivity as D,
  addProjectServiceRequest as E,
  setProjectServiceRequestStatus as F,
  planProjectServiceRequest as G,
  requestProjectServiceRequestSettingsChange as H,
  toggleProjectServiceHistoryCompletion as I,
  advanceProjectPhase as J,
  revertProjectPhase as K,
  addProjectPullRequest as L,
  requestProjectMergeCapabilityChange as M,
  requestProjectRepositoryReplacement as N,
  recordProjectPullRequestMerge as O,
  setProjectActivityCommitment as P,
  shareProjectWithUser as Q,
  getProject as R,
  getThread as S,
  setEventUpdateVote as a,
  setEventPhaseChangeVote as b,
  setEventActivityCommitment as c,
  addEventActivity as d,
  setEventPlanOverallVote as e,
  setEventPlanValueVote as f,
  addEventPlan as g,
  setEventValueImportance as h,
  addEventValue as i,
  shareEventWithUser as j,
  getEvent as k,
  addComment as l,
  getPost as m,
  setProjectRepositoryReplacementVote as n,
  setProjectMergeCapabilityChangeVote as o,
  setProjectPullRequestVote as p,
  setProjectServiceRequestSettingsChangeVote as q,
  requestEventPhaseChange as r,
  setEventEditVote as s,
  setProjectEditVote as t,
  setProjectUpdateVote as u,
  setProjectPhaseChangeVote as v,
  addProjectDistributionPlan as w,
  addProjectProductionPlan as x,
  requestProjectPhaseChange as y,
  setProjectValueImportance as z
};
