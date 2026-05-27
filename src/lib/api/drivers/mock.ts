import { devAdapter } from '$lib/services/adapters/dev';
import type { AppAdapter } from '$lib/services/adapters/types';

export function createMockDriver(): AppAdapter {
  return devAdapter;
}
