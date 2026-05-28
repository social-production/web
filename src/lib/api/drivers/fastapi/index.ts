export { createFastApiClient } from './client';

import type { AppAdapter } from '$lib/services/adapters/types';
import type { BootstrapPayload } from '$lib/types/bootstrap';
import { fetchBootstrap, fetchOnboarding } from './domains/bootstrap';
import { fetchSignIn, fetchSignOut, fetchSignUp } from './domains/auth';
import { fetchSettings, fetchUpdateSettings, fetchProfile } from './domains/users';
import { fetchPublicFeed, fetchPersonalFeed } from './domains/feeds';
import {
  fetchThread,
  fetchPost,
  fetchCreateThread,
  fetchCreatePost,
  fetchSetVote,
  fetchAddComment,
  fetchSubmitReport,
  fetchSetReportVote
} from './domains/content';
import {
  fetchChannel,
  fetchCommunity,
  fetchPlatform,
  fetchToggleScopeMembership,
  fetchRedeemScopeInvite,
  fetchCreateChannel,
  fetchCreateCommunity
} from './domains/scopes';
import { fetchSearch } from './domains/search';
import { fetchNotifications, fetchMarkNotificationRead, fetchMarkAllNotificationsRead } from './domains/notifications';
import {
  fetchMessages,
  fetchSendMessage,
  fetchStartDirectMessage,
  fetchCreateGroupConversation,
  fetchRenameGroupConversation,
  fetchAddGroupConversationMember,
  fetchRemoveGroupConversationMember,
  fetchMarkConversationRead
} from './domains/messages';
import {
  fetchProject, fetchCreateProject, fetchToggleProjectMembership,
  fetchToggleProjectDemandSignal, fetchSetProjectSignal,
  fetchAddProjectValue, fetchSetProjectValueImportance,
  fetchAddProjectProductionPlan, fetchUpdateProjectProductionPlan, fetchAddProjectDistributionPlan,
  fetchSetProjectPlanOverallVote, fetchSetProjectPlanValueVote,
  fetchAddProjectActivity, fetchSetProjectActivityCommitment,
  fetchAddProjectPullRequest, fetchSetProjectPullRequestVote, fetchRecordProjectPullRequestMerge,
  fetchRequestProjectMergeCapabilityChange, fetchSetProjectMergeCapabilityChangeVote,
  fetchRequestProjectRepositoryReplacement, fetchSetProjectRepositoryReplacementVote,
  fetchAddProjectServiceRequest, fetchSetProjectServiceRequestStatus,
  fetchPlanProjectServiceRequest, fetchRequestProjectServiceRequestSettingsChange,
  fetchSetProjectServiceRequestSettingsChangeVote, fetchToggleProjectServiceHistoryCompletion,
  fetchRequestProjectPhaseChange, fetchSetProjectPhaseChangeVote,
  fetchAdvanceProjectPhase, fetchRevertProjectPhase,
  fetchRequestProjectUpdate, fetchSetProjectUpdateVote,
  fetchUpdateProjectDetails, fetchRequestProjectEdit, fetchSetProjectEditVote,
  fetchAddProjectUpdate,
  fetchCreateProjectManualLinkRequest, fetchSetProjectManualLinkVote,
  fetchShareProjectWithUser,
} from './domains/projects';
import {
  fetchEvent, fetchCreateEvent, fetchToggleEventGoing,
  fetchSetEventSignal, fetchAddEventValue, fetchSetEventValueImportance,
  fetchAddEventPlan, fetchSetEventPlanOverallVote, fetchSetEventPlanValueVote,
  fetchAddEventActivity, fetchSetEventActivityCommitment,
  fetchRequestEventPhaseChange, fetchSetEventPhaseChangeVote,
  fetchRequestEventUpdate, fetchSetEventUpdateVote,
  fetchRequestEventEdit, fetchSetEventEditVote,
  fetchGrantEventEditAccess, fetchRevokeEventEditAccess,
  fetchShareEventWithUser,
} from './domains/events';

const bootstrapFallback: BootstrapPayload = {
  viewer: null,
  featureFlags: {
    assets: false,
    funding: false,
    platform: true
  },
  unreadCounts: {
    notifications: 0,
    messages: 0
  },
  directory: {
    platform: null,
    channels: [],
    communities: []
  },
  suggestedContacts: [],
  activityRail: []
};

