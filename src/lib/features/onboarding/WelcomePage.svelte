<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import LocationPicker from '$lib/components/shared/LocationPicker.svelte';
  import SearchableSelect from '$lib/components/shared/SearchableSelect.svelte';
  import { updateSettings } from '$lib/services/commands/account';
  import { createLocation } from '$lib/services/commands/locations';
  import { toggleScopeMembership } from '$lib/services/commands/scopes';
  import { getDiscoverScopes } from '$lib/services/queries/scopes';
  import { refreshBootstrap } from '$lib/services/queries/bootstrap';
  import { errorMessage } from '$lib/services/errors';
  import { persistDefaultLocationToServer } from '$lib/location/sync';
  import {
    getDisplayTimezone,
    listDisplayTimezones,
    setDisplayTimezone,
  } from '$lib/stores/timezoneStore';
  import { showToast } from '$lib/stores/toast';
  import type { DiscoverScopeItem } from '$lib/types/bootstrap';
  import { emptyLocationPickerValue, type LocationPickerValue } from '$lib/types/locationPicker';

  /** First visit after sign-up: time zone and area, a few channels, then how voting works. */
  const steps = ['Where you are', 'Channels', 'How it works'] as const;
  let step = 0;
  let busy = false;

  let timezone = getDisplayTimezone();
  let locationValue: LocationPickerValue = emptyLocationPickerValue();
  const timezoneOptions = listDisplayTimezones().map((zone) => ({ value: zone, label: zone }));

  let channels: DiscoverScopeItem[] = [];
  let channelsLoaded = false;
  let joining: string | null = null;

  onMount(async () => {
    try {
      channels = (await getDiscoverScopes('channel')).slice(0, 8);
    } catch {
      channels = [];
    } finally {
      channelsLoaded = true;
    }
  });

  async function saveWhere() {
    busy = true;
    try {
      await updateSettings({ displayTimezone: timezone || null });
      setDisplayTimezone(timezone || null);
      const viewerId = $page.data.bootstrap?.viewer?.id ?? null;
      if (locationValue.latitude != null && locationValue.longitude != null) {
        const created = locationValue.locationId
          ? { id: locationValue.locationId }
          : await createLocation({
              providerPlaceId: locationValue.providerPlaceId,
              displayLabel: locationValue.displayLabel,
              latitude: locationValue.latitude,
              longitude: locationValue.longitude,
              region: locationValue.region,
              country: locationValue.country,
              precision: locationValue.precision,
              isOnline: false,
            });
        await persistDefaultLocationToServer(viewerId, {
          displayLabel: locationValue.displayLabel,
          latitude: locationValue.latitude,
          longitude: locationValue.longitude,
          region: locationValue.region,
          country: locationValue.country,
          precision: locationValue.precision,
          providerPlaceId: locationValue.providerPlaceId,
          locationId: created.id ?? null,
          deviceGeolocationEnabled: false,
        });
      }
      step = 1;
    } catch (err) {
      showToast(errorMessage(err, 'Could not save that. Try again.'), 'error');
    } finally {
      busy = false;
    }
  }

  async function toggleChannel(channel: DiscoverScopeItem) {
    joining = channel.slug;
    try {
      await toggleScopeMembership('channel', channel.slug, channel.viewerIsMember);
      channels = channels.map((item) =>
        item.slug === channel.slug ? { ...item, viewerIsMember: !item.viewerIsMember } : item
      );
    } catch (err) {
      showToast(errorMessage(err, 'Could not join that channel.'), 'error');
    } finally {
      joining = null;
    }
  }

  /** Where they were heading before signing up (a private event, a service...), or Home. */
  $: nextPath = (() => {
    const next = $page.url.searchParams.get('next') ?? '';
    return /^\/(?![\/\\])/.test(next) ? next : '/';
  })();

  async function finish() {
    busy = true;
    await refreshBootstrap();
    busy = false;
    await goto(nextPath);
  }
</script>

