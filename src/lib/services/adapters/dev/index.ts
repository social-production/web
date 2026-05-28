import type { AppAdapter } from '$lib/services/adapters/types';
import {
  addMockProjectActivity,
  setMockProjectActivityCommitment,
  addMockComment,
  createMockChannel,
  createMockCommunity,
  createMockEvent,
  createMockPost,
  createMockProject,
  createMockThread,
  addMockProjectDistributionPlan,
  requestMockProjectMergeCapabilityChange,
  addMockProjectPullRequest,
  addMockProjectProductionPlan,
  updateMockProjectProductionPlan,
  requestMockProjectRepositoryReplacement,
  addMockProjectServiceRequest,
  createMockProjectManualLinkRequest,
  planMockProjectServiceRequest,
  requestMockProjectServiceRequestSettingsChange,
  buildSearchFixture,
  setMockProjectSignal,
  setMockProjectServiceHistoryCompletion,
  toggleMockProjectDemandSignal,
  addMockProjectValue,
  findChannelScopeFixture,
  findCommunityScopeFixture,
  findEventFixture,
  findMessagesFixture,
  findNotificationsFixture,
  findPostFixture,
  findProfileFixture,
  findProjectFixture,
  findThreadFixture,
  hydrateMockClientState,
  getBootstrapFixture,
  getPersonalFeedFixture,
  getPublicFeedFixture,
  getSettingsFixture,
  getPlatformScopeFixture,
  getPlatformAssetsFixture,
  markAllMockNotificationsRead,
  markMockConversationRead,
  markMockNotificationRead,
  onboardingFixture,
  signInMockAccount,
  signOutMockAccount,
  signUpMockAccount,
  redeemMockScopeInvite,
  addMockGroupConversationMember,
  createMockGroupConversation,
  renameMockGroupConversation,
  removeMockGroupConversationMember,
  shareMockEventWithUser,
  shareMockProjectWithUser,
  sendMockMessage,
  startMockDirectMessage,
  addMockProjectUpdate,
  addMockEventActivity,
  addMockEventPlan,
  addMockEventValue,
  grantMockEventEditAccess,
  requestMockEventPhaseChange,
  setMockReportVote,
  setMockEventActivityCommitment,
  setMockEventPhaseChangeVote,
  setMockEventPlanOverallVote,
  setMockEventPlanValueVote,
  setMockEventSignal,
  setMockEventValueImportance,
  setMockVote,
  submitMockReport,
  setMockEventEditVote,
  setMockEventUpdateVote,
  setMockProjectPlanOverallVote,
  setMockProjectPlanValueVote,
  setMockProjectManualLinkVote,
  setMockProjectEditVote,
  setMockProjectPhaseChangeVote,
  setMockProjectPullRequestVote,
  setMockProjectMergeCapabilityChangeVote,
  setMockProjectRepositoryReplacementVote,
  setMockProjectUpdateVote,
  setMockProjectServiceRequestSettingsChangeVote,
  setMockProjectValueImportance,
  setMockProjectServiceRequestStatus,
  requestMockProjectEdit,
  requestMockProjectPhaseChange,
  requestMockProjectUpdate,
  requestMockEventEdit,
  requestMockEventUpdate,
  revokeMockEventEditAccess,
  toggleMockEventGoing,
  advanceMockProjectPhase,
  recordMockProjectPullRequestMerge,
  revertMockProjectPhase,
  toggleMockProjectMembership,
  toggleMockScopeMembership,
  updateMockProjectDetails,
  updateMockSettings
} from '$lib/services/adapters/dev/data';

