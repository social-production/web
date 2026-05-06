import { browser } from '$app/environment';

export type ShellMode = 'web' | 'app';

type MaybeCapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
  };
};

export function detectShellMode(): ShellMode {
  if (!browser) {
    return 'web';
  }

  const maybeWindow = window as MaybeCapacitorWindow;
  const isCapacitor = !!maybeWindow.Capacitor?.isNativePlatform?.();

  if (isCapacitor) {
    return 'app';
  }

  const standaloneMatch = window.matchMedia?.('(display-mode: standalone)')?.matches ?? false;

  return standaloneMatch ? 'app' : 'web';
}
