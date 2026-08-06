/**
 * Holochain transport client scaffold.
 *
 * Replace with a real SDK/HTTP client that talks to `web-holochain`.
 * Frontend features must never import this module — only the driver package may.
 */

export type HolochainClientConfig = {
  /** Public API URL or Supabase project URL / Holochain conductor URL. */
  url?: string;
  /** Provider anon/public key when applicable. */
  anonKey?: string;
};

export type HolochainClient = {
  provider: 'holochain';
  config: HolochainClientConfig;
};

export function createHolochainClient(
  config: HolochainClientConfig = {}
): HolochainClient {
  return {
    provider: 'holochain',
    config
  };
}