export function createFastApiDriver(): AppAdapter {
  return {
    async getBootstrap() {
      try {
        return await fetchBootstrap();
      } catch (error) {
        const status = (error as { status?: number }).status;
        if (status === 401 || status === 404) {
          return bootstrapFallback;
        }
        throw error;
      }
    },

    async getOnboarding() {
      return fetchOnboarding();
    },

    async getThread(slug) {
      return fetchThread(slug);
    },

    async getPost(id) {
      return fetchPost(id);
    },

    async createThread(input) {
      return fetchCreateThread(input);
    },

    async createPost(input) {
      return fetchCreatePost(input);
    },

    async setVote(targetId, vote) {
      return fetchSetVote(targetId, vote);
    },

    async addComment(subjectId, body, parentId) {
      return fetchAddComment(subjectId, body, parentId);
    },

    async submitReport(subjectId, targetId, reason, details) {
      return fetchSubmitReport(subjectId, targetId, reason, details);
    },

    async setReportVote(targetId, vote) {
      return fetchSetReportVote(targetId, vote);
    },

    async getChannel(slug) {
      return fetchChannel(slug);
    },

    async getCommunity(slug) {
      return fetchCommunity(slug);
    },

    async getPlatform() {
      return fetchPlatform();
    },

    async getPlatformAssets() {
      return null;
    },

    async toggleScopeMembership(kind, slug) {
      return fetchToggleScopeMembership(kind, slug);
    },

    async redeemScopeInvite(kind, slug, inviteValue) {
      return fetchRedeemScopeInvite(kind, slug, inviteValue);
    },

    async createChannel(input) {
      return fetchCreateChannel(input);
    },

    async createCommunity(input) {
      return fetchCreateCommunity(input);
    },

    async getEvent(slug) { return fetchEvent(slug); },
    async createEvent(input) { return fetchCreateEvent(input); },
    async toggleEventGoing(eventId) { return fetchToggleEventGoing(eventId); },
    async setEventSignal(slug, signal) { return fetchSetEventSignal(slug, signal); },
    async addEventValue(slug, label) { return fetchAddEventValue(slug, label); },
    async setEventValueImportance(slug, valueId, importance) { return fetchSetEventValueImportance(slug, valueId, importance); },
    async addEventPlan(slug, input) { return fetchAddEventPlan(slug, input); },
    async setEventPlanOverallVote(slug, planId, vote) { return fetchSetEventPlanOverallVote(slug, planId, vote); },
    async setEventPlanValueVote(slug, planId, valueId, vote) { return fetchSetEventPlanValueVote(slug, planId, valueId, vote); },
    async addEventActivity(slug, input) { return fetchAddEventActivity(slug, input); },
    async setEventActivityCommitment(slug, activityId, roleLabel) { return fetchSetEventActivityCommitment(slug, activityId, roleLabel); },
    async requestEventPhaseChange(slug, targetPhaseId, reason) { return fetchRequestEventPhaseChange(slug, targetPhaseId, reason); },
    async setEventPhaseChangeVote(slug, requestId, vote) { return fetchSetEventPhaseChangeVote(slug, requestId, vote); },
    async requestEventUpdate(slug, body) { return fetchRequestEventUpdate(slug, body); },
    async setEventUpdateVote(slug, requestId, vote) { return fetchSetEventUpdateVote(slug, requestId, vote); },
    async requestEventEdit(slug, title, description) { return fetchRequestEventEdit(slug, title, description); },
    async setEventEditVote(slug, requestId, vote) { return fetchSetEventEditVote(slug, requestId, vote); },
    async grantEventEditAccess(slug, userId) { return fetchGrantEventEditAccess(slug, userId); },
    async revokeEventEditAccess(slug, userId) { return fetchRevokeEventEditAccess(slug, userId); },
    async shareEventWithUser(slug, username) { return fetchShareEventWithUser(slug, username); },

    async getProject(slug) { return fetchProject(slug); },
    async createProject(input) { return fetchCreateProject(input); },
    async toggleProjectMembership(slug) { return fetchToggleProjectMembership(slug); },
    async toggleProjectDemandSignal(slug) { return fetchToggleProjectDemandSignal(slug); },
    async setProjectSignal(slug, signal) { return fetchSetProjectSignal(slug, signal); },
    async addProjectValue(slug, label) { return fetchAddProjectValue(slug, label); },
    async setProjectValueImportance(slug, valueId, importance) { return fetchSetProjectValueImportance(slug, valueId, importance); },
    async addProjectProductionPlan(slug, input) { return fetchAddProjectProductionPlan(slug, input); },
    async updateProjectProductionPlan(slug, planId, input) { return fetchUpdateProjectProductionPlan(slug, planId, input); },
    async addProjectDistributionPlan(slug, input) { return fetchAddProjectDistributionPlan(slug, input); },
    async setProjectPlanOverallVote(slug, phaseId, planId, vote) { return fetchSetProjectPlanOverallVote(slug, phaseId, planId, vote); },
    async setProjectPlanValueVote(slug, phaseId, planId, valueId, vote) { return fetchSetProjectPlanValueVote(slug, phaseId, planId, valueId, vote); },
    async addProjectActivity(slug, input) { return fetchAddProjectActivity(slug, input); },
    async setProjectActivityCommitment(slug, activityId, roleLabel) { return fetchSetProjectActivityCommitment(slug, activityId, roleLabel); },
    async addProjectPullRequest(slug, input) { return fetchAddProjectPullRequest(slug, input); },
    async setProjectPullRequestVote(slug, decisionId, vote) { return fetchSetProjectPullRequestVote(slug, decisionId, vote); },
    async recordProjectPullRequestMerge(slug, requestId, mergeId) { return fetchRecordProjectPullRequestMerge(slug, requestId, mergeId); },
    async requestProjectMergeCapabilityChange(slug, input) { return fetchRequestProjectMergeCapabilityChange(slug, input); },
    async setProjectMergeCapabilityChangeVote(slug, decisionId, vote) { return fetchSetProjectMergeCapabilityChangeVote(slug, decisionId, vote); },
    async requestProjectRepositoryReplacement(slug, input) { return fetchRequestProjectRepositoryReplacement(slug, input); },
    async setProjectRepositoryReplacementVote(slug, decisionId, vote) { return fetchSetProjectRepositoryReplacementVote(slug, decisionId, vote); },
    async addProjectServiceRequest(slug, input) { return fetchAddProjectServiceRequest(slug, input); },
    async setProjectServiceRequestStatus(slug, requestId, status) { return fetchSetProjectServiceRequestStatus(slug, requestId, status); },
    async planProjectServiceRequest(slug, requestId, input) { return fetchPlanProjectServiceRequest(slug, requestId, input); },
    async requestProjectServiceRequestSettingsChange(slug, input) { return fetchRequestProjectServiceRequestSettingsChange(slug, input); },
    async setProjectServiceRequestSettingsChangeVote(slug, requestId, vote) { return fetchSetProjectServiceRequestSettingsChangeVote(slug, requestId, vote); },
    async toggleProjectServiceHistoryCompletion(slug, historyId, role, selection) { return fetchToggleProjectServiceHistoryCompletion(slug, historyId, role, selection); },
    async requestProjectPhaseChange(slug, targetPhaseId, reason, options) { return fetchRequestProjectPhaseChange(slug, targetPhaseId, reason, options); },
    async setProjectPhaseChangeVote(slug, requestId, vote) { return fetchSetProjectPhaseChangeVote(slug, requestId, vote); },
    async advanceProjectPhase(slug, closeNote) { return fetchAdvanceProjectPhase(slug, closeNote); },
    async revertProjectPhase(slug, targetPhaseId, reason) { return fetchRevertProjectPhase(slug, targetPhaseId, reason); },
    async requestProjectUpdate(slug, body) { return fetchRequestProjectUpdate(slug, body); },
    async setProjectUpdateVote(slug, requestId, vote) { return fetchSetProjectUpdateVote(slug, requestId, vote); },
    async updateProjectDetails(slug, title, description) { return fetchUpdateProjectDetails(slug, title, description); },
    async requestProjectEdit(slug, title, description) { return fetchRequestProjectEdit(slug, title, description); },
    async setProjectEditVote(slug, requestId, vote) { return fetchSetProjectEditVote(slug, requestId, vote); },
    async addProjectUpdate(slug, title, body) { return fetchAddProjectUpdate(slug, title, body); },
    async createProjectManualLinkRequest(slug, targetSlug, label, summary) { return fetchCreateProjectManualLinkRequest(slug, targetSlug, label, summary); },
    async setProjectManualLinkVote(slug, requestId, vote) { return fetchSetProjectManualLinkVote(slug, requestId, vote); },
    async shareProjectWithUser(slug, username) { return fetchShareProjectWithUser(slug, username); },

    async getSearch(query) {
      return fetchSearch(query);
    },

    async getNotifications() {
      return fetchNotifications();
    },

    async markNotificationRead(id) {
      return fetchMarkNotificationRead(id);
    },

    async markAllNotificationsRead() {
      return fetchMarkAllNotificationsRead();
    },

    async getMessages() {
      return fetchMessages();
    },

    async sendMessage(conversationId, body) {
      return fetchSendMessage(conversationId, body);
    },

    async startDirectMessage(username, body) {
      return fetchStartDirectMessage(username, body);
    },

    async createGroupConversation(input) {
      return fetchCreateGroupConversation(input);
    },

    async renameGroupConversation(id, title) {
      return fetchRenameGroupConversation(id, title);
    },

    async addGroupConversationMember(id, username) {
      return fetchAddGroupConversationMember(id, username);
    },

    async removeGroupConversationMember(id, username) {
      return fetchRemoveGroupConversationMember(id, username);
    },

    async markConversationRead(id) {
      return fetchMarkConversationRead(id);
    },

    async getPublicFeed() {
      return fetchPublicFeed();
    },

    async getPersonalFeed() {
      return fetchPersonalFeed();
    },

    async getSettings() {
      return fetchSettings();
    },

    async updateSettings(input) {
      return fetchUpdateSettings(input);
    },

    async getProfile(username) {
      return fetchProfile(username);
    },

    async signIn(input) {
      return fetchSignIn(input);
    },

    async signOut() {
      return fetchSignOut();
    },

    async signUp(input) {
      return fetchSignUp(input);
    },

    hydrateClientState() {
      return Promise.resolve(true);
    }
  } as AppAdapter;
}
