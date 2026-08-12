import { browser } from '$app/environment';
import type { DefaultLocationPreference, LocationPrecision } from '$lib/types/location';
import { DEFAULT_LOCATION_PRECISION } from '$lib/types/location';

const ANON_KEY = 'sp_default_location_anon';

export function defaultLocationStorageKey(viewerId: string | null) {
  return viewerId ? `sp_default_location_${viewerId}` : ANON_KEY;
}

function isPrecision(value: unknown): value is LocationPrecision {
  return value === 'exact' || value === 'approximate';
}

function parsePreference(raw: string | null): DefaultLocationPreference | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DefaultLocationPreference>;
    const hasCoords =
      typeof parsed.latitude === 'number' &&
      typeof parsed.longitude === 'number' &&
      Number.isFinite(parsed.latitude) &&
      Number.isFinite(parsed.longitude);
    const hasLabel = typeof parsed.displayLabel === 'string' && parsed.displayLabel.trim().length > 0;
    const deviceEnabled = parsed.deviceGeolocationEnabled === true;

    // Allow opt-in-only records (no place chosen yet) so "Device location" can stay On.
    if (!hasLabel && !hasCoords && !deviceEnabled) {
      return null;
    }

    return {
      displayLabel: hasLabel ? parsed.displayLabel!.trim() : hasCoords ? 'Current location' : '',
      latitude: hasCoords ? (parsed.latitude as number) : null,
      longitude: hasCoords ? (parsed.longitude as number) : null,
      region: typeof parsed.region === 'string' ? parsed.region : null,
      country: typeof parsed.country === 'string' ? parsed.country : null,
      precision: isPrecision(parsed.precision) ? parsed.precision : DEFAULT_LOCATION_PRECISION,
      providerPlaceId: typeof parsed.providerPlaceId === 'string' ? parsed.providerPlaceId : null,
      locationId: typeof parsed.locationId === 'string' ? parsed.locationId : null,
      deviceGeolocationEnabled: deviceEnabled,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString()
    };
  } catch {
    return null;
  }
}

/** Anonymous (and local mirror) default location — never stores provider credentials. */
export function readDefaultLocation(viewerId: string | null): DefaultLocationPreference | null {
  if (!browser) {
    return null;
  }

  return parsePreference(localStorage.getItem(defaultLocationStorageKey(viewerId)));
}

export function writeDefaultLocation(
  viewerId: string | null,
  preference: Omit<DefaultLocationPreference, 'updatedAt'> & { updatedAt?: string }
) {
  if (!browser) {
    return;
  }

  const payload: DefaultLocationPreference = {
    ...preference,
    precision: preference.precision || DEFAULT_LOCATION_PRECISION,
    deviceGeolocationEnabled: preference.deviceGeolocationEnabled === true,
    updatedAt: preference.updatedAt ?? new Date().toISOString()
  };

  localStorage.setItem(defaultLocationStorageKey(viewerId), JSON.stringify(payload));
}

export function clearDefaultLocation(viewerId: string | null) {
  if (!browser) {
    return;
  }

  localStorage.removeItem(defaultLocationStorageKey(viewerId));
}
