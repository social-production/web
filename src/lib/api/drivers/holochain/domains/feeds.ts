/**
 * Holochain `feeds` domain scaffold.
 * Responsibility: public / home / personal / region / scope / user feeds + map markers.
 * Replace stubs with real `web-holochain` calls mapped to `$lib/types/*`.
 */
import type { AppAdapter } from '$lib/services/adapters/types';
import { stubMethod } from '../../scaffold';

const provider = 'holochain' as const;
const domain = 'feeds' as const;

export const feedsDomain: Partial<AppAdapter> = {
  getPublicFeed: stubMethod(provider, domain, 'getPublicFeed') as AppAdapter['getPublicFeed'],
  getPublicFeedPage: stubMethod(provider, domain, 'getPublicFeedPage') as AppAdapter['getPublicFeedPage'],
  getHomeFeed: stubMethod(provider, domain, 'getHomeFeed') as AppAdapter['getHomeFeed'],
  getHomeFeedPage: stubMethod(provider, domain, 'getHomeFeedPage') as AppAdapter['getHomeFeedPage'],
  getRegionFeed: stubMethod(provider, domain, 'getRegionFeed') as AppAdapter['getRegionFeed'],
  getRegionFeedPage: stubMethod(provider, domain, 'getRegionFeedPage') as AppAdapter['getRegionFeedPage'],
  getMapMarkers: stubMethod(provider, domain, 'getMapMarkers') as AppAdapter['getMapMarkers'],
  getPersonalFeed: stubMethod(provider, domain, 'getPersonalFeed') as AppAdapter['getPersonalFeed'],
  getPersonalFeedPage: stubMethod(provider, domain, 'getPersonalFeedPage') as AppAdapter['getPersonalFeedPage'],
  getScopeFeedPage: stubMethod(provider, domain, 'getScopeFeedPage') as AppAdapter['getScopeFeedPage'],
  getUserFeedPage: stubMethod(provider, domain, 'getUserFeedPage') as AppAdapter['getUserFeedPage'],
};

