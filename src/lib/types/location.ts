/** Canonical location contracts shared by web and future native clients. */

export type LocationPrecision = 'exact' | 'approximate';

export interface LocationRecord {
  id?: string;
  providerPlaceId: string | null;
  displayLabel: string;
  latitude: number | null;
  longitude: number | null;
  region: string | null;
  country: string | null;
  precision: LocationPrecision;
  isOnline: boolean;
}

export interface LocationSearchResult extends LocationRecord {}

export interface DefaultLocationPreference {
  /** Stored place label for display. */
  displayLabel: string;
  latitude: number | null;
  longitude: number | null;
  region: string | null;
  country: string | null;
  precision: LocationPrecision;
  providerPlaceId: string | null;
  /** Server location id when signed-in user saved a default. */
  locationId: string | null;
  /** Explicit device geolocation opt-in; defaults false. */
  deviceGeolocationEnabled: boolean;
  updatedAt: string;
}

export const DEFAULT_LOCATION_PRECISION: LocationPrecision = 'approximate';
