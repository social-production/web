import type { SettingsUpdateInput } from '$lib/types/account';
import { currentAdapter } from '$lib/services/adapters';

export function getOnboarding() {
  return currentAdapter.getOnboarding();
}

export function getSettings() {
  return currentAdapter.getSettings();
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