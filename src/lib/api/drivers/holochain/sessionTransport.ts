import type { SessionTransport } from '$lib/services/sessionTransport';
import { createUnimplementedSessionTransport } from '../unimplementedTransports';

/**
 * Holochain SessionTransport scaffold.
 * Implement cold-start restore / refresh against `web-holochain` auth.
 */
export function createHolochainSessionTransport(): SessionTransport {
  return createUnimplementedSessionTransport('holochain');
}
