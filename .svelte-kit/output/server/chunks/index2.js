import { s as sendMockMessage, m as markMockMessageThreadRead, a as markAllMockNotificationsRead, b as markMockNotificationRead, c as addMockEventUpdate, d as addMockProjectUpdate, e as addMockComment, f as setMockVote, r as redeemMockScopeInvite, t as toggleMockScopeMembership, g as inviteMockEventManager, h as toggleMockEventManagerNomination, j as toggleMockProjectManagerNomination, k as revertMockProjectPhase, l as advanceMockProjectPhase, n as setMockProjectServiceRequestStatus, o as addMockProjectServiceRequest, q as addMockProjectActivity, u as setMockProjectPlanOverallVote, v as setMockProjectPlanValueVote, w as addMockProjectDistributionPlan, x as addMockProjectProductionPlan, y as setMockProjectValueImportance, z as addMockProjectValue, A as toggleMockProjectDemandSignal, B as toggleMockProjectMembership, C as toggleMockEventGoing, D as findEventFixture, E as findPostFixture, F as findThreadFixture, G as findProjectFixture, H as buildSearchFixture, I as findMessagesFixture, J as findNotificationsFixture, K as findProfileFixture, L as updateMockSettings, M as getSettingsFixture, N as onboardingFixture, O as getStewardshipScopeFixture, P as findCommunityScopeFixture, Q as findChannelScopeFixture, R as getPersonalFeedFixture, S as getPublicFeedFixture, T as hydrateMockClientState, U as getBootstrapFixture } from "./data.js";
const devAdapter = {
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
  async getStewardship() {
    return structuredClone(getStewardshipScopeFixture());
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
  }
};
const currentAdapter = devAdapter;
export {
  currentAdapter as c
};
