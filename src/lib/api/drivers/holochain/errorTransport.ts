import type { ErrorTransport } from '$lib/services/errorTransport';
import { createUnimplementedErrorTransport } from '../unimplementedTransports';

/**
 * Holochain ErrorTransport scaffold.
 * Normalize provider SDK/HTTP errors into frontend-safe messages.
 */
export function createHolochainErrorTransport(): ErrorTransport {
  return createUnimplementedErrorTransport('holochain');
}
