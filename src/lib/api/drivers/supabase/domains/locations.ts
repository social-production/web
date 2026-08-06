/**
 * Supabase `locations` domain scaffold.
 * Responsibility: geocode / create / reverse / IP hint.
 * Replace stubs with real `web-supabase` calls mapped to `$lib/types/*`.
 */
import type { AppAdapter } from '$lib/services/adapters/types';
import { stubMethod } from '../../scaffold';

const provider = 'supabase' as const;
const domain = 'locations' as const;

export const locationsDomain: Partial<AppAdapter> = {
  searchLocations: stubMethod(provider, domain, 'searchLocations') as AppAdapter['searchLocations'],
  reverseGeocodeLocation: stubMethod(provider, domain, 'reverseGeocodeLocation') as AppAdapter['reverseGeocodeLocation'],
  getIpLocationHint: stubMethod(provider, domain, 'getIpLocationHint') as AppAdapter['getIpLocationHint'],
  createLocation: stubMethod(provider, domain, 'createLocation') as AppAdapter['createLocation'],
  getLocation: stubMethod(provider, domain, 'getLocation') as AppAdapter['getLocation'],
};

