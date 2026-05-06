import { currentAdapter } from '$lib/services/adapters';

export function getBootstrap() {
  return currentAdapter.getBootstrap();
}