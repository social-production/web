import type { SessionTransport } from '$lib/services/sessionTransport';
import { createUnimplementedSessionTransport } from '../unimplementedTransports';

/**
 * Supabase SessionTransport scaffold.
 * Implement cold-start restore / refresh against `web-supabase` auth.
 */
export function createSupabaseSessionTransport(): SessionTransport {
  return createUnimplementedSessionTransport('supabase');
}
