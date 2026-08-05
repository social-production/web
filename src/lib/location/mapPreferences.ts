import { browser } from '$app/environment';

export interface MapFilterPreferences {
  radiusKm: string;
  windowFilter: string;
  entityFilter: string;
  upcomingOnly: boolean;
  updatedAt: string;
}

const ANON_KEY = 'sp_map_preferences_anon';

export function mapPreferencesStorageKey(viewerId: string | null) {
  return viewerId ? `sp_map_preferences_${viewerId}` : ANON_KEY;
}

function parsePreferences(raw: string | null): MapFilterPreferences | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<MapFilterPreferences>;
    if (typeof parsed.radiusKm !== 'string' || !parsed.radiusKm.trim()) {
      return null;
    }

    return {
      radiusKm: parsed.radiusKm.trim(),
      windowFilter: typeof parsed.windowFilter === 'string' ? parsed.windowFilter : 'all',
      entityFilter: typeof parsed.entityFilter === 'string' ? parsed.entityFilter : 'all',
      upcomingOnly: parsed.upcomingOnly !== false,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString()
    };
  } catch {
    return null;
  }
}

export function readMapPreferences(viewerId: string | null): MapFilterPreferences | null {
  if (!browser) {
    return null;
  }

  return parsePreferences(localStorage.getItem(mapPreferencesStorageKey(viewerId)));
}

export function writeMapPreferences(
  viewerId: string | null,
  preferences: Omit<MapFilterPreferences, 'updatedAt'> & { updatedAt?: string }
) {
  if (!browser) {
    return;
  }

  const payload: MapFilterPreferences = {
    ...preferences,
    updatedAt: preferences.updatedAt ?? new Date().toISOString()
  };

  localStorage.setItem(mapPreferencesStorageKey(viewerId), JSON.stringify(payload));
}
