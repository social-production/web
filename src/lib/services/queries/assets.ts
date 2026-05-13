import { currentAdapter } from '$lib/services/adapters';

export function getPlatformAssets() {
  return currentAdapter.getPlatformAssets();
}