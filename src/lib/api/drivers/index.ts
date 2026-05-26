import { createFastApiDriver } from './fastapi';
import { createMockDriver } from './mock';

export type BackendDriverName = 'mock' | 'fastapi';

export function getBackendDriverName(): BackendDriverName {
  const backend = (import.meta.env.VITE_BACKEND ?? 'mock').toLowerCase();
  return backend === 'fastapi' ? 'fastapi' : 'mock';
}

export function createApiDriver() {
  switch (getBackendDriverName()) {
    case 'fastapi':
      return createFastApiDriver();
    case 'mock':
    default:
      return createMockDriver();
  }
}
