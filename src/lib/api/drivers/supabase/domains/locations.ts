import { apiClient } from '../client';
import type { AppAdapter } from '$lib/services/adapters/types';
import type { LocationPrecision, LocationRecord } from '$lib/types/location';

function mapLocation(item: Partial<LocationRecord> & Record<string, unknown>): LocationRecord {
  return {
    id: (item.id as string | undefined) ?? undefined,
    providerPlaceId: (item.providerPlaceId as string | null | undefined) ?? (item.provider_place_id as string | null | undefined) ?? null,
    displayLabel: (item.displayLabel as string | undefined) ?? (item.display_label as string | undefined) ?? '',
    latitude: (item.latitude as number | null | undefined) ?? null,
    longitude: (item.longitude as number | null | undefined) ?? null,
    region: (item.region as string | null | undefined) ?? null,
    country: (item.country as string | null | undefined) ?? null,
    precision: ((item.precision as string | undefined) === 'exact' ? 'exact' : 'approximate') as LocationPrecision,
    isOnline: Boolean(item.isOnline ?? item.is_online ?? false)
  };
}

export async function fetchLocationSearch(
  query: string,
  limit = 5,
  options: { countryCodes?: string | null; viewbox?: string | null } = {}
): Promise<LocationRecord[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (options.countryCodes?.trim()) params.set('country_codes', options.countryCodes.trim());
  if (options.viewbox?.trim()) params.set('viewbox', options.viewbox.trim());
  const res = await apiClient.get<{ items: Array<Record<string, unknown>> }>(`/locations/search?${params}`);
  return (res.items ?? []).map(mapLocation);
}

export async function fetchLocationReverse(latitude: number, longitude: number): Promise<LocationRecord[]> {
  const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude) });
  const res = await apiClient.get<{ items: Array<Record<string, unknown>> }>(`/locations/reverse?${params}`);
  return (res.items ?? []).map(mapLocation);
}

export async function fetchCreateLocation(input: {
  providerPlaceId?: string | null;
  displayLabel: string;
  latitude?: number | null;
  longitude?: number | null;
  region?: string | null;
  country?: string | null;
  precision?: LocationPrecision;
  isOnline?: boolean;
}): Promise<LocationRecord> {
  const res = await apiClient.post<Record<string, unknown>>('/locations', {
    providerPlaceId: input.providerPlaceId ?? null,
    displayLabel: input.displayLabel,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    region: input.region ?? null,
    country: input.country ?? null,
    precision: input.precision ?? 'approximate',
    isOnline: input.isOnline ?? false
  });
  return mapLocation(res.location && typeof res.location === 'object' ? (res.location as Record<string, unknown>) : res);
}

export async function fetchIpLocationHint(): Promise<LocationRecord[]> {
  const res = await apiClient.get<{ items: Array<Record<string, unknown>> }>('/locations/ip-hint');
  return (res.items ?? []).map(mapLocation);
}

export async function fetchLocation(locationId: string): Promise<LocationRecord | null> {
  try {
    const res = await apiClient.get<Record<string, unknown>>(`/locations/${locationId}`);
    return mapLocation(res);
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export const locationsDomain: Partial<AppAdapter> = {
  searchLocations: fetchLocationSearch,
  reverseGeocodeLocation: fetchLocationReverse,
  getIpLocationHint: fetchIpLocationHint,
  createLocation: fetchCreateLocation,
  getLocation: fetchLocation
};
