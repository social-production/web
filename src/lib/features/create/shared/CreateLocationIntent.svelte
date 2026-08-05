<script lang="ts">
  import LocationPicker from '$lib/components/shared/LocationPicker.svelte';
  import {
    emptyLocationPickerValue,
    onlineLocationPickerValue,
    type LocationPickerValue
  } from '$lib/types/locationPicker';

  export let intent: 'physical' | 'online' | 'later' = 'later';
  export let locationValue: LocationPickerValue = emptyLocationPickerValue();
  export let allowOnline = true;
  export let helperText =
    'A physical location helps people discover this on the map. You can change it later.';

  $: if (intent === 'online') {
    locationValue = onlineLocationPickerValue();
  } else if (intent === 'later') {
    locationValue = emptyLocationPickerValue();
  } else if (intent === 'physical' && locationValue.mode !== 'physical') {
    locationValue = emptyLocationPickerValue('physical');
  }
</script>

<div class="location-intent">
  <p class="helper">{helperText}</p>

  <div class="intent-row" role="radiogroup" aria-label="Location intent">
    <label class="intent-option">
      <input type="radio" name="location-intent" value="physical" bind:group={intent} />
      <span>
        <strong>Physical</strong>
        <span class="hint">Discoverable on the map once coordinates are set.</span>
      </span>
    </label>
    {#if allowOnline}
      <label class="intent-option">
        <input type="radio" name="location-intent" value="online" bind:group={intent} />
        <span>
          <strong>Online</strong>
          <span class="hint">Not shown as a map pin.</span>
        </span>
      </label>
    {/if}
    <label class="intent-option">
      <input type="radio" name="location-intent" value="later" bind:group={intent} />
      <span>
        <strong>Decide later</strong>
        <span class="hint">Create now, add a place later. Not map-discoverable yet.</span>
      </span>
    </label>
  </div>

  {#if intent === 'physical'}
    <LocationPicker
      bind:value={locationValue}
      modes={['physical']}
      placeholder="Search a place"
      on:change={(event) => {
        locationValue = event.detail;
      }}
    />
  {/if}
</div>

<style>
  .location-intent {
    display: grid;
    gap: 12px;
  }

  .helper {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.45;
    font-size: 13px;
  }

  .intent-row {
    display: grid;
    gap: 8px;
  }

  .intent-option {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 10px;
    align-items: start;
  }

  .hint {
    display: block;
    margin-top: 2px;
    color: var(--text-soft);
    font-size: 12px;
  }
</style>
