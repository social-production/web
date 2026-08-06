import { currentAdapter } from '$lib/services/adapters';
import type { LocationPrecision, LocationRecord } from '$lib/types/location';

export async function createLocation(input: {
  providerPlaceId?: string | null;
  displayLabel: string;
  latitude?: number | null;
  longitude?: number | null;
  region?: string | null;
  country?: string | null;
  precision?: LocationPrecision;
  isOnline?: boolean;
}): Promise<LocationRecord> {
  return currentAdapter.createLocation(input);
}
