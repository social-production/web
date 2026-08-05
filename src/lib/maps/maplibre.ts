/**
 * MapLibre-backed map adapter implementing the shared MapAdapter contract.
 */
import maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
import { circlePolygon, radiusBounds, viewportRadiusKm } from './geo';
import type { MapAdapter, MapMarker, MapViewport, MapViewportChange } from './types';
import { formatMarkerScheduleRange } from '$lib/utils/time';

import 'maplibre-gl/dist/maplibre-gl.css';

const DEFAULT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const RADIUS_SOURCE_ID = 'sp-radius-circle';
const RADIUS_FILL_LAYER_ID = 'sp-radius-fill';
const RADIUS_LINE_LAYER_ID = 'sp-radius-line';

const MARKER_COLORS: Record<string, string> = {
  event: '#5b21b6',
  project: '#16a34a',
  help_request: '#e07a5f',
  activity: '#2563eb'
};

const EVENT_ACTIVITY_COLOR = '#a78bfa';

const PROJECT_MODE_PROJECT_COLORS: Record<string, string> = {
  productive: '#166534',
  'collective-service': '#a16207',
  'personal-service': '#7c2d12'
};

const PROJECT_MODE_ACTIVITY_COLORS: Record<string, string> = {
  productive: '#22c55e',
  'collective-service': '#eab308',
  'personal-service': '#ea580c'
};

function resolveMarkerColor(item: MapMarker): string {
  const mode = item.projectMode ?? 'productive';
  if (item.entityType === 'project') {
    return PROJECT_MODE_PROJECT_COLORS[mode] ?? PROJECT_MODE_PROJECT_COLORS.productive;
  }
  if (item.entityType === 'activity' && item.activitySource === 'project') {
    return PROJECT_MODE_ACTIVITY_COLORS[mode] ?? PROJECT_MODE_ACTIVITY_COLORS.productive;
  }
  if (item.entityType === 'activity' && item.activitySource === 'event') {
    return EVENT_ACTIVITY_COLOR;
  }
  if (item.entityType === 'event') {
    return MARKER_COLORS.event;
  }

  return MARKER_COLORS[item.entityType ?? 'event'] ?? MARKER_COLORS.event;
}

const OVERLAP_PIXEL_THRESHOLD = 40;

