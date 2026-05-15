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
  addMockProjectProductionPlan,
  addMockProjectServiceRequest,
  planMockProjectServiceRequest,
  requestMockProjectServiceRequestSettingsChange,
  buildSearchFixture,
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
  grantMockEventEditAccess,
  setMockReportVote,
  setMockVote,
  submitMockReport,
  setMockEventEditVote,
  setMockEventUpdateVote,
  setMockProjectPlanOverallVote,
  setMockProjectPlanValueVote,
  setMockProjectEditVote,
  setMockProjectPhaseChangeVote,
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
  revertMockProjectPhase,
  toggleMockProjectManagerNomination,
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

  async addProjectValue(projectSlug, label) {
    addMockProjectValue(projectSlug, label);
  },

  async setProjectValueImportance(projectSlug, valueId, importance) {
    setMockProjectValueImportance(projectSlug, valueId, importance);
  },

  async addProjectProductionPlan(projectSlug, input) {
    addMockProjectProductionPlan(projectSlug, input);
  },

  async addProjectDistributionPlan(projectSlug, input) {
    addMockProjectDistributionPlan(projectSlug, input);
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

  async requestProjectPhaseChange(projectSlug, targetPhaseId, reason) {
    requestMockProjectPhaseChange(projectSlug, targetPhaseId, reason);
  },

  async setProjectPhaseChangeVote(projectSlug, requestId, vote) {
    setMockProjectPhaseChangeVote(projectSlug, requestId, vote);
  },

  async requestProjectUpdate(projectSlug, title, body) {
    requestMockProjectUpdate(projectSlug, title, body);
  },

  async setProjectUpdateVote(projectSlug, requestId, vote) {
    setMockProjectUpdateVote(projectSlug, requestId, vote);
  },

  async updateProjectDetails(projectSlug, title, summary, overview) {
    updateMockProjectDetails(projectSlug, title, summary, overview);
  },

  async requestProjectEdit(projectSlug, title, summary, overview) {
    requestMockProjectEdit(projectSlug, title, summary, overview);
  },

  async setProjectEditVote(projectSlug, requestId, vote) {
    setMockProjectEditVote(projectSlug, requestId, vote);
  },

  async advanceProjectPhase(projectSlug, closeNote) {
    advanceMockProjectPhase(projectSlug, closeNote);
  },

  async revertProjectPhase(projectSlug, targetPhaseId, reason) {
    revertMockProjectPhase(projectSlug, targetPhaseId, reason);
  },

  async toggleProjectManagerNomination(projectSlug) {
    toggleMockProjectManagerNomination(projectSlug);
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

  async requestEventUpdate(eventSlug, title, body) {
    requestMockEventUpdate(eventSlug, title, body);
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