import type { SettingsUpdateInput, SignInInput, SignUpInput } from '$lib/types/account';
import { currentAdapter } from '$lib/services/adapters';

export function signIn(input: SignInInput) {
  return currentAdapter.signIn(input);
}

export function signOut() {
  return currentAdapter.signOut();
}

export function signUp(input: SignUpInput) {
  return currentAdapter.signUp(input);
}

export function updateSettings(input: SettingsUpdateInput) {
  return currentAdapter.updateSettings(input);
}

export function followUser(username: string) {
  return currentAdapter.followUser(username);
}

export function unfollowUser(username: string) {
  return currentAdapter.unfollowUser(username);
}

export function acceptFollowRequest(username: string) {
  return currentAdapter.acceptFollowRequest(username);
}

export function rejectFollowRequest(username: string) {
  return currentAdapter.rejectFollowRequest(username);
}
