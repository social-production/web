import type { AppAdapter } from '$lib/services/adapters/types';

function notImplemented(method: string): never {
  throw new Error(`Template driver: ${method} is not implemented`);
}

export function createTemplateDriver(): AppAdapter {
  return new Proxy({} as AppAdapter, {
    get(_target, prop: string) {
      return () => notImplemented(prop);
    }
  });
}
