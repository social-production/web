/**
 * Supabase driver package.
 *
 * Talks to web-supabase via Auth REST + Edge Function gateway.
 * Maps payloads into $lib/types/* and preserves AppAdapter shapes.
 */

import type { AppAdapter } from '$lib/services/adapters/types';
import type { BootstrapPayload } from '$lib/types/bootstrap';
import { clearBootstrapCache } from '$lib/services/bootstrapCache';
import { clearAuthenticatedSession } from './authSession';
import { fetchSignIn, fetchSignOut, fetchSignUp } from './domains/auth';
import { fetchBootstrap, fetchBootstrapSummary, fetchOnboarding } from './domains/bootstrap';
import {
  fetchAddComment,
  fetchComments,
  fetchCreatePost,
  fetchCreateThread,
  fetchPost,
  fetchSetReportVote,
  fetchSetVote,
  fetchSubmitReport,
  fetchThread
} from './domains/content';
import {
  fetchAddEventActivity,
  fetchAddEventPlan,
  fetchAddEventValue,
  fetchCreateEvent,
  fetchCreateEventManualLinkRequest,
  fetchCreateEventManualLinkSeverRequest,
  fetchDeleteEventActivityRating,
  fetchEvent,
  fetchGrantEventEditAccess,
  fetchRequestEventEdit,
  fetchRequestEventPhaseChange,
  fetchRequestEventUpdate,
  fetchRevokeEventEditAccess,
  fetchSetEventActivityCommitment,
  fetchSetEventActivityRating,
  fetchSetEventEditVote,
  fetchSetEventManualLinkVote,
  fetchSetEventPhaseChangeVote,
  fetchSetEventPlanCriterionRating,
  fetchSetEventPlanOverallVote,
  fetchSetEventPlanValueVote,
  fetchSetEventSignal,
  fetchSetEventUpdateVote,
  fetchSetEventValueImportance,
  fetchShareEventWithUser,
  fetchToggleEventHistoryCompletion,
  fetchToggleEventMembership
} from './domains/events';
import {
  fetchHomeFeed,
  fetchHomeFeedPage,
  fetchMapMarkers,
  fetchPersonalFeed,
  fetchPersonalFeedPage,
  fetchPublicFeed,
  fetchPublicFeedPage,
  fetchRegionFeed,
  fetchRegionFeedPage,
  fetchScopeFeedPage,
  fetchUserFeedPage
} from './domains/feeds';
import {
  fetchCommitHelpRequestRole,
  fetchCreateHelpRequest,
  fetchHelpRequest,
  fetchUncommitHelpRequestRole
} from './domains/helpRequests';
import {
  fetchCreateLocation,
  fetchIpLocationHint,
  fetchLocation,
  fetchLocationReverse,
  fetchLocationSearch
} from './domains/locations';
import {
  fetchAddGroupConversationMember,
  fetchConversationMessages,
  fetchCreateGroupConversation,
  fetchMarkConversationRead,
  fetchMarkLinkedChatRead,
  fetchMessageContacts,
  fetchMessages,
  fetchRemoveGroupConversationMember,
  fetchRenameGroupConversation,
  fetchSendMessage,
  fetchStartDirectMessage
} from './domains/messages';
import {
  fetchMarkAllNotificationsRead,
  fetchMarkNotificationRead,
  fetchNotifications
} from './domains/notifications';
import {
  fetchAddProjectActivity,
  fetchAddProjectDistributionPlan,
  fetchAddProjectProductionPlan,
  fetchAddProjectPullRequest,
  fetchAddProjectServiceRequest,
  fetchAddProjectUpdate,
  fetchAddProjectValue,
  fetchAdvanceProjectPhase,
  fetchCreateProject,
  fetchCreateProjectManualLinkRequest,
  fetchCreateProjectManualLinkSeverRequest,
  fetchDeleteProjectActivityRating,
  fetchPlanProjectServiceRequest,
  fetchProject,
  fetchRecordProjectPullRequestMerge,
  fetchRequestProjectEdit,
  fetchRequestProjectMergeCapabilityChange,
  fetchRequestProjectPhaseChange,
  fetchRequestProjectRepositoryReplacement,
  fetchRequestProjectServiceRequestSettingsChange,
  fetchRequestProjectUpdate,
  fetchRevertProjectPhase,
  fetchSetProjectActivityCommitment,
  fetchSetProjectActivityRating,
  fetchSetProjectEditVote,
  fetchSetProjectManualLinkVote,
  fetchSetProjectMergeCapabilityChangeVote,
  fetchSetProjectPhaseChangeVote,
  fetchSetProjectPlanCriterionRating,
  fetchSetProjectPlanOverallVote,
  fetchSetProjectPlanValueVote,
  fetchSetProjectPullRequestVote,
  fetchSetProjectRepositoryReplacementVote,
  fetchSetProjectServiceRequestSettingsChangeVote,
  fetchSetProjectServiceRequestStatus,
  fetchSetProjectSignal,
  fetchSetProjectUpdateVote,
  fetchSetProjectValueImportance,
  fetchShareProjectWithUser,
  fetchToggleProjectDemandSignal,
  fetchToggleProjectMembership,
  fetchToggleProjectServiceHistoryCompletion,
  fetchUpdateProjectDetails,
  fetchUpdateProjectProductionPlan
} from './domains/projects';
import { fetchSearch } from './domains/search';
import {
  fetchCastModeratorVote,
  fetchChannel,
  fetchCommunity,
  fetchCreateChannel,
  fetchCreateCommunity,
  fetchCreateScopeInvite,
  fetchInviteUserToCommunity,
  fetchPlatform,
  fetchRedeemScopeInvite,
  fetchRemoveVolunteer,
  fetchTaggableScopes,
  fetchToggleScopeMembership,
  fetchVolunteerForBoard
} from './domains/scopes';
import {
  fetchAcceptFollowRequest,
  fetchFollowRequests,
  fetchFollowUser,
  fetchProfile,
  fetchRejectFollowRequest,
  fetchSettings,
  fetchUnfollowUser,
  fetchUpdateSettings
} from './domains/users';

