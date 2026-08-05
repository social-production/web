/**
 * Device geolocation is explicit opt-in and defaults off.
 * No IP-based geolocation is performed automatically.
 */
import { browser } from '$app/environment';
import { reverseGeocodeLocation } from '$lib/services/queries/locations';
import { readDefaultLocation, writeDefaultLocation } from './defaults';

export interface DevicePosition {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export type DevicePositionError = 'disabled' | 'unsupported' | 'denied' | 'timeout' | 'unavailable';

export type DevicePositionResult =
  | { ok: true; position: DevicePosition; label: string; providerPlaceId: string | null }
  | { ok: false; error: DevicePositionError };

export function isDeviceGeolocationEnabled(viewerId: string | null): boolean {
  return readDefaultLocation(viewerId)?.deviceGeolocationEnabled === true;
}

export function setDeviceGeolocationEnabled(viewerId: string | null, enabled: boolean) {
  const current = readDefaultLocation(viewerId);
  writeDefaultLocation(viewerId, {
    displayLabel: current?.displayLabel ?? '',
    latitude: current?.latitude ?? null,
    longitude: current?.longitude ?? null,
    region: current?.region ?? null,
    country: current?.country ?? null,
    precision: current?.precision ?? 'approximate',
    providerPlaceId: current?.providerPlaceId ?? null,
    locationId: current?.locationId ?? null,
    deviceGeolocationEnabled: enabled
  });
}

function mapGeolocationError(code: number): DevicePositionError {
  if (code === 1) return 'denied';
  if (code === 2) return 'unavailable';
  if (code === 3) return 'timeout';
  return 'unavailable';
}

export async function requestDevicePosition(viewerId: string | null): Promise<DevicePositionResult> {
  if (!browser) {
    return { ok: false, error: 'unsupported' };
  }

  if (!isDeviceGeolocationEnabled(viewerId)) {
    return { ok: false, error: 'disabled' };
  }

  if (!('geolocation' in navigator)) {
    return { ok: false, error: 'unsupported' };
  }

  const result = await new Promise<DevicePosition | { error: DevicePositionError }>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (coords) => {
        resolve({
          latitude: coords.coords.latitude,
          longitude: coords.coords.longitude,
          accuracy: coords.coords.accuracy ?? null
        });
      },
      (error) => resolve({ error: mapGeolocationError(error.code) }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 }
    );
  });

  if ('error' in result) {
    return { ok: false, error: result.error };
  }

  const position = result;

  let label = 'Current location';
  let providerPlaceId: string | null = null;
  let region: string | null = null;
  let country: string | null = null;

  try {
    const reverse = await reverseGeocodeLocation(position.latitude, position.longitude);
    if (reverse[0]) {
      label = reverse[0].displayLabel;
      providerPlaceId = reverse[0].providerPlaceId;
      region = reverse[0].region;
      country = reverse[0].country;
    }
  } catch {
    // Keep coordinate fallback label.
  }

  writeDefaultLocation(viewerId, {
    displayLabel: label,
    latitude: position.latitude,
    longitude: position.longitude,
    region,
    country,
    precision: 'approximate',
    providerPlaceId,
    locationId: readDefaultLocation(viewerId)?.locationId ?? null,
    deviceGeolocationEnabled: true
  });

  return {
    ok: true,
    position,
    label,
    providerPlaceId
  };
}

export function devicePositionErrorMessage(error: DevicePositionError): string {
  switch (error) {
    case 'denied':
      return 'Location permission denied. Search for a place instead.';
    case 'timeout':
      return 'Location request timed out. Try again or search for a place.';
    case 'unsupported':
      return 'This browser does not support device location.';
    case 'disabled':
      return 'Device location is off. Enable it in settings or search for a place.';
    default:
      return 'Could not determine your location. Search for a place instead.';
  }
}
