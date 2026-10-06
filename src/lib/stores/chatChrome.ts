import { writable } from 'svelte/store';

/** True while a conversation or detail chat is the open surface. */
export const chatImmersive = writable(false);

let token = 0;

/**
 * Claim or release the immersive-chat flag.
 * A later page can take over without an earlier page's destroy clearing it.
 */
export function syncChatImmersive(active: boolean, held: number): number {
  if (active) {
    if (held !== 0 && held === token) {
      return held;
    }
    token += 1;
    chatImmersive.set(true);
    return token;
  }

  if (held !== 0 && held === token) {
    chatImmersive.set(false);
  }
  return 0;
}
