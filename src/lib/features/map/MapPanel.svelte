<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import MapDiscoveryCard from '$lib/components/cards/map/MapDiscoveryCard.svelte';
  import IconMenuButton from '$lib/components/shared/IconMenuButton.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import LocationPicker from '$lib/components/shared/LocationPicker.svelte';
  import RadiusCombobox from '$lib/components/shared/RadiusCombobox.svelte';
  import { getMapMarkers } from '$lib/services/queries/feeds';
  import { readDefaultLocation, writeDefaultLocation } from '$lib/location/defaults';
  import { readMapPreferences, writeMapPreferences } from '$lib/location/mapPreferences';
  import {
    devicePositionErrorMessage,
    isDeviceGeolocationEnabled,
    requestDevicePosition,
    setDeviceGeolocationEnabled
  } from '$lib/location/geolocation';
  import {
    GLOBAL_RADIUS_VALUE,
    effectiveRadiusKm,
    viewportRadiusDisplayValue,
    radiusForUrl,
    radiusPresetOptions
  } from '$lib/location/radius';
  import { hydrateDefaultLocationFromServer } from '$lib/location/sync';
  import { getIpLocationHint } from '$lib/services/queries/locations';
  import { createMapAdapter } from '$lib/maps/adapter';
  import type { MapAdapter, MapMarker } from '$lib/maps/types';
  import type { ProjectMode } from '$lib/types/feed';
  import type { LocationPickerValue } from '$lib/types/locationPicker';
  import { emptyLocationPickerValue } from '$lib/types/locationPicker';
  import { displayTimezone } from '$lib/stores/timezoneStore';
  import { portal } from '$lib/utils/portal';

  export let embedded = true;
  export let active = true;

  const WORLD_CENTER = { latitude: 20, longitude: 0 };
  const WORLD_ZOOM = 2;
  const LOCAL_ZOOM = 11;
  const RADIUS_SYNC_BUFFER_MS = 300;
  const MAP_HEIGHT_EXPANDED_VH = 0.45;
  const MAP_HEIGHT_COLLAPSED_VH = 0.02;
  const MAP_COLLAPSE_SCROLL_THRESHOLD = 8;
  const MAP_EXPAND_SCROLL_THRESHOLD = 2;

  const windowOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This week' },
    { value: 'month', label: 'This month' },
    { value: 'all', label: 'All time' },
    { value: 'custom', label: 'Custom range' }
  ];
  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'events', label: 'Events' },
    { value: 'projects', label: 'Projects' },
    { value: 'help_requests', label: 'Help requests' }
  ];

  type MapListItem = {
    id: string;
    title: string;
    href: string;
    distanceKm: number;
    entityType: 'event' | 'project' | 'help_request' | 'activity';
    activitySource: 'event' | 'project' | null;
    projectMode: ProjectMode | null;
    displayLabel: string;
    scheduledAt: string | null;
    endsAt: string | null;
    parentTitle: string | null;
    subtitle: string | null;
    signupCount: number | null;
    slotsNeeded: number | null;
    committedCount: number | null;
    minimumParticipants: number | null;
  };

  const dispatch = createEventDispatcher<{ close: void }>();

  let mapContainer: HTMLDivElement | null = null;
  let listPanelEl: HTMLElement | null = null;
  let adapter: MapAdapter | null = null;
  let mapMounted = false;
  let markers: MapMarker[] = [];
  let listItems: MapListItem[] = [];
  let locationValue: LocationPickerValue = emptyLocationPickerValue();
  let radiusKm = '25';
  let upcomingOnly = true;
  let windowFilter = 'all';
  let entityFilter = 'all';
  let dateFrom = '';
  let dateTo = '';
  let loading = false;
  let errorMessage = '';
  let locationToast = '';
  let mapTileError = '';
  let syncingFromRadius = false;

  function explainMapTileError(raw: string | null | undefined): string {
    const message = (raw ?? '').trim();
    const lower = message.toLowerCase();
    if (
      !message ||
      lower.includes('networkerror') ||
      lower.includes('failed to fetch') ||
      lower.includes('ajaxerror') ||
      lower.includes('load failed') ||
      lower.includes('cartocdn') ||
      lower.includes('basemaps.cartocdn')
    ) {
      return 'Map tiles could not be loaded from the internet (Carto basemaps). Local auth and feeds can still work — check DNS, firewall, VPN, or ad-blockers if the rest of the app is fine.';
    }
    return message;
  }
  let mapFullscreen = false;
  let isMobile = false;
  let mapListCollapsed = false;
  let mapStageTransitioning = false;
  let viewportPanActive = false;
  let viewportRadiusKm: number | null = null;
  let currentRadiusKm: number | null = null;
  let mapStageHeightPx = 0;
  let customDateOpen = false;
  let fullscreenSearchOpen = false;
  let customDateWrap: HTMLDivElement | null = null;
  let customDateButton: HTMLButtonElement | null = null;
  let customDateMenuEl: HTMLDivElement | null = null;
  let customDateMenuStyle = '';
  let loadDebounce: ReturnType<typeof setTimeout> | null = null;
  let locationToastTimer: ReturnType<typeof setTimeout> | null = null;
  let radiusSyncTimer: ReturnType<typeof setTimeout> | null = null;
  let mapResizeDebounce: ReturnType<typeof setTimeout> | null = null;
  let suppressViewportLoads = false;
  let suppressViewportLoadsTimer: ReturnType<typeof setTimeout> | null = null;
  let lastViewportLoadKey = '';
  let listScrollTop = 0;
  let markerLoadToken = 0;
  let highlightedMarkerId: string | null = null;

  $: centerLat = locationValue.latitude;
  $: centerLon = locationValue.longitude;
  $: showCustomDates = windowFilter === 'custom';
  $: if (!showCustomDates) {
    customDateOpen = false;
  }
  $: hasCenter = centerLat != null && centerLon != null;
  $: showMapOverlayFilters = isMobile || mapFullscreen;
  $: mapStageStyle =
    isMobile && !mapFullscreen && mapStageHeightPx > 0
      ? `height: ${mapStageHeightPx}px; flex: 0 0 auto;`
      : '';

  function viewerId() {
    return $page.data.bootstrap?.viewer?.id ?? null;
  }

  function updateMapStageHeight() {
    if (listPanelEl) {
      listScrollTop = listPanelEl.scrollTop;
    }
    if (!isMobile || mapFullscreen) {
      mapStageHeightPx = 0;
      return;
    }
    mapStageHeightPx = mapListCollapsed
      ? window.innerHeight * MAP_HEIGHT_COLLAPSED_VH
      : window.innerHeight * MAP_HEIGHT_EXPANDED_VH;
  }

  async function restoreListScrollAfterLayout() {
    if (!listPanelEl || listScrollTop <= 0) {
      return;
    }
    await tick();
    if (listPanelEl) {
      listPanelEl.scrollTop = listScrollTop;
    }
  }

  async function positionCustomDateMenu() {
    await tick();
    if (!customDateButton || !customDateMenuEl) {
      return;
    }
    const rect = customDateButton.getBoundingClientRect();
    const menuRect = customDateMenuEl.getBoundingClientRect();
    const top = Math.max(8, rect.top - menuRect.height - 6);
    const left = Math.max(8, Math.min(rect.right - menuRect.width, window.innerWidth - menuRect.width - 8));
    customDateMenuStyle = `top: ${top}px; left: ${left}px;`;
  }

  function endRadiusSync() {
    if (radiusSyncTimer) {
      clearTimeout(radiusSyncTimer);
    }
    radiusSyncTimer = setTimeout(() => {
      syncingFromRadius = false;
      currentRadiusKm = adapter?.getViewportRadiusKm?.() ?? currentRadiusKm;
      syncRadiusOverlay();
      if (currentRadiusKm != null) {
        syncRadiusComboboxFromViewport(currentRadiusKm);
      }
      radiusSyncTimer = null;
    }, RADIUS_SYNC_BUFFER_MS);
  }

  function syncRadiusOverlay(override?: { lat: number; lon: number }) {
    const lat = override?.lat ?? centerLat;
    const lon = override?.lon ?? centerLon;
    if (!adapter || lat == null || lon == null) {
      adapter?.setCenterMarker?.(null);
      adapter?.clearRadiusCircle?.();
      return;
    }

    adapter.setCenterMarker?.({ latitude: lat, longitude: lon });
    const radius =
      currentRadiusKm ?? adapter.getViewportRadiusKm?.() ?? effectiveRadiusKm(radiusKm);
    if (radius != null) {
      adapter.setRadiusCircle?.({ latitude: lat, longitude: lon }, radius);
    }
  }

  function syncRadiusComboboxFromViewport(radius: number) {
    if (syncingFromRadius) {
      return;
    }
    const next = viewportRadiusDisplayValue(radius);
    if (next !== radiusKm) {
      radiusKm = next;
      persistFilters();
    }
  }

  function updateCurrentRadiusFromViewport() {
    const nextRadius = adapter?.getViewportRadiusKm?.();
    if (nextRadius != null) {
      currentRadiusKm = nextRadius;
      syncRadiusOverlay();
      syncRadiusComboboxFromViewport(nextRadius);
    }
  }

  function beginRadiusSync() {
    syncingFromRadius = true;
    if (radiusSyncTimer) {
      clearTimeout(radiusSyncTimer);
      radiusSyncTimer = null;
    }
  }

  function pauseViewportLoads(durationMs = 400) {
    suppressViewportLoads = true;
    if (suppressViewportLoadsTimer) {
      clearTimeout(suppressViewportLoadsTimer);
    }
    suppressViewportLoadsTimer = setTimeout(() => {
      suppressViewportLoads = false;
      suppressViewportLoadsTimer = null;
    }, durationMs);
  }

  function scheduleMapResize(delayMs = 50) {
    if (!active) {
      return;
    }
    pauseViewportLoads(delayMs + 350);
    if (mapResizeDebounce) {
      clearTimeout(mapResizeDebounce);
    }
    mapResizeDebounce = setTimeout(() => {
      adapter?.resize?.();
      mapResizeDebounce = null;
    }, delayMs);
  }

  function handleMapStageTransitionStart(event: TransitionEvent) {
    if (event.target !== event.currentTarget || event.propertyName !== 'height') {
      return;
    }
    mapStageTransitioning = true;
    pauseViewportLoads(500);
    scheduleMapResize(120);
  }

  function handleMapStageTransitionEnd(event: TransitionEvent) {
    if (event.target !== event.currentTarget || event.propertyName !== 'height') {
      return;
    }
    mapStageTransitioning = false;
    void restoreListScrollAfterLayout();
    scheduleMapResize();
  }

  function handleListScroll(event: Event) {
    if (mapStageTransitioning || !isMobile || mapFullscreen) {
      return;
    }
    const el = event.currentTarget as HTMLElement;

    // Collapse as soon as the list is scrolled down a bit.
    if (!mapListCollapsed && el.scrollTop > MAP_COLLAPSE_SCROLL_THRESHOLD) {
      mapListCollapsed = true;
      updateMapStageHeight();
      pauseViewportLoads(500);
      scheduleMapResize(120);
      void restoreListScrollAfterLayout();
      return;
    }

    // Expand only when the user scrolls back near the top.
    // Do not auto-expand just because the taller list no longer overflows.
    if (mapListCollapsed && el.scrollTop <= MAP_EXPAND_SCROLL_THRESHOLD) {
      mapListCollapsed = false;
      updateMapStageHeight();
      pauseViewportLoads(500);
      scheduleMapResize(120);
      void restoreListScrollAfterLayout();
    }
  }

  function sortListItemsBySchedule(items: MapListItem[]): MapListItem[] {
    return [...items].sort((left, right) => {
      const leftTime = left.scheduledAt ? new Date(left.scheduledAt).getTime() : Number.POSITIVE_INFINITY;
      const rightTime = right.scheduledAt ? new Date(right.scheduledAt).getTime() : Number.POSITIVE_INFINITY;
      return leftTime - rightTime;
    });
  }

  function persistFilters() {
    writeMapPreferences(viewerId(), {
      radiusKm,
      windowFilter,
      entityFilter,
      upcomingOnly
    });
  }

  function showLocationToast(message: string) {
    locationToast = message;
    if (locationToastTimer) {
      clearTimeout(locationToastTimer);
    }
    locationToastTimer = setTimeout(() => {
      locationToast = '';
      locationToastTimer = null;
    }, 4000);
  }

  function clearLocationToast() {
    locationToast = '';
    if (locationToastTimer) {
      clearTimeout(locationToastTimer);
      locationToastTimer = null;
    }
  }

  function isPastScheduled(scheduledAt: string | null): boolean {
    if (!scheduledAt) {
      return false;
    }
    return new Date(scheduledAt).getTime() < Date.now();
  }

  function highlightMarker(markerId: string | null, { center = false } = {}) {
    highlightedMarkerId = markerId;
    adapter?.setHighlightedMarker?.(markerId);
    if (center && markerId) {
      adapter?.centerOnMarker?.(markerId);
    }
  }

  function handleListItemHover(markerId: string) {
    if (isMobile) {
      return;
    }
    highlightMarker(markerId);
  }

  function handleListItemLeave() {
    if (isMobile) {
      return;
    }
    highlightMarker(null);
  }

  function handleListItemSelect(markerId: string) {
    highlightMarker(markerId, { center: true });
  }

  function resetViewportQuery() {
    viewportPanActive = false;
    viewportRadiusKm = null;
    lastViewportLoadKey = '';
  }

  function mapMarkerFromItem(item: Awaited<ReturnType<typeof getMapMarkers>>[number]): MapMarker {
    const isActivity = item.entityType === 'activity';
    return {
      id: item.id,
      latitude: item.latitude,
      longitude: item.longitude,
      label: item.title,
      href: item.href,
      entityType: item.entityType,
      activitySource: item.activitySource ?? null,
      projectMode: (item.projectMode as ProjectMode | null) ?? null,
      parentId: isActivity ? item.parentId ?? null : null,
      parentTitle: isActivity ? item.parentTitle ?? null : null,
      statusText:
        item.entityType === 'project' && !item.activitySource ? item.subtitle ?? null : null,
      displayLabel: item.displayLabel ?? '',
      scheduledAt: item.scheduledAt ?? null,
      endsAt: item.endsAt ?? null,
      signupCount: item.signupCount ?? null,
      slotsNeeded: item.slotsNeeded ?? null,
      committedCount: item.committedCount ?? null,
      minimumParticipants: item.minimumParticipants ?? null
    };
  }

  function listItemFromMarker(item: Awaited<ReturnType<typeof getMapMarkers>>[number]): MapListItem {
    return {
      id: item.id,
      title: item.title,
      href: item.href,
      distanceKm: item.distanceKm,
      entityType: item.entityType,
      activitySource: item.activitySource ?? null,
      projectMode: (item.projectMode as ProjectMode | null) ?? null,
      displayLabel: item.displayLabel ?? '',
      scheduledAt: item.scheduledAt ?? null,
      endsAt: item.endsAt ?? null,
      parentTitle: item.parentTitle ?? null,
      subtitle: item.subtitle ?? null,
      signupCount: item.signupCount ?? null,
      slotsNeeded: item.slotsNeeded ?? null,
      committedCount: item.committedCount ?? null,
      minimumParticipants: item.minimumParticipants ?? null
    };
  }

  function syncRadiusToMapAt(
    lat: number,
    lon: number,
    onComplete?: () => void
  ) {
    if (!adapter) {
      onComplete?.();
      return;
    }

    beginRadiusSync();
    // Always jump camera to the chosen center first so desktop search/select
    // cannot leave only the marker updated while the viewport stays put.
    const zoomHint =
      radiusKm === GLOBAL_RADIUS_VALUE
        ? WORLD_ZOOM
        : effectiveRadiusKm(radiusKm) <= 25
          ? 12
          : effectiveRadiusKm(radiusKm) <= 100
            ? 10
            : 8;
    adapter.setViewport({
      center: { latitude: lat, longitude: lon },
      zoom: zoomHint
    });
    adapter.setCenterMarker?.({ latitude: lat, longitude: lon });
    const radiusForOverlay = effectiveRadiusKm(radiusKm);
    if (radiusKm !== GLOBAL_RADIUS_VALUE && radiusForOverlay != null) {
      currentRadiusKm = radiusForOverlay;
      adapter.setRadiusCircle?.({ latitude: lat, longitude: lon }, radiusForOverlay);
    } else {
      adapter.clearRadiusCircle?.();
    }

    if (radiusKm === GLOBAL_RADIUS_VALUE) {
      endRadiusSync();
      onComplete?.();
    } else {
      adapter.fitToRadius?.(
        { latitude: lat, longitude: lon },
        effectiveRadiusKm(radiusKm),
        () => {
          endRadiusSync();
          onComplete?.();
        }
      );
    }
  }

  function syncRadiusToMap(onComplete?: () => void) {
    if (centerLat == null || centerLon == null) {
      onComplete?.();
      return;
    }
    syncRadiusToMapAt(centerLat, centerLon, onComplete);
  }

  function scheduleLoadMarkers(coords?: { lat: number; lon: number; radiusKm?: number }) {
    if (!active) {
      return;
    }
    if (loadDebounce) {
      clearTimeout(loadDebounce);
    }
    loadDebounce = setTimeout(() => {
      void loadMarkers(coords);
    }, 180);
  }

  async function mountMapIfNeeded(coords?: { lat: number; lon: number }) {
    if (!mapContainer || mapMounted) {
      return;
    }

    const lat = coords?.lat ?? centerLat;
    const lon = coords?.lon ?? centerLon;
    const centered = lat != null && lon != null;
    const center = centered ? { latitude: lat, longitude: lon } : WORLD_CENTER;
    const zoom = centered ? LOCAL_ZOOM : WORLD_ZOOM;

    adapter = createMapAdapter();
    adapter.setErrorHandler?.((message) => {
      mapTileError = explainMapTileError(message);
    });
    adapter.onViewportChange?.((viewport) => {
      if (!active || syncingFromRadius || mapStageTransitioning || suppressViewportLoads) {
        return;
      }
      const viewportKey = `${viewport.center.latitude.toFixed(3)}:${viewport.center.longitude.toFixed(3)}:${Math.round(viewport.radiusKm)}`;
      if (viewportKey === lastViewportLoadKey) {
        return;
      }
      lastViewportLoadKey = viewportKey;
      viewportPanActive = true;
      viewportRadiusKm = viewport.radiusKm;
      if (!syncingFromRadius) {
        currentRadiusKm = viewport.radiusKm;
        syncRadiusOverlay();
        syncRadiusComboboxFromViewport(viewport.radiusKm);
      }
      scheduleLoadMarkers({
        lat: viewport.center.latitude,
        lon: viewport.center.longitude,
        radiusKm: viewport.radiusKm
      });
    });

    try {
      await adapter.mount(mapContainer, { center, zoom });
      mapMounted = true;
    } catch (error) {
      mapTileError = explainMapTileError(
        error instanceof Error ? error.message : 'Map tiles could not be loaded.'
      );
    }
  }

  async function applyMarkersToMap(centered: boolean) {
    adapter?.setMarkers(centered ? markers : []);
    await tick();
    // Re-apply after layout settles so markers aren't lost during resize/fit races.
    window.setTimeout(() => {
      adapter?.setMarkers(centered ? markers : []);
      syncRadiusOverlay();
    }, 120);
    pauseViewportLoads(350);
  }

  async function loadMarkers(coords?: { lat: number; lon: number; radiusKm?: number }) {
    const queryLat = coords?.lat ?? centerLat;
    const queryLon = coords?.lon ?? centerLon;
    const centered = queryLat != null && queryLon != null;
    const panLoad = viewportPanActive && coords?.lat != null && coords?.lon != null;
    const distanceFromLat = panLoad && centerLat != null ? centerLat : undefined;
    const distanceFromLon = panLoad && centerLon != null ? centerLon : undefined;
    const loadToken = ++markerLoadToken;

    await mountMapIfNeeded(
      coords ?? (queryLat != null && queryLon != null ? { lat: queryLat, lon: queryLon } : undefined)
    );

    if (!centered) {
      markers = [];
      listItems = [];
      await applyMarkersToMap(false);
      return;
    }

    const queryRadius =
      coords?.radiusKm ??
      (viewportPanActive && viewportRadiusKm != null
        ? viewportRadiusKm
        : currentRadiusKm ?? effectiveRadiusKm(radiusKm));
    const showLoadingState = listItems.length === 0;
    if (showLoadingState) {
      loading = true;
    }
    errorMessage = '';
    try {
      const items = await getMapMarkers({
        lat: queryLat,
        lon: queryLon,
        radiusKm: queryRadius,
        distanceFromLat,
        distanceFromLon,
        window: windowFilter,
        filter: entityFilter,
        dateFrom: showCustomDates ? dateFrom || undefined : undefined,
        dateTo: showCustomDates ? dateTo || undefined : undefined,
        upcomingOnly,
        tz: $displayTimezone || null
      });
      if (loadToken !== markerLoadToken) {
        return;
      }
      markers = items.map(mapMarkerFromItem);
      listItems = sortListItemsBySchedule(items.map(listItemFromMarker));
      await applyMarkersToMap(true);
      syncRadiusOverlay();
    } catch (error) {
      if (loadToken !== markerLoadToken) {
        return;
      }
      errorMessage = error instanceof Error ? error.message : 'Could not load map markers';
    } finally {
      if (loadToken === markerLoadToken) {
        loading = false;
      }
    }
  }

  function handleRadiusChange(event: CustomEvent<{ value: string }>) {
    radiusKm = event.detail.value;
    resetViewportQuery();
    persistFilters();
    syncRadiusToMap(() => {
      updateCurrentRadiusFromViewport();
      scheduleLoadMarkers();
    });
  }

  function handleFilterChange() {
    resetViewportQuery();
    persistFilters();
    scheduleLoadMarkers();
  }

  function toggleUpcomingOnly() {
    upcomingOnly = !upcomingOnly;
    resetViewportQuery();
    persistFilters();
    scheduleLoadMarkers();
  }

  async function toggleMapFullscreen() {
    mapFullscreen = !mapFullscreen;
    customDateOpen = false;
    fullscreenSearchOpen = false;
    updateMapStageHeight();
    await tick();
    adapter?.resize?.();
  }

  function syncMapStageAfterLayoutChange() {
    updateMapStageHeight();
    scheduleMapResize();
  }

  function persistCenter(options?: { deviceGeolocationEnabled?: boolean }) {
    const previous = readDefaultLocation(viewerId());
    writeDefaultLocation(viewerId(), {
      displayLabel: locationValue.displayLabel,
      latitude: locationValue.latitude,
      longitude: locationValue.longitude,
      region: locationValue.region,
      country: locationValue.country,
      precision: locationValue.precision,
      providerPlaceId: locationValue.providerPlaceId,
      locationId: locationValue.locationId,
      deviceGeolocationEnabled:
        options?.deviceGeolocationEnabled ?? previous?.deviceGeolocationEnabled ?? false
    });
  }

  /**
   * Canonical path for search selection + GPS: one anchor drives label, pin,
   * radius, camera, and marker queries together.
   */
  async function applyAnchor(
    next: LocationPickerValue,
    options?: { deviceGeolocationEnabled?: boolean; broadenEmpty?: boolean }
  ) {
    if (next.latitude == null || next.longitude == null) {
      locationValue = next;
      persistCenter(options);
      return;
    }

    const lat = next.latitude;
    const lon = next.longitude;
    locationValue = next;
    resetViewportQuery();
    persistCenter(options);
    fullscreenSearchOpen = false;

    await mountMapIfNeeded({ lat, lon });
    await tick();
    // Draw pin + radius immediately at the chosen place (don't wait for camera settle).
    currentRadiusKm = effectiveRadiusKm(radiusKm);
    syncRadiusOverlay({ lat, lon });
    await new Promise<void>((resolve) => {
      syncRadiusToMapAt(lat, lon, resolve);
    });
    updateCurrentRadiusFromViewport();
    syncRadiusOverlay({ lat, lon });

    if (options?.broadenEmpty) {
      await loadMarkersWithInitialBroadening({ lat, lon });
    } else {
      await loadMarkers({ lat, lon });
    }
  }

  function handleLocationChange(event: CustomEvent<LocationPickerValue>) {
    void applyAnchor(event.detail, { broadenEmpty: true });
  }

  async function useDeviceCenter() {
    clearLocationToast();
    setDeviceGeolocationEnabled(viewerId(), true);
    const result = await requestDevicePosition(viewerId());
    if (!result.ok) {
      showLocationToast(devicePositionErrorMessage(result.error));
      return;
    }
    await applyAnchor(
      {
        ...emptyLocationPickerValue(),
        displayLabel: result.label,
        latitude: result.position.latitude,
        longitude: result.position.longitude,
        providerPlaceId: result.providerPlaceId,
        region: result.region,
        country: result.country,
        locationId: null
      },
      { deviceGeolocationEnabled: true, broadenEmpty: true }
    );
  }

  async function tryIpCenter() {
    try {
      const [hint] = await getIpLocationHint();
      if (!hint || hint.latitude == null || hint.longitude == null) {
        return false;
      }
      locationValue = {
        ...emptyLocationPickerValue(),
        displayLabel: hint.displayLabel,
        latitude: hint.latitude,
        longitude: hint.longitude,
        region: hint.region,
        country: hint.country,
        precision: hint.precision,
        providerPlaceId: hint.providerPlaceId,
        locationId: null
      };
      persistCenter();
      return true;
    } catch {
      // IP hint unavailable on localhost or when not configured.
      return false;
    }
  }

  async function tryDeviceCenterQuietly() {
    if (!isDeviceGeolocationEnabled(viewerId())) {
      return false;
    }
    const result = await requestDevicePosition(viewerId());
    if (!result.ok) {
      return false;
    }
    locationValue = {
      ...emptyLocationPickerValue(),
      displayLabel: result.label,
      latitude: result.position.latitude,
      longitude: result.position.longitude,
      providerPlaceId: result.providerPlaceId,
      region: result.region,
      country: result.country,
      locationId: null
    };
    persistCenter({ deviceGeolocationEnabled: true });
    return true;
  }

  function applyWorldFallbackCenter() {
    locationValue = {
      ...emptyLocationPickerValue(),
      displayLabel: 'Worldwide',
      latitude: WORLD_CENTER.latitude,
      longitude: WORLD_CENTER.longitude,
      precision: 'approximate'
    };
    radiusKm = GLOBAL_RADIUS_VALUE;
  }

  async function resolveInitialCenter() {
    const saved =
      (await hydrateDefaultLocationFromServer(viewerId())) ?? readDefaultLocation(viewerId());
    if (saved?.latitude != null && saved?.longitude != null) {
      locationValue = {
        ...emptyLocationPickerValue(),
        displayLabel: saved.displayLabel,
        latitude: saved.latitude,
        longitude: saved.longitude,
        region: saved.region,
        country: saved.country,
        precision: saved.precision,
        providerPlaceId: saved.providerPlaceId,
        locationId: saved.locationId
      };
      return;
    }

    if (await tryIpCenter()) {
      return;
    }

    if (await tryDeviceCenterQuietly()) {
      return;
    }

    applyWorldFallbackCenter();
  }

  async function loadMarkersWithInitialBroadening(coords: { lat: number; lon: number }) {
    await loadMarkers(coords);
    if (listItems.length > 0) {
      return;
    }

    const narrowWindow =
      windowFilter === 'today' || windowFilter === 'week' || windowFilter === 'month';
    if (!narrowWindow && entityFilter === 'all') {
      return;
    }

    // First paint came back empty under a narrow saved filter — broaden once so the
    // map is usable without requiring a manual filter change.
    windowFilter = 'all';
    entityFilter = 'all';
    persistFilters();
    await loadMarkers(coords);
  }

  function openRegionalFeed() {
    const params = new URLSearchParams();
    params.set('scope', 'region');
    if (hasCenter) {
      params.set('lat', String(centerLat));
      params.set('lon', String(centerLon));
    }
    if (locationValue.displayLabel?.trim()) {
      params.set('place', locationValue.displayLabel.trim());
    }
    params.set('radius', radiusForUrl(radiusKm));
    params.set('window', windowFilter);
    params.set('filter', entityFilter);
    if ($displayTimezone) {
      params.set('tz', $displayTimezone);
    }
    void goto(`/?${params.toString()}`);
    dispatch('close');
  }

  function handleWindowResize() {
    updateMapStageHeight();
    scheduleMapResize();
    if (customDateOpen) {
      void positionCustomDateMenu();
    }
  }

  function handleDocumentClick(event: MouseEvent) {
    const target = event.target as Node;
    if (
      customDateOpen &&
      customDateWrap &&
      !customDateWrap.contains(target) &&
      customDateMenuEl &&
      !customDateMenuEl.contains(target)
    ) {
      customDateOpen = false;
    }
  }

  onMount(() => {
    document.addEventListener('click', handleDocumentClick);
    const media = window.matchMedia('(max-width: 760px)');
    const syncMobile = () => {
      isMobile = media.matches;
      syncMapStageAfterLayoutChange();
    };
    syncMobile();
    media.addEventListener('change', syncMobile);
    window.addEventListener('resize', handleWindowResize);

    void (async () => {
      const savedPrefs = readMapPreferences(viewerId());
      if (savedPrefs) {
        radiusKm = savedPrefs.radiusKm;
        windowFilter = savedPrefs.windowFilter || 'all';
        entityFilter = savedPrefs.entityFilter || 'all';
        upcomingOnly = savedPrefs.upcomingOnly;
      }

      await resolveInitialCenter();
      await tick();
      if (locationValue.latitude != null && locationValue.longitude != null) {
        await mountMapIfNeeded({
          lat: locationValue.latitude,
          lon: locationValue.longitude
        });
        await new Promise<void>((resolve) => {
          syncRadiusToMap(resolve);
        });
        updateCurrentRadiusFromViewport();
        await loadMarkersWithInitialBroadening({
          lat: locationValue.latitude,
          lon: locationValue.longitude
        });
      } else {
        await mountMapIfNeeded();
      }
      updateMapStageHeight();
      await tick();
      adapter?.resize?.();
    })();

    return () => {
      document.removeEventListener('click', handleDocumentClick);
      media.removeEventListener('change', syncMobile);
      window.removeEventListener('resize', handleWindowResize);
    };
  });

  onDestroy(() => {
    if (loadDebounce) {
      clearTimeout(loadDebounce);
    }
    if (locationToastTimer) {
      clearTimeout(locationToastTimer);
    }
    if (radiusSyncTimer) {
      clearTimeout(radiusSyncTimer);
    }
    if (mapResizeDebounce) {
      clearTimeout(mapResizeDebounce);
    }
    if (suppressViewportLoadsTimer) {
      clearTimeout(suppressViewportLoadsTimer);
    }
    adapter?.destroy();
    adapter = null;
    mapMounted = false;
  });

  export async function refreshMap() {
    if (!active) {
      return;
    }
    await tick();
    if (locationValue.latitude == null || locationValue.longitude == null) {
      await resolveInitialCenter();
    }
    if (locationValue.latitude != null && locationValue.longitude != null) {
      if (!mapMounted) {
        await mountMapIfNeeded({
          lat: locationValue.latitude,
          lon: locationValue.longitude
        });
        await new Promise<void>((resolve) => {
          syncRadiusToMap(resolve);
        });
      }
      updateCurrentRadiusFromViewport();
      await loadMarkersWithInitialBroadening({
        lat: locationValue.latitude,
        lon: locationValue.longitude
      });
    } else {
      await mountMapIfNeeded();
    }
    updateMapStageHeight();
    adapter?.resize?.();
  }