function createSsrSafeStub(): MapAdapter {
  return {
    mount() {},
    setMarkers() {},
    setHighlightedMarker() {},
    setViewport() {},
    fitToRadius(_center, _radiusKm, onComplete) {
      onComplete?.();
    },
    getViewportRadiusKm() {
      return null;
    },
    setRadiusCircle() {},
    clearRadiusCircle() {},
    setCenterMarker() {},
    centerOnMarker() {},
    onViewportChange() {},
    resize() {},
    setErrorHandler() {},
    destroy() {}
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function truncate(value: string, maxLength: number) {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

function signupLine(item: MapMarker) {
  if (item.entityType === 'help_request' && item.slotsNeeded != null) {
    return `${item.signupCount ?? 0}/${item.slotsNeeded} signed up`;
  }
  if (item.entityType === 'activity' && item.minimumParticipants != null) {
    return `${item.committedCount ?? 0}/${item.minimumParticipants} committed`;
  }
  return '';
}

function buildTooltipHtml(item: MapMarker) {
  const lines: string[] = [];
  if (item.parentTitle?.trim()) {
    lines.push(`<strong>${escapeHtml(truncate(item.parentTitle, 48))}</strong>`);
    lines.push(`<div>${escapeHtml(truncate(item.label, 56))}</div>`);
  } else {
    lines.push(`<strong>${escapeHtml(truncate(item.label, 56))}</strong>`);
  }
  if (item.statusText?.trim()) {
    lines.push(`<div class="sp-map-tooltip__meta">${escapeHtml(truncate(item.statusText, 56))}</div>`);
  }
  const schedule = formatMarkerScheduleRange(item.scheduledAt, item.endsAt);
  if (schedule) {
    lines.push(`<div class="sp-map-tooltip__meta">${escapeHtml(schedule)}</div>`);
  }
  if (item.displayLabel?.trim()) {
    lines.push(`<div class="sp-map-tooltip__meta">${escapeHtml(truncate(item.displayLabel, 56))}</div>`);
  }
  const signup = signupLine(item);
  if (signup) {
    lines.push(`<div class="sp-map-tooltip__meta">${escapeHtml(signup)}</div>`);
  }
  const children = item.children ?? [];
  if (children.length > 0) {
    for (const child of children.slice(0, 4)) {
      lines.push(
        `<div class="sp-map-tooltip__meta">${escapeHtml(truncate(child.label, 48))}</div>`
      );
    }
    if (children.length > 4) {
      lines.push(`<div class="sp-map-tooltip__meta">+${children.length - 4} more</div>`);
    }
  }
  return lines.join('');
}

function ensureTooltipStyles() {
  if (typeof document === 'undefined' || document.getElementById('sp-map-tooltip-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'sp-map-tooltip-styles';
  style.textContent = `
    .sp-map-tooltip {
      position: fixed;
      z-index: 200;
      pointer-events: none;
      max-width: 240px;
      padding: 8px 10px;
      border: 1px solid rgba(15, 23, 42, 0.12);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.98);
      color: #111827;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);
      font: 12px/1.35 system-ui, sans-serif;
    }
    .sp-map-tooltip strong {
      display: block;
      margin-bottom: 2px;
      font-size: 12px;
    }
    .sp-map-tooltip__meta {
      margin-top: 4px;
      color: #4b5563;
      font-size: 11px;
    }
  `;
  document.head.appendChild(style);
}

function buildMarkerElement(
  item: MapMarker,
  compact: boolean,
  highlighted: boolean,
  highlightedChildId: string | null,
  showTooltip: (html: string, x: number, y: number) => void,
  moveTooltip: (x: number, y: number) => void,
  hideTooltip: () => void
): HTMLButtonElement {
  const entityType = item.entityType ?? 'event';
  const children = item.children ?? [];
  const hasChildren = children.length > 0;
  const showExpanded = highlighted || !compact || hasChildren;
  const element = document.createElement('button');
  element.type = 'button';
  element.className = [
    'sp-map-marker',
    showExpanded ? '' : 'sp-map-marker--dot',
    highlighted ? 'sp-map-marker--highlighted' : '',
    hasChildren ? 'sp-map-marker--grouped' : '',
    `sp-map-marker--${entityType}`
  ]
    .filter(Boolean)
    .join(' ');
  element.setAttribute('aria-label', item.label);
  element.dataset.markerId = item.id;

  element.style.setProperty('--sp-map-marker-color', resolveMarkerColor(item));

  const tooltipHtml = buildTooltipHtml(item);

  if (showExpanded) {
    const titleLine = document.createElement('span');
    titleLine.className = 'sp-map-marker__title sp-map-marker__title--solo';
    titleLine.textContent = truncate(item.label, 32);
    element.appendChild(titleLine);

    if (item.statusText?.trim()) {
      const statusLine = document.createElement('span');
      statusLine.className = 'sp-map-marker__status';
      statusLine.textContent = truncate(item.statusText, 28);
      element.appendChild(statusLine);
    }

    if (hasChildren) {
      const childList = document.createElement('span');
      childList.className = 'sp-map-marker__children';
      for (const child of children) {
        const childRow = document.createElement('span');
        childRow.className = [
          'sp-map-marker__child',
          child.id === highlightedChildId ? 'sp-map-marker__child--highlighted' : ''
        ]
          .filter(Boolean)
          .join(' ');
        childRow.dataset.markerId = child.id;
        childRow.style.setProperty('--sp-map-marker-child-color', resolveMarkerColor(child));
        childRow.setAttribute('role', 'link');
        childRow.tabIndex = 0;
        childRow.textContent = truncate(child.label, 28);

        const childTooltipHtml = buildTooltipHtml({
          ...child,
          parentTitle: item.label
        });

        childRow.addEventListener('mouseenter', (event) => {
          event.stopPropagation();
          for (const row of childList.querySelectorAll('.sp-map-marker__child')) {
            const rowEl = row as HTMLElement;
            rowEl.classList.toggle(
              'sp-map-marker__child--highlighted',
              rowEl === childRow || rowEl.dataset.markerId === highlightedChildId
            );
          }
          childRow.classList.add('sp-map-marker__child--highlighted');
          showTooltip(childTooltipHtml, event.clientX, event.clientY);
        });
        childRow.addEventListener('mousemove', (event) => {
          event.stopPropagation();
          moveTooltip(event.clientX, event.clientY);
        });
        childRow.addEventListener('mouseleave', (event) => {
          event.stopPropagation();
          if (child.id !== highlightedChildId) {
            childRow.classList.remove('sp-map-marker__child--highlighted');
          }
          showTooltip(tooltipHtml, event.clientX, event.clientY);
        });
        childRow.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (child.href) {
            window.location.assign(child.href);
          }
        });

        childList.appendChild(childRow);
      }
      element.appendChild(childList);
    }
  }

  element.addEventListener('mouseenter', (event) => {
    if ((event.target as HTMLElement | null)?.closest?.('.sp-map-marker__child')) {
      return;
    }
    showTooltip(tooltipHtml, event.clientX, event.clientY);
  });
  element.addEventListener('mousemove', (event) => {
    if ((event.target as HTMLElement | null)?.closest?.('.sp-map-marker__child')) {
      return;
    }
    moveTooltip(event.clientX, event.clientY);
  });
  element.addEventListener('mouseleave', () => {
    hideTooltip();
  });

  if (item.href) {
    element.addEventListener('click', (event) => {
      if ((event.target as HTMLElement | null)?.closest?.('.sp-map-marker__child')) {
        return;
      }
      event.preventDefault();
      window.location.assign(item.href!);
    });
  }

  return element;
}

function scheduleSortKey(item: MapMarker): number {
  if (!item.scheduledAt) {
    return Number.MAX_SAFE_INTEGER;
  }
  const parsed = Date.parse(item.scheduledAt);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function isParentEntity(item: MapMarker): boolean {
  return item.entityType === 'event' || item.entityType === 'project' || item.entityType === 'help_request';
}

/**
 * Same-location parent + activity markers collapse into one parent pin with nested sub-pins.
 * Unrelated same-location items still stack vertically as expanded pins.
 */
function stackOverlappingCoordinates(nextMarkers: MapMarker[]): {
  markers: MapMarker[];
  forceExpandedIds: Set<string>;
  childToParentId: Map<string, string>;
} {
  const groups = new Map<string, MapMarker[]>();
  for (const item of nextMarkers) {
    const key = `${item.latitude.toFixed(5)}:${item.longitude.toFixed(5)}`;
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      groups.set(key, [item]);
    }
  }

  const forceExpandedIds = new Set<string>();
  const childToParentId = new Map<string, string>();
  const markers: MapMarker[] = [];
  const STACK_LAT_STEP = 0.00038;

  for (const group of groups.values()) {
    if (group.length === 1) {
      markers.push(group[0]);
      continue;
    }

    const parents = group
      .filter(isParentEntity)
      .sort((a, b) => scheduleSortKey(a) - scheduleSortKey(b) || a.id.localeCompare(b.id));
    const activities = group.filter((item) => item.entityType === 'activity');
    const used = new Set<string>();
    const stackEntries: MapMarker[] = [];

    for (const parent of parents) {
      const children = activities
        .filter((item) => item.parentId === parent.id)
        .sort((a, b) => scheduleSortKey(a) - scheduleSortKey(b) || a.id.localeCompare(b.id));
      used.add(parent.id);
      for (const child of children) {
        used.add(child.id);
        childToParentId.set(child.id, parent.id);
      }
      stackEntries.push({
        ...parent,
        children: children.length > 0 ? children : undefined
      });
      forceExpandedIds.add(parent.id);
    }

    const leftovers = group
      .filter((item) => !used.has(item.id))
      .sort((a, b) => scheduleSortKey(a) - scheduleSortKey(b) || a.id.localeCompare(b.id));
    for (const item of leftovers) {
      stackEntries.push(item);
      forceExpandedIds.add(item.id);
    }

    stackEntries.forEach((item, index) => {
      markers.push({
        ...item,
        latitude: item.latitude - STACK_LAT_STEP * index
      });
    });
  }

  return { markers, forceExpandedIds, childToParentId };
}

function detectCrowdedMarkerIds(
  map: MapLibreMap,
  nextMarkers: MapMarker[],
  forceExpandedIds: Set<string> = new Set()
): Set<string> {
  const crowded = new Set<string>();
  const projected: Array<{ id: string; x: number; y: number }> = [];

  for (const item of nextMarkers) {
    if (forceExpandedIds.has(item.id)) {
      continue;
    }
    const point = map.project([item.longitude, item.latitude]);
    projected.push({ id: item.id, x: point.x, y: point.y });
  }

  const thresholdSq = OVERLAP_PIXEL_THRESHOLD * OVERLAP_PIXEL_THRESHOLD;
  for (let i = 0; i < projected.length; i += 1) {
    for (let j = i + 1; j < projected.length; j += 1) {
      const dx = projected[i].x - projected[j].x;
      const dy = projected[i].y - projected[j].y;
      if (dx * dx + dy * dy <= thresholdSq) {
        crowded.add(projected[i].id);
        crowded.add(projected[j].id);
      }
    }
  }

  return crowded;
}

export function createMapLibreAdapter(): MapAdapter {
  let map: MapLibreMap | null = null;
  let markers: Marker[] = [];
  let pendingMarkers: MapMarker[] = [];
  let resizeObserver: ResizeObserver | null = null;
  let onError: ((message: string) => void) | null = null;
  let viewportHandler: ((change: MapViewportChange) => void) | null = null;
  let viewportDebounce: ReturnType<typeof setTimeout> | null = null;
  let suppressViewportEvents = false;
  let tooltipElement: HTMLDivElement | null = null;
  let markerCompactDebounce: ReturnType<typeof setTimeout> | null = null;
  let lastCrowdedKey = '';
  let isRenderingMarkers = false;
  let centerMarker: Marker | null = null;
  let radiusLayersReady = false;
  let highlightedMarkerId: string | null = null;
  let markerById = new Map<string, { marker: Marker; item: MapMarker }>();
  let forceExpandedMarkerIds = new Set<string>();
  let childToParentId = new Map<string, string>();

  function resolveHighlightTarget(markerId: string | null): {
    parentId: string | null;
    childId: string | null;
  } {
    if (!markerId) {
      return { parentId: null, childId: null };
    }
    const parentId = childToParentId.get(markerId);
    if (parentId) {
      return { parentId, childId: markerId };
    }
    return { parentId: markerId, childId: null };
  }

  function ensureRadiusLayers() {
    if (!map || radiusLayersReady) {
      return;
    }
    if (!map.getSource(RADIUS_SOURCE_ID)) {
      map.addSource(RADIUS_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      map.addLayer({
        id: RADIUS_FILL_LAYER_ID,
        type: 'fill',
        source: RADIUS_SOURCE_ID,
        paint: {
          'fill-color': '#2563eb',
          'fill-opacity': 0.08
        }
      });
      map.addLayer({
        id: RADIUS_LINE_LAYER_ID,
        type: 'line',
        source: RADIUS_SOURCE_ID,
        paint: {
          'line-color': '#2563eb',
          'line-opacity': 0.35,
          'line-width': 2
        }
      });
    }
    radiusLayersReady = true;
  }

  function runWhenStyleReady(task: () => void) {
    if (!map) {
      return;
    }
    if (map.isStyleLoaded()) {
      task();
      return;
    }
    map.once('load', task);
  }

  function clearMarkers() {
    for (const marker of markers) {
      marker.remove();
    }
    markers = [];
  }

  function clearCenterMarker() {
    centerMarker?.remove();
    centerMarker = null;
  }

  function scheduleResize() {
    if (!map) return;
    suppressViewportEvents = true;
    map.resize();
    map.once('idle', () => {
      map?.resize();
      window.setTimeout(() => {
        suppressViewportEvents = false;
      }, 300);
    });
  }

  function ensureTooltip() {
    ensureTooltipStyles();
    if (!tooltipElement) {
      tooltipElement = document.createElement('div');
      tooltipElement.className = 'sp-map-tooltip';
      tooltipElement.hidden = true;
      document.body.appendChild(tooltipElement);
    }
    return tooltipElement;
  }

  function showTooltip(html: string, x: number, y: number) {
    const tooltip = ensureTooltip();
    tooltip.innerHTML = html;
    tooltip.hidden = false;
    tooltip.style.left = `${x + 14}px`;
    tooltip.style.top = `${y + 14}px`;
  }

  function moveTooltip(x: number, y: number) {
    if (!tooltipElement || tooltipElement.hidden) {
      return;
    }
    tooltipElement.style.left = `${x + 14}px`;
    tooltipElement.style.top = `${y + 14}px`;
  }

  function hideTooltip() {
    if (tooltipElement) {
      tooltipElement.hidden = true;
      tooltipElement.innerHTML = '';
    }
  }

  function emitViewportChange() {
    if (!map || suppressViewportEvents || !viewportHandler) {
      return;
    }
    const radius = getViewportRadiusKmInternal();
    if (radius != null) {
      const center = map.getCenter();
      viewportHandler({
        center: { latitude: center.lat, longitude: center.lng },
        radiusKm: radius
      });
    }
  }

  function scheduleViewportChange() {
    if (suppressViewportEvents) {
      return;
    }
    if (viewportDebounce) {
      clearTimeout(viewportDebounce);
    }
    viewportDebounce = setTimeout(() => {
      emitViewportChange();
    }, 400);
  }

  function getViewportRadiusKmInternal(): number | null {
    if (!map) {
      return null;
    }
    const center = map.getCenter();
    const bounds = map.getBounds();
    return viewportRadiusKm(
      center.lat,
      center.lng,
      { latitude: bounds.getNorth(), longitude: bounds.getEast() },
      { latitude: bounds.getSouth(), longitude: bounds.getWest() }
    );
  }

  function renderMarkers(nextMarkers: MapMarker[]) {
    if (!map) {
      return;
    }
    if (isRenderingMarkers) {
      pendingMarkers = nextMarkers;
      window.queueMicrotask(() => {
        if (pendingMarkers === nextMarkers) {
          renderMarkers(pendingMarkers);
        }
      });
      return;
    }

    isRenderingMarkers = true;
    try {
      clearMarkers();
      markerById.clear();
      const stacked = stackOverlappingCoordinates(nextMarkers);
      forceExpandedMarkerIds = stacked.forceExpandedIds;
      childToParentId = stacked.childToParentId;
      const positioned = stacked.markers;
      const crowded = detectCrowdedMarkerIds(map, positioned, forceExpandedMarkerIds);
      lastCrowdedKey = [...crowded].sort().join(',');
      const highlight = resolveHighlightTarget(highlightedMarkerId);

      positioned.forEach((item, stackIndex) => {
        const isHighlightTarget = item.id === highlight.parentId;
        const compact =
          crowded.has(item.id) &&
          !isHighlightTarget &&
          !forceExpandedMarkerIds.has(item.id);
        const highlighted = isHighlightTarget;
        const element = buildMarkerElement(
          item,
          compact,
          highlighted,
          isHighlightTarget ? highlight.childId : null,
          showTooltip,
          moveTooltip,
          hideTooltip
        );
        if (forceExpandedMarkerIds.has(item.id) || highlighted) {
          element.style.zIndex = String(40 + stackIndex);
        }
        const marker = new maplibregl.Marker({
          element,
          anchor: compact && !highlighted ? 'center' : 'bottom'
        })
          .setLngLat([item.longitude, item.latitude])
          .addTo(map!);
        markers.push(marker);
        markerById.set(item.id, { marker, item });
        for (const child of item.children ?? []) {
          markerById.set(child.id, { marker, item });
        }
      });
    } finally {
      isRenderingMarkers = false;
    }
  }

  function scheduleCompactRefresh() {
    if (markerCompactDebounce) {
      clearTimeout(markerCompactDebounce);
    }
    markerCompactDebounce = setTimeout(() => {
      if (!map || pendingMarkers.length === 0 || isRenderingMarkers) {
        return;
      }
      const stacked = stackOverlappingCoordinates(pendingMarkers);
      forceExpandedMarkerIds = stacked.forceExpandedIds;
      childToParentId = stacked.childToParentId;
      const crowded = detectCrowdedMarkerIds(map, stacked.markers, forceExpandedMarkerIds);
      const crowdedKey = [...crowded].sort().join(',');
      if (crowdedKey === lastCrowdedKey) {
        return;
      }
      renderMarkers(pendingMarkers);
    }, 400);
  }

  function applyPendingMarkers() {
    if (!map) {
      return;
    }
    renderMarkers(pendingMarkers);
  }

  function attachViewportListeners() {
    if (!map) {
      return;
    }
    map.on('moveend', scheduleViewportChange);
    map.on('zoomend', () => {
      scheduleViewportChange();
      scheduleCompactRefresh();
    });
  }

  return {
    async mount(container, viewport) {
      if (map) {
        scheduleResize();
        applyPendingMarkers();
        return;
      }

      await new Promise<void>((resolve, reject) => {
        map = new maplibregl.Map({
          container,
          style: DEFAULT_STYLE,
          center: [viewport.center.longitude, viewport.center.latitude],
          zoom: viewport.zoom
        });
        map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right');

        map.once('load', () => {
          ensureRadiusLayers();
          attachViewportListeners();
          applyPendingMarkers();
          scheduleResize();
          resolve();
        });

        map.once('error', (event) => {
          const message =
            event.error?.message?.trim() || 'Map tiles could not be loaded.';
          onError?.(message);
          reject(new Error(message));
        });

        resizeObserver = new ResizeObserver(() => {
          scheduleResize();
        });
        resizeObserver.observe(container);
      }).catch(() => {
        // Surface error via callback; keep map instance if partially loaded.
      });
    },

    setMarkers(nextMarkers: MapMarker[]) {
      pendingMarkers = nextMarkers;
      if (!map) {
        return;
      }

      if (map.isStyleLoaded()) {
        renderMarkers(pendingMarkers);
      } else {
        map.once('load', () => {
          ensureRadiusLayers();
          renderMarkers(pendingMarkers);
        });
      }
    },

    setHighlightedMarker(markerId) {
      highlightedMarkerId = markerId;
      if (map && pendingMarkers.length > 0) {
        renderMarkers(pendingMarkers);
      }
    },

    setViewport(viewport: MapViewport) {
      suppressViewportEvents = true;
      map?.jumpTo({
        center: [viewport.center.longitude, viewport.center.latitude],
        zoom: viewport.zoom
      });
      scheduleResize();
      window.setTimeout(() => {
        suppressViewportEvents = false;
      }, 250);
    },

    fitToRadius(center, radiusKm, onComplete) {
      if (!map) {
        onComplete?.();
        return;
      }
      suppressViewportEvents = true;
      const bounds = radiusBounds(center.latitude, center.longitude, radiusKm);
      map.fitBounds(bounds, {
        padding: 28,
        maxZoom: radiusKm <= 25 ? 13 : radiusKm <= 100 ? 11 : radiusKm <= 500 ? 9 : 7,
        duration: 350
      });
      map.once('moveend', () => {
        window.setTimeout(() => {
          suppressViewportEvents = false;
          onComplete?.();
        }, 300);
      });
    },

    getViewportRadiusKm() {
      return getViewportRadiusKmInternal();
    },

    setRadiusCircle(center, radiusKm) {
      runWhenStyleReady(() => {
        if (!map) {
          return;
        }
        ensureRadiusLayers();
        const polygon = circlePolygon(center.latitude, center.longitude, radiusKm);
        const source = map.getSource(RADIUS_SOURCE_ID) as maplibregl.GeoJSONSource;
        source?.setData({
          type: 'Feature',
          geometry: polygon,
          properties: {}
        });
      });
    },

    clearRadiusCircle() {
      if (!map) {
        return;
      }
      const source = map.getSource(RADIUS_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      source?.setData({ type: 'FeatureCollection', features: [] });
    },

    setCenterMarker(center) {
      clearCenterMarker();
      if (!map || !center) {
        return;
      }
      const element = document.createElement('div');
      element.className = 'sp-map-center-marker';
      element.setAttribute('aria-hidden', 'true');
      centerMarker = new maplibregl.Marker({ element, anchor: 'bottom' })
        .setLngLat([center.longitude, center.latitude])
        .addTo(map);
    },

    centerOnMarker(markerId) {
      const entry = markerById.get(markerId);
      if (!map || !entry) {
        return;
      }
      suppressViewportEvents = true;
      map.panTo([entry.item.longitude, entry.item.latitude], { duration: 280 });
      map.once('moveend', () => {
        window.setTimeout(() => {
          suppressViewportEvents = false;
        }, 200);
      });
    },

    onViewportChange(handler) {
      viewportHandler = handler;
    },

    resize() {
      scheduleResize();
    },

    destroy() {
      if (viewportDebounce) {
        clearTimeout(viewportDebounce);
      }
      if (markerCompactDebounce) {
        clearTimeout(markerCompactDebounce);
      }
      hideTooltip();
      tooltipElement?.remove();
      tooltipElement = null;
      resizeObserver?.disconnect();
      resizeObserver = null;
      clearMarkers();
      clearCenterMarker();
      if (map) {
        const source = map.getSource(RADIUS_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
        source?.setData({ type: 'FeatureCollection', features: [] });
      }
      map?.remove();
      map = null;
      radiusLayersReady = false;
      pendingMarkers = [];
      onError = null;
      viewportHandler = null;
    },

    setErrorHandler(handler: ((message: string) => void) | null) {
      onError = handler;
    }
  };
}

/** Prefer MapLibre in the browser; keep stub for SSR. */
export function createBrowserMapAdapter(): MapAdapter {
  if (typeof window === 'undefined') {
    return createSsrSafeStub();
  }
  return createMapLibreAdapter();
}
