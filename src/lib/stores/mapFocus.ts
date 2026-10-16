import { writable } from 'svelte/store';

/** A place another surface wants shown on the in-app map (the shell opens the map panel). */
export interface MapFocusRequest {
  label: string;
  locationId: string | null;
  token: number;
}

export const mapFocusRequest = writable<MapFocusRequest | null>(null);

export function openPlaceOnMap(label: string, locationId: string | null = null) {
  const trimmed = label.trim();
  if (!trimmed) return;
  mapFocusRequest.set({ label: trimmed, locationId, token: Date.now() });
}

export function clearMapFocusRequest() {
  mapFocusRequest.set(null);
}
