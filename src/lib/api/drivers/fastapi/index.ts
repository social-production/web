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
