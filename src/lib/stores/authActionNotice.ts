import { writable } from 'svelte/store';

export const authActionNoticeVisible = writable(false);
export const authActionNoticeMessage = writable('Sign in to continue.');

export function showAuthActionNotice(message?: string): void {
  authActionNoticeMessage.set(message?.trim() || 'Sign in to continue.');
  authActionNoticeVisible.set(true);
}

export function dismissAuthActionNotice(): void {
  authActionNoticeVisible.set(false);
}