<section class="welcome">
  <p class="progress">Step {step + 1} of {steps.length} · {steps[step]}</p>

  {#if step === 0}
    <h1>Welcome to Social Production</h1>
    <p class="lead">Two quick things so times and nearby activity make sense for you.</p>
    <label class="field">
      <span>Your time zone</span>
      <SearchableSelect
        ariaLabel="Display timezone"
        options={timezoneOptions}
        placeholder="Filter time zones"
        bind:value={timezone}
      />
      <small>Every time in the app is shown in this zone.</small>
    </label>
    <div class="field">
      <span>Your area (optional)</span>
      <LocationPicker bind:value={locationValue} modes={['physical']} />
      <small>The map and nearby lists start here. Only you see it.</small>
    </div>
    <div class="actions">
      <button class="secondary" type="button" on:click={() => (step = 1)}>Skip</button>
      <button class="primary" type="button" disabled={busy} on:click={saveWhere}>Continue</button>
    </div>
  {:else if step === 1}
    <h1>Pick a few channels</h1>
    <p class="lead">
      Channels are topics. Joining one puts its posts, projects and events in your Home feed.
    </p>
    {#if !channelsLoaded}
      <p class="muted">Loading channels…</p>
    {:else if channels.length === 0}
      <p class="muted">No channels yet. You can find them later under Discover.</p>
    {:else}
      <ul class="channels">
        {#each channels as channel (channel.slug)}
          <li>
            <div>
              <strong>{channel.label}</strong>
              {#if channel.description}<span>{channel.description}</span>{/if}
            </div>
            <button
              class:joined={channel.viewerIsMember}
              type="button"
              disabled={joining === channel.slug}
              on:click={() => toggleChannel(channel)}
            >
              {channel.viewerIsMember ? 'Joined' : 'Join'}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
    <div class="actions">
      <button class="secondary" type="button" on:click={() => (step = 0)}>Back</button>
      <button class="primary" type="button" on:click={() => (step = 2)}>Continue</button>
    </div>
  {:else}
    <h1>How decisions work here</h1>
    <ul class="points">
      <li>
        <strong>Start right away.</strong> You can post, comment, chat, join projects and events, and
        take roles from day one.
      </li>
      <li>
        <strong>Voting opens after a short warm-up.</strong> New accounts vote once they've been around
        a little and made a few contributions. Your profile shows what's left.
      </li>
      <li>
        <strong>Members decide together.</strong> Most changes to projects, events and communities pass
        with 66% yes from the people taking part.
      </li>
      <li>
        <strong>Real people, not bots.</strong> Full members can vouch for you, and accounts several members
        flag as bots go to a public review.
      </li>
      <li>
        <strong>Your own time zone.</strong> Every date and time is shown in your time zone. Change it
        any time in Settings.
      </li>
    </ul>
    <div class="actions">
      <button class="secondary" type="button" on:click={() => (step = 1)}>Back</button>
      <button class="primary" type="button" disabled={busy} on:click={finish}>
        {nextPath === '/' ? 'Go to my feed' : 'Continue where I was'}
      </button>
    </div>
  {/if}
</section>

<style>
  .welcome {
    display: grid;
    gap: 16px;
    max-width: 560px;
    margin: 24px auto;
    padding: 0 16px 48px;
  }

  .progress,
  .muted,
  small {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
  }

  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 800;
  }

  .lead {
    margin: 0;
    color: var(--text-soft);
  }

  .field {
    display: grid;
    gap: 6px;
    font-weight: 700;
  }

  .field small {
    font-weight: 400;
  }

  .channels,
  .points {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .channels li {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
  }

  .channels li div {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .channels li span {
    color: var(--text-soft);
    font-size: 13px;
  }

  .channels button {
    flex: 0 0 auto;
    min-width: 76px;
    min-height: 36px;
    border: 1px solid var(--brand);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--brand-strong);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .channels button.joined {
    background: var(--brand);
    color: var(--on-brand, #fff);
  }

  .points li {
    line-height: 1.5;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 8px;
  }

  .actions button {
    min-height: 44px;
    border-radius: var(--radius-sm);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .primary {
    border: 0;
    background: var(--brand);
    color: var(--on-brand, #fff);
  }

  .secondary {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    color: var(--text-main);
  }
</style>
