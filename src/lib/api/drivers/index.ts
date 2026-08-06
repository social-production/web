import { createFastApiDriver } from './fastapi';
import { createFastApiErrorTransport } from './fastapi/errorTransport';
import { createFastApiSessionTransport } from './fastapi/sessionTransport';
import { createHolochainDriver, createHolochainErrorTransport, createHolochainSessionTransport } from './holochain';
import { createMockDriver } from './mock';
import {
  assertProviderReady,
  getProviderMetadata,
  parseBackendDriverName,
  type BackendDriverName,
  type ProviderMetadata
} from './registry';
import { createSupabaseDriver, createSupabaseErrorTransport, createSupabaseSessionTransport } from './supabase';
import {
  createTemplateDriver,
  createTemplateErrorTransport,
  createTemplateSessionTransport
} from './template';
import { setErrorTransport } from '$lib/services/errorTransport';
import { setSessionTransport } from '$lib/services/sessionTransport';

export type { BackendDriverName, ProviderMetadata };
export {
  PROVIDER_REGISTRY,
  PROVIDER_REQUIRED_DOMAINS,
  getProviderMetadata,
  parseBackendDriverName
} from './registry';

export function getBackendDriverName(): BackendDriverName {
  return parseBackendDriverName(import.meta.env.VITE_BACKEND);
}

function configureDriverTransports(name: BackendDriverName): void {
  switch (name) {
    case 'fastapi':
      setSessionTransport(createFastApiSessionTransport());
      setErrorTransport(createFastApiErrorTransport());
      break;
    case 'supabase':
      setSessionTransport(createSupabaseSessionTransport());
      setErrorTransport(createSupabaseErrorTransport());
      break;
    case 'holochain':
      setSessionTransport(createHolochainSessionTransport());
      setErrorTransport(createHolochainErrorTransport());
      break;
    case 'template':
      setSessionTransport(createTemplateSessionTransport('template'));
      setErrorTransport(createTemplateErrorTransport('template'));
      break;
    case 'mock':
    default:
      break;
  }
}

export function createApiDriver() {
  const name = getBackendDriverName();
  const meta = getProviderMetadata(name);

  // Ready and experimental (template) may construct; unimplemented providers fail here.
  if (meta.status === 'unimplemented') {
    assertProviderReady(name);
  }

  configureDriverTransports(name);

  switch (name) {
    case 'fastapi':
      return createFastApiDriver();
    case 'supabase':
      // Scaffold package exists; registry status remains unimplemented until filled in.
      return createSupabaseDriver();
    case 'holochain':
      return createHolochainDriver();
    case 'template':
      return createTemplateDriver('template');
    case 'mock':
    default:
      return createMockDriver();
  }
}

// Ensure session/error transports exist even if only helpers are imported first.
try {
  configureDriverTransports(getBackendDriverName());
} catch {
  // Invalid VITE_BACKEND during isolated unit tests — createApiDriver will throw later.
}
