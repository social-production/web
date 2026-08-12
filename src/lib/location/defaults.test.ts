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
