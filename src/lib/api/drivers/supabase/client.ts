/**
 * Supabase transport client scaffold.
 *
 * Replace with a real SDK/HTTP client that talks to `web-supabase`.
 * Frontend features must never import this module — only the driver package may.
 */

export type SupabaseClientConfig = {
  /** Public API URL or Supabase project URL / Holochain conductor URL. */
  url?: string;
  /** Provider anon/public key when applicable. */
  anonKey?: string;
};

export type SupabaseClient = {
  provider: 'supabase';
  config: SupabaseClientConfig;
};

export function createSupabaseClient(
  config: SupabaseClientConfig = {}
): SupabaseClient {
  return {
    provider: 'supabase',
    config
  };
}
