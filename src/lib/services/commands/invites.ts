import { currentAdapter } from '$lib/services/adapters';
import { refreshBootstrap } from '$lib/services/queries/bootstrap';
import type { InviteAnswer } from '$lib/types/invites';
import { confirmed } from './confirm';

/** Accept or decline an invite; accepting adds you, so the left rail refreshes. */
export async function answerInvite(id: string, accept: boolean): Promise<InviteAnswer> {
  if (!currentAdapter.answerInvite) return { accepted: false, href: null };
  const answer = await confirmed(
    currentAdapter.answerInvite(id, accept),
    accept ? 'Invite accepted' : 'Invite declined'
  );
  await refreshBootstrap();
  return answer;
}
