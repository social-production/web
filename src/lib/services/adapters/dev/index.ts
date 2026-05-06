import type { AppAdapter } from '$lib/services/adapters/types';
import {
  addMockProjectActivity,
  setMockProjectActivityCommitment,
  addMockComment,
  addMockProjectDistributionPlan,
  addMockProjectProductionPlan,
  addMockProjectServiceRequest,
  buildSearchFixture,
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
  markAllMockNotificationsRead,
  markMockMessageThreadRead,
  markMockNotificationRead,
  onboardingFixture,
  redeemMockScopeInvite,
  sendMockMessage,
  startMockMessageThread,
  addMockProjectUpdate,
  addMockEventUpdate,
  inviteMockEventManager,
  setMockVote,
  setMockProjectPlanOverallVote,
  setMockProjectPlanValueVote,
  setMockProjectValueImportance,
  setMockProjectServiceRequestStatus,
  toggleMockEventGoing,
  toggleMockEventManagerNomination,
  advanceMockProjectPhase,
  revertMockProjectPhase,
  toggleMockProjectManagerNomination,
  toggleMockProjectMembership,
  toggleMockScopeMembership,
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

  async getOnboarding() {
    return structuredClone(onboardingFixture);
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

  async addProjectServiceRequest(projectSlug, title, body) {
    addMockProjectServiceRequest(projectSlug, title, body);
  },

  async setProjectServiceRequestStatus(projectSlug, requestId, status) {
    setMockProjectServiceRequestStatus(projectSlug, requestId, status);
  },

  async advanceProjectPhase(projectSlug) {
    advanceMockProjectPhase(projectSlug);
  },

  async revertProjectPhase(projectSlug, targetPhaseId, reason) {
    revertMockProjectPhase(projectSlug, targetPhaseId, reason);
  },

  async toggleProjectManagerNomination(projectSlug) {
    toggleMockProjectManagerNomination(projectSlug);
  },

  async toggleEventManagerNomination(eventSlug) {
    toggleMockEventManagerNomination(eventSlug);
  },

  async inviteEventManager(eventSlug, userId) {
    inviteMockEventManager(eventSlug, userId);
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

  async addProjectUpdate(projectSlug, title, body) {
    addMockProjectUpdate(projectSlug, title, body);
  },

  async addEventUpdate(eventSlug, title, body) {
    addMockEventUpdate(eventSlug, title, body);
  },

  async markNotificationRead(notificationId) {
    markMockNotificationRead(notificationId);
  },

  async markAllNotificationsRead() {
    markAllMockNotificationsRead();
  },

  async markMessageThreadRead(threadId) {
    markMockMessageThreadRead(threadId);
  },

  async sendMessage(threadId, body) {
    sendMockMessage(threadId, body);
  },

  async startMessageThread(participantUsername, body) {
    return startMockMessageThread(participantUsername, body);
  }
};