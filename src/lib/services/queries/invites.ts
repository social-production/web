import { currentAdapter } from '$lib/services/adapters';
import type { PendingInvite } from '$lib/types/invites';

export async function getPendingInvites(): Promise<PendingInvite[]> {
  return currentAdapter.getPendingInvites ? currentAdapter.getPendingInvites() : [];
}
