<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
  import { page } from '$app/stores';
  import { searchLocations } from '$lib/services/queries/locations';
  import { createLocation } from '$lib/services/commands/locations';
  import type { LocationRecord } from '$lib/types/location';
  import {
    emptyLocationPickerValue,
    onlineLocationPickerValue,
    type LocationPickerMode,
    type LocationPickerValue,
    type LocationQuickPick
  } from '$lib/types/locationPicker';
  import { debounce } from '$lib/utils/debounce';
  import { portal } from '$lib/utils/portal';

  export let value: LocationPickerValue = emptyLocationPickerValue();
  export let modes: LocationPickerMode[] = ['physical', 'online'];
  export let compact = false;
  export let elevated = false;
  export let placeholder = 'Search a place';
  export let disabled = false;
  export let countryCodes: string | null = null;
  export let viewbox: string | null = null;
  export let persistOnSelect = true;
  export let portaled = false;
  export let preferAbove = false;
  export let preserveCoordsWhileEditing = false;
  export let quickPicks: LocationQuickPick[] = [];

  const dispatch = createEventDispatcher<{
    change: LocationPickerValue;
    error: string;
  }>();

  let query = value.displayLabel;
  let suggestions: LocationRecord[] = [];
  let searching = false;
  let searchError = '';
  let listOpen = false;
  let isEditing = false;
  let syncedSignature = externalSignature(value);
  let searchWrap: HTMLDivElement | null = null;
  let inputElement: HTMLInputElement | null = null;
  let suggestionsElement: HTMLUListElement | null = null;
  let suggestionsStyle = '';

  async function positionSuggestions() {
    if (!inputElement || !suggestionsElement) {
      suggestionsStyle = '';
      return;
    }

    await tick();
    const triggerRect = inputElement.getBoundingClientRect();
    const menuRect = suggestionsElement.getBoundingClientRect();
    const gap = 4;
    const viewportPadding = 8;
    const width = triggerRect.width;

    let top: number;
    let left = triggerRect.left;

    if (preferAbove || portaled) {
      top = triggerRect.top - menuRect.height - gap;
    } else {
      top = triggerRect.bottom + gap;
    }

    if (!preferAbove && top + menuRect.height > window.innerHeight - viewportPadding) {
      top = triggerRect.top - menuRect.height - gap;
    }

    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - width - viewportPadding));
    top = Math.max(viewportPadding, Math.min(top, window.innerHeight - menuRect.height - viewportPadding));

    if (portaled) {
      suggestionsStyle = `top: ${top}px; left: ${left}px; width: ${width}px;`;
    }
  }

  async function schedulePositionAfterOpen() {
    await tick();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void positionSuggestions();
      });
    });
  }

  const debouncedPositionSuggestions = debounce(() => {
    void positionSuggestions();
  }, 50);

  function externalSignature(next: LocationPickerValue): string {
    return `${next.mode}:${next.displayLabel}:${next.locationId ?? ''}:${next.latitude ?? ''}:${next.longitude ?? ''}`;
  }

  $: if (!isEditing) {
    const signature = externalSignature(value);
    if (signature !== syncedSignature) {
      syncedSignature = signature;
      query = value.displayLabel;
    }
  }

  const runSearch = debounce(async (nextQuery: string) => {
    const trimmed = nextQuery.trim();
    if (trimmed.length < 2) {
      suggestions = [];
      searching = false;
      return;
    }

    searching = true;
    searchError = '';
    try {
      suggestions = await searchLocations(trimmed, 8, { countryCodes, viewbox });
      listOpen = suggestions.length > 0;
      if (listOpen) {
        await schedulePositionAfterOpen();
      }
    } catch (error) {
      suggestions = [];
      listOpen = false;
      searchError =
        error instanceof Error && error.message.includes('429')
          ? 'Too many searches. Wait a moment and try again.'
          : 'Could not search places right now.';
      dispatch('error', searchError);
    } finally {
      searching = false;
    }
  }, 300);

  async function persistOnline() {
    const viewer = $page.data.bootstrap?.viewer ?? null;
    if (!persistOnSelect || !viewer) {
      return;
    }

    try {
      const created = await createLocation({
        displayLabel: 'Online',
        isOnline: true,
        precision: 'approximate'
      });
      const locationId = created.id ?? null;
      if (locationId && locationId !== value.locationId) {
        setValue({
          ...onlineLocationPickerValue(),
          locationId
        });
      }
    } catch {
      // Online chip still works without persisted id.
    }
  }

  onDestroy(() => {
    runSearch.cancel();
    debouncedPositionSuggestions.cancel();
  });

  function setValue(next: LocationPickerValue) {
    value = next;
    query = next.displayLabel;
    syncedSignature = externalSignature(next);
    dispatch('change', next);
  }

  async function selectSuggestion(item: LocationRecord) {
    isEditing = false;
    listOpen = false;
    suggestions = [];

    let locationId = item.id ?? null;
    const viewer = $page.data.bootstrap?.viewer ?? null;

    if (persistOnSelect && viewer && !item.isOnline && item.latitude != null && item.longitude != null) {
      try {
        const created = await createLocation({
          providerPlaceId: item.providerPlaceId,
          displayLabel: item.displayLabel,
          latitude: item.latitude,
          longitude: item.longitude,
          region: item.region,
          country: item.country,
          precision: item.precision,
          isOnline: false
        });
        locationId = created.id ?? locationId;
      } catch {
        // Keep search result coords even if persistence fails.
      }
    }

    setValue({
      mode: item.isOnline ? 'online' : 'physical',
      displayLabel: item.displayLabel,
      locationId,
      providerPlaceId: item.providerPlaceId,
      latitude: item.latitude,
      longitude: item.longitude,
      region: item.region,
      country: item.country,
      precision: item.precision,
      isOnline: item.isOnline
    });
  }

  function handleFocus() {
    isEditing = true;
    if (suggestions.length > 0) {
      listOpen = true;
      void schedulePositionAfterOpen();
    }
  }

  function handleInput() {
    isEditing = true;
    listOpen = false;
    void runSearch(query);
  }

  function handleBlur() {
    if (listOpen || searching) {
      return;
    }
    isEditing = false;
    const trimmed = query.trim();
    if (
      trimmed === value.displayLabel.trim() &&
      (value.locationId != null || value.latitude != null)
    ) {
      return;
    }

    if (preserveCoordsWhileEditing) {
      if (!trimmed) {
        return;
      }
      query = value.displayLabel;
      return;
    }

    setValue({
      ...value,
      mode: 'physical',
      displayLabel: trimmed,
      locationId: null,
      providerPlaceId: null,
      latitude: null,
      longitude: null,
      region: null,
      country: null,
      isOnline: false
    });
  }

  function selectMode(mode: LocationPickerMode) {
    isEditing = false;
    if (mode === 'online') {
      const next = onlineLocationPickerValue();
      setValue(next);
      void persistOnline();
      return;
    }
    if (mode === 'tbd') {
      setValue({
        ...emptyLocationPickerValue('tbd'),
        displayLabel: 'To be decided'
      });
      return;
    }
    setValue(emptyLocationPickerValue('physical'));
  }

  function selectQuickPick(pick: LocationQuickPick) {
    isEditing = false;
    listOpen = false;
    suggestions = [];
    setValue({
      ...pick.value,
      mode: 'physical',
      isOnline: false
    });
  }

  function isQuickPickSelected(pick: LocationQuickPick): boolean {
    if (value.mode !== 'physical' || value.isOnline) {
      return false;
    }
    if (pick.value.locationId && value.locationId) {
      return pick.value.locationId === value.locationId;
    }
    return pick.label.trim().toLowerCase() === value.displayLabel.trim().toLowerCase();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') {
      return;
    }
    if (!listOpen || suggestions.length === 0) {
      return;
    }
    event.preventDefault();
    void selectSuggestion(suggestions[0]);
  }

  function handleViewportChange() {
    if (!listOpen || !inputElement) {
      return;
    }
    if (document.activeElement !== inputElement) {
      return;
    }
    debouncedPositionSuggestions();
  }

  onMount(() => {
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  });
</script>

