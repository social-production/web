import { invalidate } from '$app/navigation';
import { currentAdapter } from '$lib/services/adapters';

export function getBootstrap() {
  return currentAdapter.getBootstrap();
}

export async function refreshBootstrap() {
  await invalidate('app:bootstrap');
}