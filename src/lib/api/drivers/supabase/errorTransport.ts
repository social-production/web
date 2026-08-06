import type { ErrorTransport } from '$lib/services/errorTransport';
import { createUnimplementedErrorTransport } from '../unimplementedTransports';

/**
 * Supabase ErrorTransport scaffold.
 * Normalize provider SDK/HTTP errors into frontend-safe messages.
 */
export function createSupabaseErrorTransport(): ErrorTransport {
  return createUnimplementedErrorTransport('supabase');
}