export { createSupabaseClient } from './client';
export { createSupabaseSessionTransport } from './sessionTransport';
export { createSupabaseErrorTransport } from './errorTransport';

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
  activityRail: [],
  activityRailHistory: []
};

export function createSupabaseDriver(): AppAdapter {
  return {
    async getBootstrap() {
      try {
        return await fetchBootstrap();
      } catch (error) {
        const status = (error as { status?: number }).status;
        if (status === 401) {
          clearAuthenticatedSession();
          clearBootstrapCache();
        }
        if (status === 401 || status === 404) {
          return bootstrapFallback;
        }
        throw error;
      }
    },
    async getBootstrapSummary() {
      try {
        return await fetchBootstrapSummary();
      } catch (error) {
        const status = (error as { status?: number }).status;
        if (status === 401) {
          clearAuthenticatedSession();
          clearBootstrapCache();
        }
        if (status === 401 || status === 404) {
          return { unreadCounts: bootstrapFallback.unreadCounts };
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
    async getHelpRequest(id) {
      return fetchHelpRequest(id);
    },
    async commitHelpRequestRole(helpRequestId, roleId) {
      return fetchCommitHelpRequestRole(helpRequestId, roleId);
    },
    async uncommitHelpRequestRole(helpRequestId, roleId) {
      return fetchUncommitHelpRequestRole(helpRequestId, roleId);
    },
    async createThread(input) {
      return fetchCreateThread(input);
    },
    async createPost(input) {
      return fetchCreatePost(input);
    },
    async createHelpRequest(input) {
      return fetchCreateHelpRequest(input);
    },
    async setVote(target, vote) {
      return fetchSetVote(target, vote);
    },
    async getComments(subjectType, subjectId) {
      return fetchComments(subjectType, subjectId);
    },
    async addComment(subject, body, parentId) {
      return fetchAddComment(subject, body, parentId);
    },
    async submitReport(subjectId, target, reason, details) {
      return fetchSubmitReport(subjectId, target, reason, details);
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
    async toggleScopeMembership(kind, slug, viewerIsMember) {
      return fetchToggleScopeMembership(kind, slug, viewerIsMember);
    },
    async redeemScopeInvite(kind, slug, inviteValue) {
      return fetchRedeemScopeInvite(kind, slug, inviteValue);
    },
    async createScopeInvite(kind, slug) {
      return fetchCreateScopeInvite(kind, slug);
    },
    async inviteUserToCommunity(slug, username) {
      return fetchInviteUserToCommunity(slug, username);
    },
    async volunteerForBoard() {
      return fetchVolunteerForBoard();
    },
    async removeVolunteer() {
      return fetchRemoveVolunteer();
    },
    async castModeratorVote(targetUserId, vote) {
      return fetchCastModeratorVote(targetUserId, vote);
    },
    async createChannel(input) {
      return fetchCreateChannel(input);
    },
    async createCommunity(input) {
      return fetchCreateCommunity(input);
    },
    async getTaggableScopes(query, kind, limit) {
      return fetchTaggableScopes(query, kind, limit);
    },

    async getEvent(slug) {
      return fetchEvent(slug);
    },
    async createEvent(input) {
      return fetchCreateEvent(input);
    },
    async toggleEventMembership(eventSlug) {
      return fetchToggleEventMembership(eventSlug);
    },
    async setEventSignal(slug, signal) {
      return fetchSetEventSignal(slug, signal);
    },
    async addEventValue(slug, label) {
      return fetchAddEventValue(slug, label);
    },
    async setEventValueImportance(slug, valueId, importance) {
      return fetchSetEventValueImportance(slug, valueId, importance);
    },
    async addEventPlan(slug, input) {
      return fetchAddEventPlan(slug, input);
    },
    async setEventPlanOverallVote(slug, planId, vote) {
      return fetchSetEventPlanOverallVote(slug, planId, vote);
    },
    async setEventPlanValueVote(slug, planId, valueId, vote) {
      return fetchSetEventPlanValueVote(slug, planId, valueId, vote);
    },
    async setEventPlanCriterionRating(slug, planId, criterionId, rating) {
      return fetchSetEventPlanCriterionRating(slug, planId, criterionId, rating);
    },
    async addEventActivity(slug, input) {
      return fetchAddEventActivity(slug, input);
    },
    async setEventActivityCommitment(slug, activityId, roleLabel) {
      return fetchSetEventActivityCommitment(slug, activityId, roleLabel);
    },
    async setEventActivityRating(slug, activityId, rating, comment) {
      return fetchSetEventActivityRating(slug, activityId, rating, comment);
    },
    async deleteEventActivityRating(slug, activityId) {
      return fetchDeleteEventActivityRating(slug, activityId);
    },
    async toggleEventHistoryCompletion(slug, historyId, role, selection) {
      return fetchToggleEventHistoryCompletion(slug, historyId, role, selection);
    },
    async requestEventPhaseChange(slug, targetPhaseId, reason) {
      return fetchRequestEventPhaseChange(slug, targetPhaseId, reason);
    },
    async setEventPhaseChangeVote(slug, requestId, vote) {
      return fetchSetEventPhaseChangeVote(slug, requestId, vote);
    },
    async requestEventUpdate(slug, body) {
      return fetchRequestEventUpdate(slug, body);
    },
    async setEventUpdateVote(slug, requestId, vote) {
      return fetchSetEventUpdateVote(slug, requestId, vote);
    },
    async requestEventEdit(slug, title, description) {
      return fetchRequestEventEdit(slug, title, description);
    },
    async setEventEditVote(slug, requestId, vote) {
      return fetchSetEventEditVote(slug, requestId, vote);
    },
    async createEventManualLinkRequest(slug, targetKind, targetSlug, summary, label) {
      return fetchCreateEventManualLinkRequest(slug, targetKind, targetSlug, summary, label);
    },
    async setEventManualLinkVote(slug, requestId, vote) {
      return fetchSetEventManualLinkVote(slug, requestId, vote);
    },
    async createEventManualLinkSeverRequest(slug, linkId, summary) {
      return fetchCreateEventManualLinkSeverRequest(slug, linkId, summary);
    },
    async grantEventEditAccess(slug, userId) {
      return fetchGrantEventEditAccess(slug, userId);
    },
    async revokeEventEditAccess(slug, userId) {
      return fetchRevokeEventEditAccess(slug, userId);
    },
    async shareEventWithUser(slug, username) {
      return fetchShareEventWithUser(slug, username);
    },

    async getProject(slug) {
      return fetchProject(slug);
    },
    async createProject(input) {
      return fetchCreateProject(input);
    },
    async toggleProjectMembership(slug) {
      return fetchToggleProjectMembership(slug);
    },
    async toggleProjectDemandSignal(slug) {
      return fetchToggleProjectDemandSignal(slug);
    },
    async setProjectSignal(slug, signal) {
      return fetchSetProjectSignal(slug, signal);
    },
    async addProjectValue(slug, label) {
      return fetchAddProjectValue(slug, label);
    },
    async setProjectValueImportance(slug, valueId, importance) {
      return fetchSetProjectValueImportance(slug, valueId, importance);
    },
    async addProjectProductionPlan(slug, input, projectMode) {
      return fetchAddProjectProductionPlan(slug, input, projectMode);
    },
    async updateProjectProductionPlan(slug, planId, input) {
      return fetchUpdateProjectProductionPlan(slug, planId, input);
    },
    async addProjectDistributionPlan(slug, input, projectMode) {
      return fetchAddProjectDistributionPlan(slug, input, projectMode);
    },
    async setProjectPlanOverallVote(slug, phaseId, planId, vote) {
      return fetchSetProjectPlanOverallVote(slug, phaseId, planId, vote);
    },
    async setProjectPlanValueVote(slug, phaseId, planId, valueId, vote) {
      return fetchSetProjectPlanValueVote(slug, phaseId, planId, valueId, vote);
    },
    async setProjectPlanCriterionRating(slug, planId, criterionId, rating) {
      return fetchSetProjectPlanCriterionRating(slug, planId, criterionId, rating);
    },
    async addProjectActivity(slug, input) {
      return fetchAddProjectActivity(slug, input);
    },
    async setProjectActivityCommitment(slug, activityId, roleLabel) {
      return fetchSetProjectActivityCommitment(slug, activityId, roleLabel);
    },
    async setProjectActivityRating(slug, activityId, rating, comment) {
      return fetchSetProjectActivityRating(slug, activityId, rating, comment);
    },
    async deleteProjectActivityRating(slug, activityId) {
      return fetchDeleteProjectActivityRating(slug, activityId);
    },
    async addProjectPullRequest(slug, input) {
      return fetchAddProjectPullRequest(slug, input);
    },
    async setProjectPullRequestVote(slug, decisionId, vote) {
      return fetchSetProjectPullRequestVote(slug, decisionId, vote);
    },
    async recordProjectPullRequestMerge(slug, requestId, mergeId, mergeUrl) {
      return fetchRecordProjectPullRequestMerge(slug, requestId, mergeId, mergeUrl);
    },
    async requestProjectMergeCapabilityChange(slug, input) {
      return fetchRequestProjectMergeCapabilityChange(slug, input);
    },
    async setProjectMergeCapabilityChangeVote(slug, decisionId, vote) {
      return fetchSetProjectMergeCapabilityChangeVote(slug, decisionId, vote);
    },
    async requestProjectRepositoryReplacement(slug, input) {
      return fetchRequestProjectRepositoryReplacement(slug, input);
    },
    async setProjectRepositoryReplacementVote(slug, decisionId, vote) {
      return fetchSetProjectRepositoryReplacementVote(slug, decisionId, vote);
    },
    async addProjectServiceRequest(slug, input) {
      return fetchAddProjectServiceRequest(slug, input);
    },
    async setProjectServiceRequestStatus(slug, requestId, status) {
      return fetchSetProjectServiceRequestStatus(slug, requestId, status);
    },
    async planProjectServiceRequest(slug, requestId, input) {
      return fetchPlanProjectServiceRequest(slug, requestId, input);
    },
    async requestProjectServiceRequestSettingsChange(slug, input) {
      return fetchRequestProjectServiceRequestSettingsChange(slug, input);
    },
    async setProjectServiceRequestSettingsChangeVote(slug, requestId, vote) {
      return fetchSetProjectServiceRequestSettingsChangeVote(slug, requestId, vote);
    },
    async toggleProjectServiceHistoryCompletion(slug, historyId, role, selection) {
      return fetchToggleProjectServiceHistoryCompletion(slug, historyId, role, selection);
    },
    async requestProjectPhaseChange(slug, targetPhaseId, reason, options) {
      return fetchRequestProjectPhaseChange(slug, targetPhaseId, reason, options);
    },
    async setProjectPhaseChangeVote(slug, requestId, vote) {
      return fetchSetProjectPhaseChangeVote(slug, requestId, vote);
    },
    async advanceProjectPhase(slug, closeNote) {
      return fetchAdvanceProjectPhase(slug, closeNote);
    },
    async revertProjectPhase(slug, targetPhaseId, reason) {
      return fetchRevertProjectPhase(slug, targetPhaseId, reason);
    },
    async requestProjectUpdate(slug, body) {
      return fetchRequestProjectUpdate(slug, body);
    },
    async setProjectUpdateVote(slug, requestId, vote) {
      return fetchSetProjectUpdateVote(slug, requestId, vote);
    },
    async updateProjectDetails(slug, title, description) {
      return fetchUpdateProjectDetails(slug, title, description);
    },
    async requestProjectEdit(slug, title, description) {
      return fetchRequestProjectEdit(slug, title, description);
    },
    async setProjectEditVote(slug, requestId, vote) {
      return fetchSetProjectEditVote(slug, requestId, vote);
    },
    async addProjectUpdate(slug, title, body) {
      return fetchAddProjectUpdate(slug, title, body);
    },
    async createProjectManualLinkRequest(slug, targetKind, targetSlug, summary, label) {
      return fetchCreateProjectManualLinkRequest(slug, targetKind, targetSlug, summary, label);
    },
    async setProjectManualLinkVote(slug, requestId, vote) {
      return fetchSetProjectManualLinkVote(slug, requestId, vote);
    },
    async createProjectManualLinkSeverRequest(slug, linkId, summary) {
      return fetchCreateProjectManualLinkSeverRequest(slug, linkId, summary);
    },
    async shareProjectWithUser(slug, username) {
      return fetchShareProjectWithUser(slug, username);
    },

    async getSearch(query, options) {
      return fetchSearch(query, options);
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
    async getConversationMessages(conversationId, viewerId, participants) {
      return fetchConversationMessages(conversationId, viewerId, participants);
    },
    async getMessageContacts(query, limit) {
      return fetchMessageContacts(query, limit);
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
    async markLinkedChatRead(subjectType, subjectId) {
      return fetchMarkLinkedChatRead(subjectType, subjectId);
    },

    async getPublicFeed(options) {
      return fetchPublicFeed(options);
    },
    async getPublicFeedPage(options) {
      return fetchPublicFeedPage(options);
    },
    async getHomeFeed(options) {
      return fetchHomeFeed(options);
    },
    async getHomeFeedPage(options) {
      return fetchHomeFeedPage(options);
    },
    async getRegionFeed(options) {
      return fetchRegionFeed(options);
    },
    async getRegionFeedPage(options) {
      return fetchRegionFeedPage(options);
    },
    async getMapMarkers(options) {
      return fetchMapMarkers(options);
    },
    async getPersonalFeed(options) {
      return fetchPersonalFeed(options);
    },
    async getPersonalFeedPage(options) {
      return fetchPersonalFeedPage(options);
    },
    async getScopeFeedPage(options) {
      return fetchScopeFeedPage(options);
    },
    async getUserFeedPage(options) {
      return fetchUserFeedPage(options);
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
    async followUser(username) {
      return fetchFollowUser(username);
    },
    async unfollowUser(username) {
      return fetchUnfollowUser(username);
    },
    async acceptFollowRequest(username) {
      return fetchAcceptFollowRequest(username);
    },
    async rejectFollowRequest(username) {
      return fetchRejectFollowRequest(username);
    },
    async getFollowRequests() {
      return fetchFollowRequests();
    },
    async searchLocations(query, limit = 5, options = {}) {
      return fetchLocationSearch(query, limit, options);
    },
    async reverseGeocodeLocation(latitude, longitude) {
      return fetchLocationReverse(latitude, longitude);
    },
    async getIpLocationHint() {
      return fetchIpLocationHint();
    },
    async createLocation(input) {
      return fetchCreateLocation(input);
    },
    async getLocation(locationId) {
      return fetchLocation(locationId);
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
