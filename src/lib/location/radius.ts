export const GLOBAL_RADIUS_VALUE = 'global';
export const GLOBAL_RADIUS_KM = 20_000;

export const radiusPresetOptions = [
  { value: '10', label: '10 km' },
  { value: '25', label: '25 km' },
  { value: '50', label: '50 km' },
  { value: '100', label: '100 km' },
  { value: '250', label: '250 km' },
  { value: '500', label: '500 km' },
  { value: '1000', label: '1000 km' },
  { value: GLOBAL_RADIUS_VALUE, label: 'Global' }
];

export function effectiveRadiusKm(value: string, fallback = 25): number {
  if (value === GLOBAL_RADIUS_VALUE) {
    return GLOBAL_RADIUS_KM;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(GLOBAL_RADIUS_KM, Math.max(1, Math.round(parsed)));
}

export function normalizeRadiusFromUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed === GLOBAL_RADIUS_VALUE) {
    return GLOBAL_RADIUS_VALUE;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return trimmed;
  }
  if (parsed >= GLOBAL_RADIUS_KM) {
    return GLOBAL_RADIUS_VALUE;
  }
  return String(Math.round(parsed));
}

export function radiusForUrl(value: string): string {
  return value === GLOBAL_RADIUS_VALUE ? String(GLOBAL_RADIUS_KM) : value;
}

/** Format a live viewport radius for the combobox (exact km, not snapped to presets). */
export function viewportRadiusDisplayValue(radiusKm: number): string {
  if (!Number.isFinite(radiusKm) || radiusKm >= GLOBAL_RADIUS_KM * 0.6) {
    return GLOBAL_RADIUS_VALUE;
  }
  return String(Math.max(1, Math.round(radiusKm)));
}

/** @deprecated Prefer viewportRadiusDisplayValue for live zoom sync. */
export function nearestRadiusPreset(radiusKm: number): string {
  return viewportRadiusDisplayValue(radiusKm);
}
