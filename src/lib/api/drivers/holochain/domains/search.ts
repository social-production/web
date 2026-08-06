/**
 * Holochain `search` domain scaffold.
 * Responsibility: global entity search.
 * Replace stubs with real `web-holochain` calls mapped to `$lib/types/*`.
 */
import type { AppAdapter } from '$lib/services/adapters/types';
import { stubMethod } from '../../scaffold';

const provider = 'holochain' as const;
const domain = 'search' as const;

export const searchDomain: Partial<AppAdapter> = {
  getSearch: stubMethod(provider, domain, 'getSearch') as AppAdapter['getSearch'],
};