</script>

<section class="map-panel" class:embedded class:map-panel-fullscreen={mapFullscreen}>
  {#if mapTileError}
    <p class="inline-alert" role="alert">{mapTileError}</p>
  {/if}

  <div class="layout" class:layout-fullscreen={mapFullscreen}>
    <div class="map-column">
      <div
        class="map-stage"
        class:map-stage-fullscreen={mapFullscreen}
        class:map-stage-animated={isMobile && !mapFullscreen && mapStageHeightPx > 0}
        style={mapStageStyle}
        on:transitionstart={handleMapStageTransitionStart}
        on:transitionend={handleMapStageTransitionEnd}
      >
        <div class="map-surface" bind:this={mapContainer} role="presentation"></div>

        {#if locationToast}
          <div class="location-toast" role="alert">{locationToast}</div>
        {/if}

        <button
          aria-label={mapFullscreen ? 'Exit fullscreen map' : 'Fullscreen map'}
          class="fullscreen-button"
          type="button"
          on:click={() => void toggleMapFullscreen()}
        >
          <FeedToolbarIcon name={mapFullscreen ? 'compress' : 'expand'} />
        </button>

        {#if showMapOverlayFilters && fullscreenSearchOpen}
          <div class="fullscreen-search">
            <LocationPicker
              bind:value={locationValue}
              compact
              elevated
              preferAbove
              preserveCoordsWhileEditing
              portaled
              modes={['physical']}
              persistOnSelect={false}
              placeholder="Place"
              on:change={handleLocationChange}
              on:error={(event) => {
                showLocationToast(event.detail);
              }}
            />
          </div>
        {/if}

        {#if showMapOverlayFilters}
          <div class="filter-panel filter-panel-overlay" aria-label="Map filters">
            <button
              aria-expanded={fullscreenSearchOpen}
              aria-label="Search place"
              class="icon-button filter-icon-button"
              type="button"
              on:click={() => {
                fullscreenSearchOpen = !fullscreenSearchOpen;
              }}
            >
              <FeedToolbarIcon name="search" />
            </button>
            <button
              aria-label="Use my location"
              class="icon-button filter-icon-button locate-overlay"
              type="button"
              on:click={() => void useDeviceCenter()}
            >
              <FeedToolbarIcon name="locate" />
            </button>
            <RadiusCombobox
              bind:value={radiusKm}
              ariaLabel="Snap map to radius"
              options={radiusPresetOptions}
              compact
              portaled
              preferAbove
              on:change={handleRadiusChange}
            />
            <button
              aria-label="Upcoming only"
              aria-pressed={upcomingOnly}
              class="icon-button filter-icon-button"
              class:active={upcomingOnly}
              type="button"
              on:click={toggleUpcomingOnly}
            >
              <FeedToolbarIcon name={upcomingOnly ? 'calendar' : 'calendar-x'} />
            </button>
            <IconMenuButton
              bind:value={windowFilter}
              ariaLabel="Map time window"
              defaultValue="today"
              options={windowOptions}
              portaled
              preferAbove
              on:change={handleFilterChange}
            >
              <FeedToolbarIcon name="clock" />
            </IconMenuButton>
            {#if showCustomDates}
              <div bind:this={customDateWrap} class="custom-date-wrap">
                <button
                  bind:this={customDateButton}
                  aria-expanded={customDateOpen}
                  aria-label="Custom date range"
                  class="icon-button filter-icon-button"
                  class:active={customDateOpen}
                  type="button"
                  on:click|stopPropagation={() => {
                    customDateOpen = !customDateOpen;
                    if (customDateOpen) {
                      void positionCustomDateMenu();
                    }
                  }}
                >
                  <FeedToolbarIcon name="calendar-range" />
                </button>
              </div>
            {/if}
            <IconMenuButton
              bind:value={entityFilter}
              ariaLabel="Map entity filter"
              defaultValue="all"
              options={filterOptions}
              portaled
              preferAbove
              on:change={handleFilterChange}
            >
              <FeedToolbarIcon name="filter" />
            </IconMenuButton>
            <button
              aria-label="Open as list"
              class="icon-button filter-icon-button"
              disabled={!hasCenter}
              type="button"
              on:click={openRegionalFeed}
            >
              <FeedToolbarIcon name="list" />
            </button>
          </div>
        {/if}
      </div>

      {#if !mapFullscreen}
        <div class="filter-bar filter-bar-desktop" aria-label="Map filters">
          <div class="place-field place-field-desktop">
            <LocationPicker
              bind:value={locationValue}
              compact
              elevated
              preferAbove
              preserveCoordsWhileEditing
              portaled
              modes={['physical']}
              persistOnSelect={false}
              placeholder="Place"
              on:change={handleLocationChange}
              on:error={(event) => {
                showLocationToast(event.detail);
              }}
            />
          </div>
          <button
            aria-label="Use my location"
            class="icon-button locate-desktop"
            type="button"
            on:click={() => void useDeviceCenter()}
          >
            <FeedToolbarIcon name="locate" />
          </button>
          <RadiusCombobox
            bind:value={radiusKm}
            ariaLabel="Snap map to radius"
            options={radiusPresetOptions}
            portaled
            preferAbove
            on:change={handleRadiusChange}
          />
          <button
            aria-label="Upcoming only"
            aria-pressed={upcomingOnly}
            class="icon-button filter-icon-button"
            class:active={upcomingOnly}
            type="button"
            on:click={toggleUpcomingOnly}
          >
            <FeedToolbarIcon name={upcomingOnly ? 'calendar' : 'calendar-x'} />
          </button>
          <IconMenuButton
            bind:value={windowFilter}
            ariaLabel="Map time window"
            defaultValue="today"
            options={windowOptions}
            portaled
            preferAbove
            on:change={handleFilterChange}
          >
            <FeedToolbarIcon name="clock" />
          </IconMenuButton>
          {#if showCustomDates}
            <div bind:this={customDateWrap} class="custom-date-wrap">
              <button
                bind:this={customDateButton}
                aria-expanded={customDateOpen}
                aria-label="Custom date range"
                class="icon-button filter-icon-button"
                class:active={customDateOpen}
                type="button"
                on:click|stopPropagation={() => {
                  customDateOpen = !customDateOpen;
                  if (customDateOpen) {
                    void positionCustomDateMenu();
                  }
                }}
              >
                <FeedToolbarIcon name="calendar-range" />
              </button>
            </div>
          {/if}
          <IconMenuButton
            bind:value={entityFilter}
            ariaLabel="Map entity filter"
            defaultValue="all"
            options={filterOptions}
            portaled
            preferAbove
            on:change={handleFilterChange}
          >
            <FeedToolbarIcon name="filter" />
          </IconMenuButton>
          <button
            aria-label="Open as list"
            class="icon-button filter-icon-button"
            disabled={!hasCenter}
            type="button"
            on:click={openRegionalFeed}
          >
            <FeedToolbarIcon name="list" />
          </button>
        </div>
      {/if}
    </div>

    {#if !mapFullscreen}
      <section
        bind:this={listPanelEl}
        class="list-panel"
        aria-label="Map results list"
        on:scroll={handleListScroll}
      >
        {#if loading && listItems.length === 0}
          <p class="empty-state">Loading markers…</p>
        {:else if errorMessage}
          <p class="empty-state" role="alert">{errorMessage}</p>
        {:else if !hasCenter}
          <p class="empty-state">Search a place, use device location, or set a default in Settings to load map pins.</p>
        {:else if listItems.length === 0}
          <p class="empty-state">No physical map-eligible items in this radius for the selected time.</p>
        {:else}
          <div class="card-list">
            {#each listItems as item, index (item.id)}
              <MapDiscoveryCard
                id={item.id}
                title={item.title}
                href={item.href}
                distanceKm={item.distanceKm}
                entityType={item.entityType}
                activitySource={item.activitySource}
                projectMode={item.projectMode}
                parentTitle={item.parentTitle}
                subtitle={item.subtitle}
                displayLabel={item.displayLabel}
                scheduledAt={item.scheduledAt}
                endsAt={item.endsAt}
                signupCount={item.signupCount}
                slotsNeeded={item.slotsNeeded}
                committedCount={item.committedCount}
                minimumParticipants={item.minimumParticipants}
                isPast={!upcomingOnly && isPastScheduled(item.scheduledAt)}
                isLast={index === listItems.length - 1}
                highlighted={highlightedMarkerId === item.id}
                on:hover={(event) => handleListItemHover(event.detail.id)}
                on:leave={handleListItemLeave}
                on:select={(event) => handleListItemSelect(event.detail.id)}
                on:close={() => dispatch('close')}
              />
            {/each}
          </div>
        {/if}
      </section>
    {/if}
  </div>
</section>

{#if customDateOpen && customDateButton}
  <div
    bind:this={customDateMenuEl}
    class="custom-date-menu custom-date-menu-portaled"
    role="group"
    aria-label="Custom date range"
    style={customDateMenuStyle}
    use:portal={'body'}
  >
    <label class="custom-date-field">
      <span>From</span>
      <input class="date-input" type="date" bind:value={dateFrom} on:change={handleFilterChange} />
    </label>
    <label class="custom-date-field">
      <span>To</span>
      <input class="date-input" type="date" bind:value={dateTo} on:change={handleFilterChange} />
    </label>
  </div>
{/if}

<style>
  .map-panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
    height: 100%;
  }

  .map-panel.embedded {
    height: 100%;
    max-height: 100%;
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(220px, 0.8fr);
    gap: 12px;
    min-height: 0;
    flex: 1 1 auto;
    height: 100%;
  }

  .layout.layout-fullscreen {
    grid-template-columns: 1fr;
  }

  .map-column {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
    min-width: 0;
    flex: 1 1 auto;
  }

  .map-stage {
    position: relative;
    flex: 1 1 auto;
    min-height: 200px;
    border: 1px solid var(--panel-border);
    border-radius: 12px;
    overflow: hidden;
    background: var(--panel-soft);
  }

  .map-stage.map-stage-animated {
    transition: height 0.18s ease;
  }

  .map-stage.map-stage-fullscreen {
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
  }

  .map-surface {
    position: absolute;
    inset: 0;
  }

  .fullscreen-button {
    position: absolute;
    top: 10px;
    right: 48px;
    z-index: 12;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    background: color-mix(in srgb, var(--panel) 94%, transparent);
    color: var(--text-muted);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }

  .location-toast {
    position: absolute;
    top: 10px;
    left: 50%;
    z-index: 14;
    transform: translateX(-50%);
    max-width: min(92%, 360px);
    padding: 8px 12px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--panel-strong) 96%, #111 4%);
    border: 1px solid var(--panel-border);
    color: var(--danger, #c0392b);
    font-size: 12px;
    line-height: 1.4;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
    pointer-events: none;
  }

  .filter-panel-overlay {
    position: absolute;
    left: 8px;
    right: 8px;
    bottom: 8px;
    z-index: 11;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 4px;
    padding: 6px 8px;
    border: 1px solid color-mix(in srgb, var(--panel-border) 80%, transparent);
    border-radius: 12px;
    background: color-mix(in srgb, var(--panel) 90%, transparent);
    backdrop-filter: blur(6px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    overflow-x: auto;
    scrollbar-width: none;
  }

  .filter-panel-overlay::-webkit-scrollbar {
    display: none;
  }

  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    row-gap: 6px;
    flex-shrink: 0;
    min-width: 0;
  }

  .filter-bar-desktop {
    display: flex;
  }

  @media (max-width: 900px) {
    .filter-bar-desktop {
      display: none;
    }
  }
  .place-field {
    flex: 1 1 auto;
    min-width: 0;
    position: relative;
    z-index: 20;
  }

  .place-field-desktop,
  .locate-desktop {
    display: none;
  }

  @media (min-width: 901px) {
    .place-field-desktop {
      display: block;
      flex: 0 1 140px;
      max-width: 140px;
      min-width: 88px;
    }

    .place-field-desktop :global(input) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .locate-desktop {
      display: inline-flex;
    }
  }

  .locate-overlay {
    display: inline-flex;
  }

  @media (min-width: 901px) {
    .locate-overlay {
      display: none;
    }
  }

  .icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    background: color-mix(in srgb, var(--panel) 92%, transparent);
    color: var(--text-muted);
    cursor: pointer;
  }

  .icon-button.active {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .icon-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .filter-icon-button {
    background: color-mix(in srgb, var(--panel) 92%, transparent);
  }

  .date-input {
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    background: color-mix(in srgb, var(--panel) 92%, transparent);
    color: var(--text);
    padding: 6px 8px;
    font: inherit;
    font-size: 12px;
    flex-shrink: 0;
  }

  .custom-date-wrap {
    position: relative;
    flex-shrink: 0;
  }

  .custom-date-menu {
    display: grid;
    gap: 8px;
    min-width: 200px;
    padding: 10px;
    border: 1px solid var(--panel-border);
    border-radius: 10px;
    background: var(--panel-soft);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.14);
  }

  .custom-date-menu-portaled {
    position: fixed;
    z-index: 80;
  }

  .custom-date-field {
    display: grid;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
  }

  .fullscreen-search {
    position: absolute;
    left: 8px;
    right: 8px;
    bottom: 56px;
    z-index: 13;
    padding: 8px;
    border: 1px solid var(--panel-border);
    border-radius: 10px;
    background: var(--panel);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
  }

  .list-panel {
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
    overflow-anchor: none;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    border: 1px solid var(--panel-border);
    border-radius: 12px;
    background: var(--panel);
  }

  .card-list {
    min-width: 0;
  }

  .empty-state {
    margin: 0;
    padding: 12px;
    color: var(--text-muted);
    font-size: 13px;
  }

  .inline-alert {
    margin: 0;
    color: var(--danger, #c0392b);
    font-size: 13px;
    flex-shrink: 0;
  }

  @media (max-width: 900px) {
    .layout {
      grid-template-columns: 1fr;
      grid-template-rows: auto minmax(0, 1fr);
    }

    .list-panel {
      min-height: 0;
    }
  }

  @media (max-width: 760px) {
    .map-stage {
      border-radius: 10px;
    }

    .list-panel {
      border-radius: 10px;
    }

    .map-panel:not(.embedded) {
      height: 100%;
      max-height: 100%;
    }

    .layout.layout-fullscreen {
      grid-template-rows: 1fr;
    }
  }

  :global(.sp-map-marker) {
    display: grid;
    gap: 2px;
    max-width: 180px;
    padding: 6px 10px;
    border: 2px solid color-mix(in srgb, var(--sp-map-marker-color) 80%, #000 10%);
    border-radius: 10px;
    background: color-mix(in srgb, var(--sp-map-marker-color) 18%, white 82%);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
    color: #111827;
    cursor: pointer;
    text-align: left;
    font: inherit;
    line-height: 1.2;
  }

  :global(.sp-map-marker__parent) {
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :global(.sp-map-marker__title) {
    font-size: 10px;
    font-weight: 500;
    color: #374151;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :global(.sp-map-marker__title--solo) {
    font-size: 11px;
    font-weight: 700;
    color: #111827;
  }

  :global(.sp-map-marker__status) {
    font-size: 10px;
    font-weight: 600;
    color: #4b5563;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :global(.sp-map-marker--grouped) {
    max-width: 200px;
    gap: 4px;
  }

  :global(.sp-map-marker__children) {
    display: grid;
    gap: 3px;
    margin-top: 2px;
    padding-top: 4px;
    border-top: 1px solid color-mix(in srgb, var(--sp-map-marker-color) 35%, transparent);
  }

  :global(.sp-map-marker__child) {
    display: block;
    max-width: 100%;
    padding: 3px 6px 3px 8px;
    border-left: 3px solid var(--sp-map-marker-child-color, #2563eb);
    border-radius: 4px;
    background: color-mix(in srgb, var(--sp-map-marker-child-color, #2563eb) 12%, white 88%);
    font-size: 10px;
    font-weight: 600;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
  }

  :global(.sp-map-marker__child:hover),
  :global(.sp-map-marker__child--highlighted) {
    background: color-mix(in srgb, var(--sp-map-marker-child-color, #2563eb) 28%, white 72%);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--sp-map-marker-child-color, #2563eb) 55%, transparent);
  }

  :global(.sp-map-marker--highlighted) {
    transform: scale(1.08);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--sp-map-marker-color) 45%, transparent),
      0 6px 16px rgba(0, 0, 0, 0.24);
    z-index: 5;
  }

  :global(.sp-map-marker--dot) {
    width: 14px;
    height: 14px;
    min-width: 14px;
    min-height: 14px;
    padding: 0;
    border-radius: 999px;
    border: 2px solid color-mix(in srgb, var(--sp-map-marker-color) 80%, #000 10%);
    background: var(--sp-map-marker-color);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  :global(.sp-map-marker--dot .sp-map-marker__parent),
  :global(.sp-map-marker--dot .sp-map-marker__title),
  :global(.sp-map-marker--dot .sp-map-marker__children),
  :global(.sp-map-marker--dot .sp-map-marker__status) {
    display: none;
  }

  :global(.sp-map-center-marker) {
    width: 18px;
    height: 18px;
    border: 2px solid #1d4ed8;
    border-radius: 999px 999px 999px 0;
    background: #3b82f6;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    transform: rotate(-45deg);
  }
</style>