<div class="location-picker" class:compact class:elevated>
  {#if modes.length > 1}
    <div class="mode-row" role="group" aria-label="Location type">
      {#each modes as mode}
        <button
          class="mode-chip"
          class:active={value.mode === mode}
          disabled={disabled}
          type="button"
          on:click={() => selectMode(mode)}
        >
          {mode === 'physical' ? 'Physical' : mode === 'online' ? 'Online' : 'TBD'}
        </button>
      {/each}
    </div>
  {/if}

  {#if value.mode === 'physical'}
    {#if quickPicks.length > 0}
      <div class="quick-picks" role="group" aria-label="Suggested locations">
        {#each quickPicks as pick (pick.id)}
          <button
            class="quick-pick"
            class:active={isQuickPickSelected(pick)}
            disabled={disabled}
            type="button"
            on:click={() => selectQuickPick(pick)}
          >
            <span class="quick-pick-label">{pick.label}</span>
            <span class="quick-pick-source">{pick.sourceLabel}</span>
          </button>
        {/each}
      </div>
    {/if}
    <div class="search-wrap" bind:this={searchWrap}>
      <input
        bind:this={inputElement}
        {disabled}
        {placeholder}
        bind:value={query}
        autocomplete="off"
        on:focus={handleFocus}
        on:input={handleInput}
        on:blur={handleBlur}
        on:keydown={handleKeydown}
      />
      {#if searching}
        <span class="status">Searching…</span>
      {/if}
      {#if searchError}
        <p class="error" role="alert">{searchError}</p>
      {/if}
      {#if listOpen && suggestions.length > 0}
        <ul
          bind:this={suggestionsElement}
          class="suggestions"
          class:portaled
          class:prefer-above={preferAbove && !portaled}
          style={portaled ? suggestionsStyle : undefined}
          use:portal={portaled ? 'body' : false}
        >
          {#each suggestions as suggestion (suggestion.providerPlaceId ?? suggestion.displayLabel)}
            <li>
              <button type="button" on:mousedown|preventDefault on:click={() => void selectSuggestion(suggestion)}>
                {suggestion.displayLabel}
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {:else if value.mode === 'online'}
    <p class="online-chip" aria-live="polite">Online</p>
  {:else}
    <p class="tbd-label">Location will be decided later.</p>
  {/if}
</div>

<style>
  .location-picker {
    display: grid;
    gap: 8px;
    min-width: 0;
    position: relative;
    z-index: 2;
  }

  .location-picker.compact {
    gap: 6px;
  }

  .location-picker.elevated {
    z-index: 50;
  }

  .location-picker.elevated .search-wrap {
    z-index: 51;
  }

  .location-picker.elevated .suggestions {
    z-index: 120;
  }

  .mode-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .mode-chip {
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: transparent;
    color: var(--text-muted);
    font-size: 12px;
    padding: 4px 10px;
    cursor: pointer;
  }

  .mode-chip.active {
    border-color: var(--brand);
    color: var(--brand-strong);
    background: var(--brand-soft);
  }

  .quick-picks {
    display: grid;
    gap: 6px;
  }

  .quick-pick {
    display: grid;
    gap: 2px;
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-main);
    text-align: left;
    cursor: pointer;
    font: inherit;
  }

  .quick-pick.active {
    border-color: var(--brand);
    background: var(--brand-soft);
  }

  .quick-pick-label {
    font-size: 13px;
    font-weight: 600;
  }

  .quick-pick-source {
    font-size: 11px;
    color: var(--text-soft);
  }

  .search-wrap {
    position: relative;
    min-width: 0;
    z-index: 3;
  }

  input {
    width: 100%;
    min-width: 0;
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    background: var(--panel);
    color: var(--text);
    padding: 8px 10px;
    font: inherit;
  }

  .compact input {
    padding: 6px 8px;
    font-size: 13px;
  }

  .status {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 11px;
    color: var(--text-muted);
    pointer-events: none;
  }

  .error {
    margin: 4px 0 0;
    font-size: 12px;
    color: var(--danger, #c0392b);
  }

  .suggestions {
    position: absolute;
    z-index: 40;
    left: 0;
    right: 0;
    top: calc(100% + 4px);
    margin: 0;
    padding: 4px;
    list-style: none;
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    background: var(--panel-strong, var(--panel));
    max-height: 220px;
    overflow: auto;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  .suggestions.prefer-above {
    top: auto;
    bottom: calc(100% + 4px);
  }

  .suggestions.portaled {
    position: fixed;
    z-index: 140;
    right: auto;
    top: auto;
    left: auto;
    max-height: min(280px, 40vh);
  }

  .suggestions button {
    width: 100%;
    text-align: left;
    border: none;
    background: transparent;
    color: var(--text);
    padding: 8px;
    border-radius: 6px;
    cursor: pointer;
    font: inherit;
    font-size: 13px;
  }

  .suggestions button:hover {
    background: var(--brand-soft);
  }

  .online-chip {
    margin: 0;
    display: inline-flex;
    align-items: center;
    width: fit-content;
    border: 1px solid var(--brand);
    border-radius: 999px;
    background: var(--brand-soft);
    color: var(--brand-strong);
    font-size: 13px;
    font-weight: 600;
    padding: 6px 12px;
  }

  .tbd-label {
    margin: 0;
    color: var(--text-muted);
    font-size: 13px;
  }
</style>
