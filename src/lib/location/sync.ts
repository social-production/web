import { browser } from '$app/environment';
import { getLocation } from '$lib/services/queries/locations';
import { getSettings } from '$lib/services/queries/account';
import { updateSettings } from '$lib/services/commands/account';
import type { DefaultLocationPreference } from '$lib/types/location';
import { readDefaultLocation, writeDefaultLocation } from './defaults';

export async function hydrateDefaultLocationFromServer(viewerId: string | null) {
  if (!browser || !viewerId) {
    return readDefaultLocation(viewerId);
  }

  const settings = await getSettings();
  const locationId = settings?.defaultLocationId;
  if (!locationId) {
    return readDefaultLocation(viewerId);
  }

  const location = await getLocation(locationId);
  if (!location) {
    return readDefaultLocation(viewerId);
  }

  const preference: Omit<DefaultLocationPreference, 'updatedAt'> = {
    displayLabel: location.displayLabel,
    latitude: location.latitude,
    longitude: location.longitude,
    region: location.region,
    country: location.country,
    precision: location.precision,
    providerPlaceId: location.providerPlaceId,
    locationId: location.id ?? locationId,
    deviceGeolocationEnabled: readDefaultLocation(viewerId)?.deviceGeolocationEnabled ?? false
  };
  writeDefaultLocation(viewerId, preference);
  return readDefaultLocation(viewerId);
}

export async function persistDefaultLocationToServer(
  viewerId: string | null,
  preference: Omit<DefaultLocationPreference, 'updatedAt'>
) {
  writeDefaultLocation(viewerId, preference);
  if (!viewerId) {
    return;
  }

  await updateSettings({
    defaultLocationId: preference.locationId
  });
}

export async function clearDefaultLocationOnServer(viewerId: string | null) {
  if (browser) {
    writeDefaultLocation(viewerId, {
      displayLabel: '',
      latitude: null,
      longitude: null,
      region: null,
      country: null,
      precision: 'approximate',
      providerPlaceId: null,
      locationId: null,
      deviceGeolocationEnabled: false
    });
  }
  if (viewerId) {
    await updateSettings({ defaultLocationId: null });
  }
}
