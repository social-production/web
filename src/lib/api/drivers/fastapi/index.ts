export { createFastApiClient } from './client';
export { getFastApiAuthConfig } from './auth';
export { serializeFastApiPayload } from './serializer';

export { buildFastApiAuthDomain } from './domains/auth';
export { buildFastApiUsersDomain } from './domains/users';
export { buildFastApiScopesDomain } from './domains/scopes';
export { buildFastApiContentDomain } from './domains/content';
export { buildFastApiProjectsDomain } from './domains/projects';
export { buildFastApiEventsDomain } from './domains/events';
export { buildFastApiMessagesDomain } from './domains/messages';
export { buildFastApiNotificationsDomain } from './domains/notifications';
export { buildFastApiSearchDomain } from './domains/search';
export { buildFastApiPlatformDomain } from './domains/platform';
export { buildFastApiFeedsDomain } from './domains/feeds';
export { buildFastApiBootstrapDomain } from './domains/bootstrap';

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
