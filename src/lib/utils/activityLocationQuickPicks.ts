import {
  buildLocationQuickPick,
  dedupeLocationQuickPicks,
  type LocationQuickPick
} from '$lib/types/locationPicker';

type LocationSource = {
  id: string;
  label?: string | null;
  locationId?: string | null;
  sourceLabel: string;
  latitude?: number | null;
  longitude?: number | null;
  region?: string | null;
  country?: string | null;
};

export function buildActivityLocationQuickPicks(sources: LocationSource[]): LocationQuickPick[] {
  return dedupeLocationQuickPicks(
    sources.map((source) =>
      buildLocationQuickPick({
        id: source.id,
        label: source.label ?? '',
        sourceLabel: source.sourceLabel,
        locationId: source.locationId,
        latitude: source.latitude,
        longitude: source.longitude,
        region: source.region,
        country: source.country
      })
    )
  );
}