export const devAdapter: AppAdapter = {
  async getBootstrap() {
    return structuredClone(getBootstrapFixture());
  },

  async hydrateClientState() {
    return hydrateMockClientState();
  },

  async getPublicFeed() {
    return structuredClone(getPublicFeedFixture());
  },

  async getPersonalFeed() {
    return structuredClone(getPersonalFeedFixture());
  },

  async getChannel(slug) {
    return structuredClone(findChannelScopeFixture(slug));
  },

  async getCommunity(slug) {
    return structuredClone(findCommunityScopeFixture(slug));
  },

  async getPlatform() {
    return structuredClone(getPlatformScopeFixture());
  },

  async getPlatformAssets() {
    return structuredClone(getPlatformAssetsFixture());
  },

  async getOnboarding() {
    return structuredClone(onboardingFixture);
  },

  async signIn(input) {
    return structuredClone(signInMockAccount(input));
  },

  async signOut() {
    signOutMockAccount();
  },

  async signUp(input) {
    return structuredClone(signUpMockAccount(input));
  },

  async getSettings() {
    return structuredClone(getSettingsFixture());
  },

  async updateSettings(input) {
    updateMockSettings(input);
  },

  async getProfile(username) {
    return structuredClone(findProfileFixture(username));
  },

  async getNotifications() {
    return structuredClone(findNotificationsFixture());
  },

  async getMessages() {
    return structuredClone(findMessagesFixture());
  },

  async getSearch(query) {
    return structuredClone(buildSearchFixture(query));
  },

  async getProject(slug) {
    return structuredClone(findProjectFixture(slug));
  },

  async getThread(slug) {
    return structuredClone(findThreadFixture(slug));
  },

  async createProject(input) {
    return structuredClone(createMockProject(input));
  },

  async createThread(input) {
    return structuredClone(createMockThread(input));
  },

  async createEvent(input) {
    return structuredClone(createMockEvent(input));
  },

  async createPost(input) {
    return structuredClone(createMockPost(input));
  },

  async createChannel(input) {
    return structuredClone(createMockChannel(input));
  },

  async createCommunity(input) {
    return structuredClone(createMockCommunity(input));
  },

  async getPost(id) {
    return structuredClone(findPostFixture(id));
  },

  async getEvent(slug) {
    return structuredClone(findEventFixture(slug));
  },

  async toggleEventGoing(eventId) {
    toggleMockEventGoing(eventId);
  },

  async toggleProjectMembership(projectSlug) {
    toggleMockProjectMembership(projectSlug);
  },

  async toggleProjectDemandSignal(projectSlug) {
    toggleMockProjectDemandSignal(projectSlug);
  },

  async setProjectSignal(projectSlug, signal) {
    setMockProjectSignal(projectSlug, signal);
  },

  async addProjectValue(projectSlug, label) {
    addMockProjectValue(projectSlug, label);
  },

  async setProjectValueImportance(projectSlug, valueId, importance) {
    setMockProjectValueImportance(projectSlug, valueId, importance);
  },

  async addProjectProductionPlan(projectSlug, input) {
    return addMockProjectProductionPlan(projectSlug, input);
  },

  async updateProjectProductionPlan(projectSlug, planId, input) {
    return updateMockProjectProductionPlan(projectSlug, planId, input);
  },

  async addProjectDistributionPlan(projectSlug, input) {
    return addMockProjectDistributionPlan(projectSlug, input);
  },

  async addProjectPullRequest(projectSlug, input) {
    addMockProjectPullRequest(projectSlug, input);
  },

  async requestProjectMergeCapabilityChange(projectSlug, input) {
    requestMockProjectMergeCapabilityChange(projectSlug, input);
  },

  async requestProjectRepositoryReplacement(projectSlug, input) {
    requestMockProjectRepositoryReplacement(projectSlug, input);
  },

  async setProjectPlanValueVote(projectSlug, phaseId, planId, valueId, vote) {
    setMockProjectPlanValueVote(projectSlug, phaseId, planId, valueId, vote);
  },

  async setProjectPlanOverallVote(projectSlug, phaseId, planId, vote) {
    setMockProjectPlanOverallVote(projectSlug, phaseId, planId, vote);
  },

  async addProjectActivity(projectSlug, input) {
    addMockProjectActivity(projectSlug, input);
  },

  async setProjectActivityCommitment(projectSlug, activityId, roleLabel) {
    setMockProjectActivityCommitment(projectSlug, activityId, roleLabel);
  },

  async addProjectServiceRequest(projectSlug, input) {
    addMockProjectServiceRequest(projectSlug, input);
  },

  async createProjectManualLinkRequest(projectSlug, targetProjectSlug, relationshipLabel, summary) {
    createMockProjectManualLinkRequest(projectSlug, targetProjectSlug, relationshipLabel, summary);
  },

  async setProjectManualLinkVote(projectSlug, requestId, vote) {
    setMockProjectManualLinkVote(projectSlug, requestId, vote);
  },

  async planProjectServiceRequest(projectSlug, requestId, input) {
    planMockProjectServiceRequest(projectSlug, requestId, input);
  },

  async setProjectServiceRequestStatus(projectSlug, requestId, status) {
    setMockProjectServiceRequestStatus(projectSlug, requestId, status);
  },

  async requestProjectServiceRequestSettingsChange(projectSlug, input) {
    requestMockProjectServiceRequestSettingsChange(projectSlug, input);
  },

  async setProjectServiceRequestSettingsChangeVote(projectSlug, requestId, vote) {
    setMockProjectServiceRequestSettingsChangeVote(projectSlug, requestId, vote);
  },

  async toggleProjectServiceHistoryCompletion(projectSlug, historyId, role, selection) {
    setMockProjectServiceHistoryCompletion(projectSlug, historyId, role, selection);
  },

  async requestProjectPhaseChange(projectSlug, targetPhaseId, reason, options) {
    requestMockProjectPhaseChange(projectSlug, targetPhaseId, reason, options);
  },

  async setProjectPhaseChangeVote(projectSlug, requestId, vote) {
    setMockProjectPhaseChangeVote(projectSlug, requestId, vote);
  },

  async requestProjectUpdate(projectSlug, body) {
    requestMockProjectUpdate(projectSlug, body);
  },

  async setProjectUpdateVote(projectSlug, requestId, vote) {
    setMockProjectUpdateVote(projectSlug, requestId, vote);
  },

  async updateProjectDetails(projectSlug, title, description) {
    updateMockProjectDetails(projectSlug, title, description);
  },

  async requestProjectEdit(projectSlug, title, description) {
    requestMockProjectEdit(projectSlug, title, description);
  },

  async setProjectEditVote(projectSlug, requestId, vote) {
    setMockProjectEditVote(projectSlug, requestId, vote);
  },

  async setProjectPullRequestVote(projectSlug, decisionId, vote) {
    setMockProjectPullRequestVote(projectSlug, decisionId, vote);
  },

  async setProjectMergeCapabilityChangeVote(projectSlug, decisionId, vote) {
    setMockProjectMergeCapabilityChangeVote(projectSlug, decisionId, vote);
  },

  async setProjectRepositoryReplacementVote(projectSlug, decisionId, vote) {
    setMockProjectRepositoryReplacementVote(projectSlug, decisionId, vote);
  },

  async recordProjectPullRequestMerge(projectSlug, requestId, mergeId) {
    recordMockProjectPullRequestMerge(projectSlug, requestId, mergeId);
  },

  async advanceProjectPhase(projectSlug, closeNote) {
    advanceMockProjectPhase(projectSlug, closeNote);
  },

  async revertProjectPhase(projectSlug, targetPhaseId, reason) {
    revertMockProjectPhase(projectSlug, targetPhaseId, reason);
  },

  async toggleScopeMembership(kind, slug) {
    toggleMockScopeMembership(kind, slug);
  },

  async redeemScopeInvite(kind, slug, inviteValue) {
    return redeemMockScopeInvite(kind, slug, inviteValue);
  },

  async setVote(targetId, vote) {
    setMockVote(targetId, vote);
  },

  async addComment(subjectId, body, parentId) {
    addMockComment(subjectId, body, parentId);
  },

  async submitReport(subjectId, targetId, reason, details) {
    submitMockReport(subjectId, targetId, reason, details);
  },

  async setReportVote(targetId, vote) {
    setMockReportVote(targetId, vote);
  },

  async addProjectUpdate(projectSlug, title, body) {
    addMockProjectUpdate(projectSlug, title, body);
  },

  async setEventSignal(eventSlug, signal) {
    setMockEventSignal(eventSlug, signal);
  },

  async addEventValue(eventSlug, label) {
    addMockEventValue(eventSlug, label);
  },

  async setEventValueImportance(eventSlug, valueId, importance) {
    setMockEventValueImportance(eventSlug, valueId, importance);
  },

  async addEventPlan(eventSlug, input) {
    return addMockEventPlan(eventSlug, input);
  },

  async setEventPlanValueVote(eventSlug, planId, valueId, vote) {
    setMockEventPlanValueVote(eventSlug, planId, valueId, vote);
  },

  async setEventPlanOverallVote(eventSlug, planId, vote) {
    setMockEventPlanOverallVote(eventSlug, planId, vote);
  },

  async addEventActivity(eventSlug, input) {
    addMockEventActivity(eventSlug, input);
  },

  async setEventActivityCommitment(eventSlug, activityId, roleLabel) {
    setMockEventActivityCommitment(eventSlug, activityId, roleLabel);
  },

  async requestEventPhaseChange(eventSlug, targetPhaseId, reason) {
    requestMockEventPhaseChange(eventSlug, targetPhaseId, reason);
  },

  async setEventPhaseChangeVote(eventSlug, requestId, vote) {
    setMockEventPhaseChangeVote(eventSlug, requestId, vote);
  },

  async requestEventUpdate(eventSlug, body) {
    requestMockEventUpdate(eventSlug, body);
  },

  async setEventUpdateVote(eventSlug, requestId, vote) {
    setMockEventUpdateVote(eventSlug, requestId, vote);
  },

  async requestEventEdit(eventSlug, title, description) {
    requestMockEventEdit(eventSlug, title, description);
  },

  async setEventEditVote(eventSlug, requestId, vote) {
    setMockEventEditVote(eventSlug, requestId, vote);
  },

  async grantEventEditAccess(eventSlug, userId) {
    grantMockEventEditAccess(eventSlug, userId);
  },

  async revokeEventEditAccess(eventSlug, userId) {
    revokeMockEventEditAccess(eventSlug, userId);
  },

  async shareProjectWithUser(projectSlug, username) {
    return structuredClone(shareMockProjectWithUser(projectSlug, username));
  },

  async shareEventWithUser(eventSlug, username) {
    return structuredClone(shareMockEventWithUser(eventSlug, username));
  },

  async markNotificationRead(notificationId) {
    markMockNotificationRead(notificationId);
  },

  async markAllNotificationsRead() {
    markAllMockNotificationsRead();
  },

  async markConversationRead(conversationId) {
    markMockConversationRead(conversationId);
  },

  async sendMessage(conversationId, body) {
    sendMockMessage(conversationId, body);
  },

  async startDirectMessage(participantUsername, body) {
    return structuredClone(startMockDirectMessage(participantUsername, body));
  },

  async createGroupConversation(input) {
    return structuredClone(createMockGroupConversation(input));
  },

  async renameGroupConversation(conversationId, title) {
    return structuredClone(renameMockGroupConversation(conversationId, title));
  },

  async addGroupConversationMember(conversationId, username) {
    return structuredClone(addMockGroupConversationMember(conversationId, username));
  },

  async removeGroupConversationMember(conversationId, username) {
    return structuredClone(removeMockGroupConversationMember(conversationId, username));
  }
};