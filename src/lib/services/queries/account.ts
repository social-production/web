import type { SettingsUpdateInput, SignInInput, SignUpInput } from '$lib/types/account';
import { currentAdapter } from '$lib/services/adapters';

export function getOnboarding() {
  return currentAdapter.getOnboarding();
}

export function getSettings() {
  return currentAdapter.getSettings();
}

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

export function hydrateClientSettingsState() {
  return currentAdapter.hydrateClientState ? currentAdapter.hydrateClientState() : Promise.resolve(false);
}

export function getProfile(username: string) {
  return currentAdapter.getProfile(username);
}

export function followUser(username: string) {
  return currentAdapter.followUser(username);
}

export function unfollowUser(username: string) {
  return currentAdapter.unfollowUser(username);
}