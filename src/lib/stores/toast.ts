import { writable } from 'svelte/store';

export type ToastTone = 'success' | 'error';

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const TOAST_MS = 3200;

export const toasts = writable<Toast[]>([]);

let nextId = 1;

export function dismissToast(id: number): void {
  toasts.update((items) => items.filter((item) => item.id !== id));
}

export function showToast(message: string, tone: ToastTone = 'success'): void {
  const text = message.trim();
  if (!text) return;
  // One failure can be reported by both the command layer and the screen; show it once.
  let alreadyShowing = false;
  toasts.update((items) => {
    alreadyShowing = items.some((item) => item.message === text && item.tone === tone);
    return items;
  });
  if (alreadyShowing) return;
  const id = nextId++;
  toasts.update((items) => [...items.slice(-2), { id, message: text, tone }]);
  setTimeout(() => dismissToast(id), TOAST_MS);
}

/** Name the empty required fields, or return true when every field has a value. */
export function requireFields(fields: Record<string, unknown>): boolean {
  const missing = Object.entries(fields)
    .filter(([, value]) => (typeof value === 'string' ? !value.trim() : value == null))
    .map(([label]) => label);
  if (!missing.length) return true;
  showToast(`${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} required.`, 'error');
  return false;
}
