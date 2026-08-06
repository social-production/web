/**
 * Supabase `users` domain scaffold.
 * Responsibility: profile, settings, follows.
 * Replace stubs with real `web-supabase` calls mapped to `$lib/types/*`.
 */
import type { AppAdapter } from '$lib/services/adapters/types';
import { stubMethod } from '../../scaffold';

const provider = 'supabase' as const;
const domain = 'users' as const;

export const usersDomain: Partial<AppAdapter> = {
  getSettings: stubMethod(provider, domain, 'getSettings') as AppAdapter['getSettings'],
  updateSettings: stubMethod(provider, domain, 'updateSettings') as AppAdapter['updateSettings'],
  hydrateClientState: stubMethod(provider, domain, 'hydrateClientState') as AppAdapter['hydrateClientState'],
  getProfile: stubMethod(provider, domain, 'getProfile') as AppAdapter['getProfile'],
  followUser: stubMethod(provider, domain, 'followUser') as AppAdapter['followUser'],
  unfollowUser: stubMethod(provider, domain, 'unfollowUser') as AppAdapter['unfollowUser'],
  acceptFollowRequest: stubMethod(provider, domain, 'acceptFollowRequest') as AppAdapter['acceptFollowRequest'],
  rejectFollowRequest: stubMethod(provider, domain, 'rejectFollowRequest') as AppAdapter['rejectFollowRequest'],
  getFollowRequests: stubMethod(provider, domain, 'getFollowRequests') as AppAdapter['getFollowRequests'],
};

