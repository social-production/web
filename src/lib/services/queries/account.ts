import type { SettingsUpdateInput, SignInInput, SignUpInput } from '$lib/types/account';
import { currentAdapter } from '$lib/services/adapters';

export function getOnboarding() {
  return currentAdapter.getOnboarding();
}

export function getSettings() {
  return currentAdapter.getSettings();
}

export function hydrateClientSettingsState() {
  return currentAdapter.hydrateClientState ? currentAdapter.hydrateClientState() : Promise.resolve(false);
}

export function getProfile(username: string) {
  return currentAdapter.getProfile(username);
}

export function getFollowRequests() {
  return currentAdapter.getFollowRequests();
}

/** @deprecated Import mutations from `$lib/services/commands/account`. */
export {
  signIn,
  signOut,
  signUp,
  updateSettings,
  followUser,
  unfollowUser,
  acceptFollowRequest,
  rejectFollowRequest
} from '$lib/services/commands/account';

export type { SettingsUpdateInput, SignInInput, SignUpInput };
