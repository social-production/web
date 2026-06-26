import { writable } from 'svelte/store';

export const authActionNoticeVisible = writable(false);

let dismissTimer: ReturnType<typeof setTimeout> | null = null;

export function showAuthActionNotice(): void {
  authActionNoticeVisible.set(true);

  if (dismissTimer) {
    clearTimeout(dismissTimer);
  }

  dismissTimer = setTimeout(() => {
    authActionNoticeVisible.set(false);
    dismissTimer = null;
  }, 4000);
}
