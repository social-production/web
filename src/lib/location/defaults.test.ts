import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('default location preference storage', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it('keeps device geolocation opt-in even without a place label', async () => {
    const { setDeviceGeolocationEnabled, isDeviceGeolocationEnabled } = await import(
      '$lib/location/geolocation'
    );
    const viewerId = 'user-1';
    setDeviceGeolocationEnabled(viewerId, true);
    expect(isDeviceGeolocationEnabled(viewerId)).toBe(true);
  });

  it('round-trips a saved place with device opt-in', async () => {
    const { writeDefaultLocation, readDefaultLocation } = await import('$lib/location/defaults');
    const viewerId = 'user-2';
    writeDefaultLocation(viewerId, {
      displayLabel: 'Melbourne',
      latitude: -37.8,
      longitude: 144.9,
      region: 'VIC',
      country: 'AU',
      precision: 'approximate',
      providerPlaceId: 'x',
      locationId: null,
      deviceGeolocationEnabled: true
    });
    const stored = readDefaultLocation(viewerId);
    expect(stored?.displayLabel).toBe('Melbourne');
    expect(stored?.deviceGeolocationEnabled).toBe(true);
  });
});

describe('hydrateDefaultLocationFromServer preference', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    vi.doUnmock('$lib/services/queries/account');
    vi.doUnmock('$lib/services/queries/locations');
  });

  it('keeps a live local GPS/search anchor instead of restoring an old server place', async () => {
    vi.doMock('$lib/services/queries/account', () => ({
      getSettings: vi.fn(async () => ({ defaultLocationId: 'server-melbourne' }))
    }));
    vi.doMock('$lib/services/queries/locations', () => ({
      getLocation: vi.fn(async () => ({
        id: 'server-melbourne',
        displayLabel: 'Melbourne',
        latitude: -37.8,
        longitude: 144.9,
        region: 'VIC',
        country: 'AU',
        precision: 'approximate',
        providerPlaceId: 'mel',
        isOnline: false
      }))
    }));

    const { writeDefaultLocation, readDefaultLocation } = await import('$lib/location/defaults');
    const { hydrateDefaultLocationFromServer } = await import('$lib/location/sync');

    writeDefaultLocation('user-3', {
      displayLabel: 'Brisbane',
      latitude: -27.47,
      longitude: 153.03,
      region: 'QLD',
      country: 'AU',
      precision: 'approximate',
      providerPlaceId: null,
      locationId: null,
      deviceGeolocationEnabled: true
    });

    const hydrated = await hydrateDefaultLocationFromServer('user-3');
    expect(hydrated?.displayLabel).toBe('Brisbane');
    expect(readDefaultLocation('user-3')?.displayLabel).toBe('Brisbane');
  });
});
