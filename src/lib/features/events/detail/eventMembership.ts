import { goto } from '$app/navigation';
import { askConfirm } from '$lib/stores/confirmDialog';
import { showToast } from '$lib/stores/toast';

type MembershipEvent = { title: string; isPrivate: boolean; viewerIsMember: boolean };

/** Leaving asks first; joining doesn't. */
export function confirmEventMembershipToggle(event: MembershipEvent): Promise<boolean> {
  if (!event.viewerIsMember) return Promise.resolve(true);
  return askConfirm({
    title: `Leave ${event.title}?`,
    body: event.isPrivate
      ? "It's private, so you'll need a new invite to come back."
      : 'You can join again any time.',
    confirmLabel: 'Leave',
    danger: true,
  });
}

/** Say what happened; a private event is no longer visible after leaving, so go home. */
export async function finishEventMembershipToggle(event: MembershipEvent, wasMember: boolean) {
  showToast(wasMember ? `You left ${event.title}` : `You joined ${event.title}`);
  if (wasMember && event.isPrivate) await goto('/');
}
