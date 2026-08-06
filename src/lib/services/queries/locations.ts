import { currentAdapter } from '$lib/services/adapters';
import type { LocationPrecision, LocationRecord } from '$lib/types/location';

export interface LocationSearchOptions {
  countryCodes?: string | null;
  viewbox?: string | null;
}

export async function searchLocations(
  query: string,
  limit = 5,
  options: LocationSearchOptions = {}
): Promise<LocationRecord[]> {
  return currentAdapter.searchLocations(query, limit, options);
}

export async function reverseGeocodeLocation(
  latitude: number,
  longitude: number
): Promise<LocationRecord[]> {
  return currentAdapter.reverseGeocodeLocation(latitude, longitude);
}

export async function getIpLocationHint(): Promise<LocationRecord[]> {
  return currentAdapter.getIpLocationHint();
}

export async function getLocation(locationId: string): Promise<LocationRecord | null> {
  return currentAdapter.getLocation(locationId);
}

/** @deprecated Import from `$lib/services/commands/locations`. */
export { createLocation } from '$lib/services/commands/locations';

export type { LocationPrecision, LocationRecord };
