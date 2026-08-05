/**
 * Isolated map adapter boundary.
 *
 * Phase 6 uses MapLibre behind createMapAdapter. Tests may override the factory.
 */
import type { MapAdapter, MapAdapterFactory } from './types';
import { createBrowserMapAdapter, createMapLibreAdapter } from './maplibre';

export type { MapAdapter, MapAdapterFactory, MapMarker, MapViewport } from './types';
export { createMapLibreAdapter };

export function createStubMapAdapter(): MapAdapter {
  return {
    mount(_container, _viewport) {},
    setMarkers(_markers) {},
    setViewport(_viewport) {},
    resize() {},
    setErrorHandler(_handler) {},
    destroy() {}
  };
}

let factory: MapAdapterFactory = createBrowserMapAdapter;

/** Override the adapter factory (e.g. stub in tests). */
export function setMapAdapterFactory(next: MapAdapterFactory) {
  factory = next;
}

export function resetMapAdapterFactory() {
  factory = createBrowserMapAdapter;
}

export function createMapAdapter(): MapAdapter {
  return factory();
}
