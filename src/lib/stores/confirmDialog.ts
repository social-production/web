import { writable } from 'svelte/store';

export interface ConfirmRequest {
  title: string;
  body?: string;
  confirmLabel?: string;
  /** Red confirm button for things that can't be undone. */
  danger?: boolean;
  resolve: (ok: boolean) => void;
}

export const confirmRequest = writable<ConfirmRequest | null>(null);

/** The app's own confirm dialog (instead of the browser's). Resolves true on confirm. */
export function askConfirm(options: Omit<ConfirmRequest, 'resolve'>): Promise<boolean> {
  return new Promise((resolve) => {
    confirmRequest.update((current) => {
      current?.resolve(false);
      return { ...options, resolve };
    });
  });
}

export function settleConfirm(ok: boolean) {
  confirmRequest.update((current) => {
    current?.resolve(ok);
    return null;
  });
}
