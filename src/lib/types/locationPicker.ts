import type { LocationPrecision } from '$lib/types/location';

export type LocationPickerMode = 'physical' | 'online' | 'tbd';

export interface LocationPickerValue {
  mode: LocationPickerMode;
  displayLabel: string;
  locationId: string | null;
  providerPlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
  region: string | null;
  country: string | null;
  precision: LocationPrecision;
  isOnline: boolean;
}

export interface LocationQuickPick {
  id: string;
  label: string;
  sourceLabel: string;
  value: LocationPickerValue;
}

export function buildLocationQuickPick(input: {
  id: string;
  label: string;
  sourceLabel: string;
  locationId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  region?: string | null;
  country?: string | null;
}): LocationQuickPick | null {
  const label = input.label.trim();
  if (!label || label.toLowerCase() === 'online') {
    return null;
  }

  return {
    id: input.id,
    label,
    sourceLabel: input.sourceLabel,
    value: {
      ...emptyLocationPickerValue('physical'),
      displayLabel: label,
      locationId: input.locationId ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      region: input.region ?? null,
      country: input.country ?? null
    }
  };
}

export function dedupeLocationQuickPicks(picks: Array<LocationQuickPick | null | undefined>): LocationQuickPick[] {
  const seen = new Set<string>();
  const result: LocationQuickPick[] = [];

  for (const pick of picks) {
    if (!pick) {
      continue;
    }
    const key = `${pick.value.locationId ?? ''}|${pick.label.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(pick);
  }

  return result;
}

export function emptyLocationPickerValue(mode: LocationPickerMode = 'physical'): LocationPickerValue {
  return {
    mode,
    displayLabel: '',
    locationId: null,
    providerPlaceId: null,
    latitude: null,
    longitude: null,
    region: null,
    country: null,
    precision: 'approximate',
    isOnline: mode === 'online'
  };
}

export function onlineLocationPickerValue(label = 'Online'): LocationPickerValue {
  return {
    mode: 'online',
    displayLabel: label,
    locationId: null,
    providerPlaceId: null,
    latitude: null,
    longitude: null,
    region: null,
    country: null,
    precision: 'approximate',
    isOnline: true
  };
}
