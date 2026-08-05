import { apiClient } from '../client';
import type { LocationPrecision, LocationRecord } from '$lib/types/location';

interface BackendLocation {
  id?: string;
  provider_place_id: string | null;
  display_label: string;
  latitude: number | null;
  longitude: number | null;
  region: string | null;
  country: string | null;
  precision: string;
  is_online: boolean;
}

function mapLocation(item: BackendLocation): LocationRecord {
  const precision: LocationPrecision = item.precision === 'exact' ? 'exact' : 'approximate';
  return {
    id: item.id,
    providerPlaceId: item.provider_place_id,
    displayLabel: item.display_label,
    latitude: item.latitude,
    longitude: item.longitude,
    region: item.region,
    country: item.country,
    precision,
    isOnline: item.is_online
  };
}

export async function fetchLocationSearch(
  query: string,
  limit = 5,
  options: { countryCodes?: string | null; viewbox?: string | null } = {}
): Promise<LocationRecord[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit)
  });
  if (options.countryCodes?.trim()) {
    params.set('country_codes', options.countryCodes.trim());
  }
  if (options.viewbox?.trim()) {
    params.set('viewbox', options.viewbox.trim());
  }
  const res = await apiClient.get<{ items: BackendLocation[] }>(`/locations/search?${params}`);
  return (res.items ?? []).map(mapLocation);
}

export async function fetchLocationReverse(
  latitude: number,
  longitude: number
): Promise<LocationRecord[]> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude)
  });
  const res = await apiClient.get<{ items: BackendLocation[] }>(`/locations/reverse?${params}`);
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
  const res = await apiClient.post<{ location: BackendLocation }>('/locations', {
    provider_place_id: input.providerPlaceId ?? null,
    display_label: input.displayLabel,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    region: input.region ?? null,
    country: input.country ?? null,
    precision: input.precision ?? 'approximate',
    is_online: input.isOnline ?? false
  });
  return mapLocation(res.location);
}

export async function fetchIpLocationHint(): Promise<LocationRecord[]> {
  const res = await apiClient.get<{ items: BackendLocation[] }>('/locations/ip-hint');
  return (res.items ?? []).map(mapLocation);
}

export async function fetchLocation(locationId: string): Promise<LocationRecord | null> {
  try {
    const res = await apiClient.get<{ location: BackendLocation }>(`/locations/${locationId}`);
    return mapLocation(res.location);
  } catch {
    return null;
  }
}
