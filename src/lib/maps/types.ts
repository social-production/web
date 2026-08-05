/** Map adapter contracts — MapLibre is an implementation detail, not a public API. */

import type { ProjectMode } from '$lib/types/feed';

export interface MapViewport {
  center: { latitude: number; longitude: number };
  zoom: number;
}

export interface MapViewportChange {
  center: { latitude: number; longitude: number };
  radiusKm: number;
}

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  href?: string;
  entityType?: 'event' | 'project' | 'help_request' | 'activity';
  activitySource?: 'event' | 'project' | null;
  projectMode?: ProjectMode | null;
  parentId?: string | null;
  parentTitle?: string | null;
  /** Nested activity markers rendered inside a parent pin at the same location. */
  children?: MapMarker[];
  /** Secondary status text (e.g. Accepting requests), not the primary name. */
  statusText?: string | null;
  displayLabel?: string | null;
  scheduledAt?: string | null;
  endsAt?: string | null;
  signupCount?: number | null;
  slotsNeeded?: number | null;
  committedCount?: number | null;
  minimumParticipants?: number | null;
}

export interface MapAdapter {
  /** Mount the map into a container element. */
  mount(container: HTMLElement, viewport: MapViewport): Promise<void> | void;
  setMarkers(markers: MapMarker[]): void;
  setHighlightedMarker?(markerId: string | null): void;
  setViewport(viewport: MapViewport): void;
  fitToRadius?(center: { latitude: number; longitude: number }, radiusKm: number, onComplete?: () => void): void;
  getViewportRadiusKm?(): number | null;
  setRadiusCircle?(center: { latitude: number; longitude: number }, radiusKm: number): void;
  clearRadiusCircle?(): void;
  setCenterMarker?(center: { latitude: number; longitude: number } | null): void;
  /** Pan to a marker without changing zoom. */
  centerOnMarker?(markerId: string): void;
  onViewportChange?(handler: ((change: MapViewportChange) => void) | null): void;
  /** Recompute map dimensions after the container becomes visible or resizes. */
  resize?(): void;
  /** Optional hook for tile/style load failures. */
  setErrorHandler?(handler: ((message: string) => void) | null): void;
  destroy(): void;
}

export type MapAdapterFactory = () => MapAdapter;
