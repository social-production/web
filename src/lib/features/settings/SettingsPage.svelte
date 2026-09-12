<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import { extractErrorMessage } from '$lib/services/errors';
  import { getFollowRequests, getSettings } from '$lib/services/queries/account';
  import {
    acceptFollowRequest,
    rejectFollowRequest,
    signOut,
    updateSettings
  } from '$lib/services/commands/account';
  import { patchBootstrapCacheSettings } from '$lib/services/bootstrapCache';
  import type {
    AppearanceThemeMode,
    PreferredLanguage,
    SettingsPageData,
    SettingsUpdateInput
  } from '$lib/types/account';
  import type { ViewerSummary } from '$lib/types/bootstrap';
  import { applyLocale } from '$lib/i18n/locale';
  import { I18N_ENABLED, LANGUAGE_OPTIONS } from '$lib/i18n/config';
  import SearchableSelect from '$lib/components/shared/SearchableSelect.svelte';
  import LocationPicker from '$lib/components/shared/LocationPicker.svelte';
  import { getIpLocationHint } from '$lib/services/queries/locations';
  import { createLocation } from '$lib/services/commands/locations';
  import {
    clearDefaultLocationOnServer,
    hydrateDefaultLocationFromServer,
    persistDefaultLocationToServer
  } from '$lib/location/sync';
  import {
    devicePositionErrorMessage,
    isDeviceGeolocationEnabled,
    requestDevicePosition,
    setDeviceGeolocationEnabled
  } from '$lib/location/geolocation';
  import { listDisplayTimezones, setDisplayTimezone } from '$lib/stores/timezoneStore';
  import { emptyLocationPickerValue, type LocationPickerValue } from '$lib/types/locationPicker';
  import * as m from '$lib/paraglide/messages';

  export let data: SettingsPageData;

  let pendingKey = '';
  let photoInput: HTMLInputElement | null = null;
  let bioDraft = data.profileBio.slice(0, 160);
  let lastLoadedBio = data.profileBio;
  let lastLoadedProfileImage = data.profileImageUrl;
  let pendingFollowRequests: ViewerSummary[] = [];
  let followRequestPending = '';
  let profileImageError = '';
  let bioError = '';
  let bioSavedFlash = false;
  let profilePreviewUrl = '';
  let timezoneDraft = data.displayTimezone ?? '';
  let locationValue: LocationPickerValue = emptyLocationPickerValue();
  let regionalMessage = '';
  let deviceLocationEnabled = false;

  $: timezoneSelectOptions = listDisplayTimezones().map((timezone) => ({
    value: timezone,
    label: timezone
  }));

  $: if (pendingKey !== 'timezone' && data.displayTimezone !== timezoneDraft) {
    timezoneDraft = data.displayTimezone ?? '';
  }

  $: if (pendingKey !== 'bio' && data.profileBio !== lastLoadedBio) {
    bioDraft = data.profileBio.slice(0, 160);
    lastLoadedBio = data.profileBio;
    bioSavedFlash = false;
  }

  $: displayedProfileImageUrl = profilePreviewUrl || data.profileImageUrl;

  $: if (pendingKey !== 'profile-image' && data.profileImageUrl !== lastLoadedProfileImage) {
    lastLoadedProfileImage = data.profileImageUrl;
    profilePreviewUrl = '';
  }

  async function applySettings(key: string, patch: SettingsUpdateInput) {
    pendingKey = key;

    if (key === 'profile-image') {
      profileImageError = '';
    }
    if (key === 'bio') {
      bioError = '';
      bioSavedFlash = false;
    }

    try {
      await updateSettings(patch);
      // Layout serves session bootstrap/settings cache on invalidate — refresh it first
      // so profile bio / photo / prefs actually appear after save.
      try {
        const freshSettings = await getSettings();
        if (freshSettings) {
          patchBootstrapCacheSettings(freshSettings);
          if (key === 'bio') {
            lastLoadedBio = freshSettings.profileBio;
            bioDraft = freshSettings.profileBio.slice(0, 160);
          }
        }
      } catch {
        // Still invalidate; next full bootstrap refresh will reconcile.
      }
      await invalidateAll();
      if (key === 'bio') {
        bioSavedFlash = true;
      }
    } catch (err) {
      if (key === 'profile-image') {
        profilePreviewUrl = '';
        profileImageError = extractErrorMessage(err, 'Could not update profile photo.');
      }
      if (key === 'bio') {
        bioError = extractErrorMessage(err, 'Could not save bio.');
      }

      throw err;
    } finally {
      pendingKey = '';
    }
  }

  function setTheme(theme: AppearanceThemeMode) {
    return applySettings('theme', { appearanceThemeMode: theme });
  }

  function handleTimezoneChange(value: string) {
    timezoneDraft = value;
    void applySettings('timezone', { displayTimezone: value || null }).then(() => {
      setDisplayTimezone(value || null);
    });
  }

  async function handleLocationChange(event: CustomEvent<LocationPickerValue>) {
    regionalMessage = '';
    locationValue = event.detail;
    const viewerId = $page.data.bootstrap?.viewer?.id ?? null;
    if (!locationValue.displayLabel.trim()) {
      await clearDefaultLocationOnServer(viewerId);
      return;
    }

    try {
      let locationId = locationValue.locationId;
      if (
        !locationId &&
        !locationValue.isOnline &&
        locationValue.latitude != null &&
        locationValue.longitude != null
      ) {
        const created = await createLocation({
          providerPlaceId: locationValue.providerPlaceId,
          displayLabel: locationValue.displayLabel,
          latitude: locationValue.latitude,
          longitude: locationValue.longitude,
          region: locationValue.region,
          country: locationValue.country,
          precision: locationValue.precision,
          isOnline: false
        });
        locationId = created.id ?? null;
      }

      await persistDefaultLocationToServer(viewerId, {
        displayLabel: locationValue.displayLabel,
        latitude: locationValue.latitude,
        longitude: locationValue.longitude,
        region: locationValue.region,
        country: locationValue.country,
        precision: locationValue.precision,
        providerPlaceId: locationValue.providerPlaceId,
        locationId,
        deviceGeolocationEnabled: deviceLocationEnabled
      });
    } catch {
      regionalMessage = 'Could not save default location.';
    }
  }

  async function useIpLocation() {
    regionalMessage = '';
    const viewerId = $page.data.bootstrap?.viewer?.id ?? null;
    try {
      const [hint] = await getIpLocationHint();
      if (!hint || hint.latitude == null || hint.longitude == null) {
        regionalMessage =
          'IP location is unavailable. On localhost use search or device location; on a deployed site this uses your public IP.';
        return;
      }
      locationValue = {
        ...emptyLocationPickerValue(),
        displayLabel: hint.displayLabel,
        latitude: hint.latitude,
        longitude: hint.longitude,
        region: hint.region,
        country: hint.country,
        precision: hint.precision ?? 'approximate',
        providerPlaceId: hint.providerPlaceId,
        locationId: null
      };
      await handleLocationChange(new CustomEvent('change', { detail: locationValue }));
    } catch (error) {
      const message = extractErrorMessage(error, error instanceof Error ? error.message : '');
      if (message.includes('ip_location_unavailable')) {
        regionalMessage =
          'IP location is unavailable on localhost. Use search or device location, or try again from a network address.';
      } else if (message.includes('429') || message.includes('rate_limit')) {
        regionalMessage = 'Too many IP location requests. Wait a moment and try again.';
      } else {
        regionalMessage = 'IP location is unavailable right now.';
      }
    }
  }

  async function toggleDeviceLocation() {
    const viewerId = $page.data.bootstrap?.viewer?.id ?? null;
    deviceLocationEnabled = !deviceLocationEnabled;
    setDeviceGeolocationEnabled(viewerId, deviceLocationEnabled);
    if (!deviceLocationEnabled) {
      return;
    }
    const result = await requestDevicePosition(viewerId);
    if (!result.ok) {
      regionalMessage = devicePositionErrorMessage(result.error);
      deviceLocationEnabled = false;
      setDeviceGeolocationEnabled(viewerId, false);
      return;
    }
    locationValue = {
      ...emptyLocationPickerValue(),
      displayLabel: result.label,
      latitude: result.position.latitude,
      longitude: result.position.longitude,
      providerPlaceId: result.providerPlaceId
    };
    await handleLocationChange(new CustomEvent('change', { detail: locationValue }));
  }

  function toggleTheme() {
    return setTheme(data.appearanceThemeMode === 'dark' ? 'light' : 'dark').catch(() => undefined);
  }

  function setLanguage(language: PreferredLanguage) {
    if (!I18N_ENABLED) {
      return;
    }

    applyLocale(language);
    return applySettings('language', { preferredLanguage: language });
  }

  function handleLanguageChange(event: Event) {
    const value = (event.currentTarget as HTMLSelectElement).value as PreferredLanguage;
    void setLanguage(value);
  }

  function saveBio() {
    const nextBio = bioDraft.trim().slice(0, 160);
    bioDraft = nextBio;
    return applySettings('bio', {
      profileBio: nextBio
    });
  }

  function clearProfileImage() {
    return applySettings('profile-image', {
      profileImageUrl: ''
    });
  }

  async function handleProfileImageFileChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    profileImageError = '';

    if (/heic|heif/i.test(file.type) || /\.heic$|\.heif$/i.test(file.name)) {
      profileImageError = 'Use JPEG, PNG, or WebP photos. iPhone HEIC files are not supported yet.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      profileImageError = 'Choose an image under 5 MB.';
      input.value = '';
      return;
    }

    try {
      const dataUrl = await compressImageToDataUrl(file);

      if (dataUrl.length > 500_000) {
        profileImageError = 'Image is still too large after compression. Try a smaller photo.';
        return;
      }

      profilePreviewUrl = dataUrl;
      await applySettings('profile-image', { profileImageUrl: dataUrl });
    } catch (err) {
      profilePreviewUrl = '';
      profileImageError = extractErrorMessage(err, 'Could not process that image.');
    } finally {
      input.value = '';
    }
  }

  function compressImageToDataUrl(file: File, maxSize = 512, quality = 0.85) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d');

          if (!context) {
            reject(new Error('Could not process image.'));
            return;
          }

          context.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('Could not load image.'));
        img.src = typeof reader.result === 'string' ? reader.result : '';
      };
      reader.onerror = () => reject(reader.error ?? new Error('Could not read image file.'));
      reader.readAsDataURL(file);
    });
  }

  function togglePublicActivity() {
    return applySettings('personal-activity', {
      hidePublicActivityFromPersonalFeeds: !data.hidePublicActivityFromPersonalFeeds
    });
  }

  function togglePrivatePosts() {
    const nextValue = !data.hidePersonalFeedFromNonFollowers;

    return applySettings('private-posts', {
      hidePersonalFeedFromNonFollowers: nextValue,
      requireFollowApproval: nextValue ? true : data.requireFollowApproval
    });
  }

  function togglePrivateProfileActivity() {
    return applySettings('private-profile-activity', {
      hidePublicProfileActivityFromNonFollowers: !data.hidePublicProfileActivityFromNonFollowers
    });
  }

  function toggleRequireFollowApproval() {
    return applySettings('follow-approval', {
      requireFollowApproval: !data.requireFollowApproval
    });
  }

  onMount(async () => {
    const viewerId = $page.data.bootstrap?.viewer?.id ?? null;
    deviceLocationEnabled = isDeviceGeolocationEnabled(viewerId);
    const saved = await hydrateDefaultLocationFromServer(viewerId);
    if (saved?.displayLabel) {
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
    }

    try {
      pendingFollowRequests = await getFollowRequests();
    } catch {
      pendingFollowRequests = [];
    }
  });

  async function handleFollowRequest(username: string, action: 'accept' | 'reject') {
    followRequestPending = username;

    try {
      if (action === 'accept') {
        await acceptFollowRequest(username);
      } else {
        await rejectFollowRequest(username);
      }
      pendingFollowRequests = pendingFollowRequests.filter((person) => person.username !== username);
      await invalidateAll();
    } finally {
      followRequestPending = '';
    }
  }

  async function handleSignOut() {
    pendingKey = 'sign-out';

    try {
      await signOut();
      await invalidateAll();
      await goto('/onboarding');
    } finally {
      pendingKey = '';
    }
  }
</script>

<section class="settings-layout">
  <nav class="settings-nav" aria-label="Settings sections">
    <p class="settings-nav-label">Settings</p>
    <a class="nav-item" href="#settings-profile">Profile</a>
    <a class="nav-item" href="#settings-appearance">Appearance</a>
    <a class="nav-item" href="#settings-regional">Regional</a>
    {#if pendingFollowRequests.length > 0}
      <a class="nav-item" href="#settings-follow-requests">Follow requests</a>
    {/if}
    <a class="nav-item" href="#settings-privacy">Privacy</a>
  </nav>

<section class="settings-page">
  <header class="page-header">
    <h1>{m.settings_title()}</h1>
    <p>{m.settings_intro()}</p>
  </header>

  <section class="settings-section" id="settings-profile">
    <h2>{m.settings_profile_heading()}</h2>
    <div class="card">
      <div class="profile-row">
        <button
          class="avatar-picker"
          type="button"
          aria-label="Change profile photo"
          disabled={pendingKey === 'profile-image'}
          on:click={() => photoInput?.click()}
        >
          <AvatarBadge size="md" username={data.profileUsername} imageUrl={displayedProfileImageUrl || null} />
          <span class="avatar-hint">Change</span>
        </button>
        <input
          bind:this={photoInput}
          accept="image/jpeg,image/png,image/webp"
          class="sr-only"
          type="file"
          on:change={handleProfileImageFileChange}
        />
        <div class="profile-copy">
          <strong>{data.profileUsername}</strong>
          <textarea
            bind:value={bioDraft}
            maxlength={160}
            rows="2"
            placeholder={m.settings_bio_placeholder()}
            aria-label={m.settings_bio_label()}
          ></textarea>
          <span class="bio-counter">{bioDraft.length}/160</span>
        </div>
      </div>
      {#if profileImageError}
        <p class="profile-image-error">{profileImageError}</p>
      {/if}
      {#if bioError}
        <p class="profile-image-error">{bioError}</p>
      {:else if bioSavedFlash}
        <p class="bio-saved">Bio saved.</p>
      {/if}

      <div class="actions">
        <button class="button-secondary" disabled={pendingKey === 'profile-image'} type="button" on:click={clearProfileImage}>
          {m.settings_remove_photo()}
        </button>
        <button class="button-primary" disabled={pendingKey === 'bio'} type="button" on:click={() => void saveBio()}>{m.settings_save_bio()}</button>
        <button class="button-danger" disabled={pendingKey === 'sign-out'} type="button" on:click={handleSignOut}>
          {pendingKey === 'sign-out' ? m.settings_signing_out() : m.settings_sign_out()}
        </button>
      </div>
    </div>
  </section>

  <section class="settings-section" id="settings-appearance">
    <h2>{m.settings_appearance_heading()}</h2>
    <div class="card stack flush">
      <div class="setting-item">
        <div>
          <strong>{m.settings_language_label()}</strong>
          <p class="language-note">{m.settings_language_coming_soon()}</p>
        </div>
        <label class="language-field">
          <span class="sr-only">{m.settings_language_label()}</span>
          <select
            class="language-select"
            disabled={!I18N_ENABLED || pendingKey === 'language'}
            value={I18N_ENABLED ? data.preferredLanguage : 'en'}
            on:change={handleLanguageChange}
          >
            {#each I18N_ENABLED ? LANGUAGE_OPTIONS : LANGUAGE_OPTIONS.filter((option) => option.enabled) as option}
              <option disabled={!option.enabled} value={option.value}>
                {option.label}
              </option>
            {/each}
          </select>
        </label>
      </div>
      <div class="setting-item">
        <div>
          <strong>Theme</strong>
          <p>{data.appearanceThemeMode === 'dark' ? m.settings_theme_dark() : m.settings_theme_light()}</p>
        </div>
        <button class="button-secondary" disabled={pendingKey === 'theme'} type="button" on:click={toggleTheme}>
          Switch to {data.appearanceThemeMode === 'dark' ? m.settings_theme_light() : m.settings_theme_dark()}
        </button>
      </div>
      <div class="setting-item">
        <div>
          <strong>Display timezone</strong>
          <p>Used for scheduled activity and event times across the app.</p>
        </div>
        <SearchableSelect
          allowEmpty
          ariaLabel="Display timezone"
          disabled={pendingKey === 'timezone'}
          emptyOptionLabel="Use browser timezone"
          options={timezoneSelectOptions}
          placeholder="Filter timezones"
          bind:value={timezoneDraft}
          on:change={(event) => handleTimezoneChange(event.detail)}
        />
      </div>
    </div>
  </section>

  <section class="settings-section" id="settings-regional">
    <h2>Regional</h2>
    <div class="card stack flush">
      <div class="setting-item">
        <div>
          <strong>Default location</strong>
          <p>Used for regional feed and map discovery.</p>
        </div>
        <LocationPicker bind:value={locationValue} modes={['physical']} on:change={handleLocationChange} />
      </div>
      <div class="setting-item">
        <div>
          <strong>Device location (GPS)</strong>
          <p>
            Permission for the map’s “Use my location” button. Uses your device GPS when you tap it — not applied
            automatically in the background.
          </p>
        </div>
        <button
          aria-checked={deviceLocationEnabled}
          class="switch"
          class:on={deviceLocationEnabled}
          role="switch"
          type="button"
          on:click={() => void toggleDeviceLocation()}
        >
          <span class="switch-thumb"></span>
          <span class="sr-only">{deviceLocationEnabled ? 'On' : 'Off'}</span>
        </button>
      </div>
      <div class="setting-item">
        <div>
          <strong>Approximate network location</strong>
          <p>
            One-time set of your default place from your public IP when GPS isn’t available or you don’t want it.
            Different from GPS — coarser, and only runs when you press the button.
          </p>
        </div>
        <button class="button-secondary" type="button" on:click={() => void useIpLocation()}>
          Set from network
        </button>
      </div>
      {#if regionalMessage}
        <p class="status error" role="alert">{regionalMessage}</p>
      {/if}
    </div>
  </section>

  {#if pendingFollowRequests.length > 0}
    <section class="settings-section" id="settings-follow-requests">
      <h2>Follow requests</h2>
      <div class="card stack">
        {#each pendingFollowRequests as person (person.username)}
          <div class="follow-request-row">
            <div>
              <strong>@{person.username}</strong>
              {#if person.bio}
                <p>{person.bio}</p>
              {/if}
            </div>
            <div class="follow-request-actions">
              <button
                class="button-primary"
                disabled={followRequestPending === person.username}
                type="button"
                on:click={() => handleFollowRequest(person.username, 'accept')}
              >
                Accept
              </button>
              <button
                class="button-ghost"
                disabled={followRequestPending === person.username}
                type="button"
                on:click={() => handleFollowRequest(person.username, 'reject')}
              >
                Decline
              </button>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <section class="settings-section" id="settings-privacy">
    <h2>{m.settings_privacy_heading()}</h2>
    <div class="card stack flush">
      <div class="setting-item">
        <div>
          <strong>Hide profile activity from non-followers</strong>
          <p>When on, only followers can see your projects, threads, events, and public posts on your profile.</p>
        </div>
        <button
          aria-checked={data.hidePublicProfileActivityFromNonFollowers}
          class="switch"
          class:on={data.hidePublicProfileActivityFromNonFollowers}
          disabled={pendingKey === 'private-profile-activity'}
          role="switch"
          type="button"
          on:click={togglePrivateProfileActivity}
        >
          <span class="switch-thumb"></span>
          <span class="sr-only">{data.hidePublicProfileActivityFromNonFollowers ? 'On' : 'Off'}</span>
        </button>
      </div>

      <div class="setting-item">
        <div>
          <strong>Require approval to follow you</strong>
          <p>When on, new followers must be approved before they can see follower-only content.</p>
        </div>
        <button
          aria-checked={data.requireFollowApproval}
          class="switch"
          class:on={data.requireFollowApproval}
          disabled={pendingKey === 'follow-approval'}
          role="switch"
          type="button"
          on:click={toggleRequireFollowApproval}
        >
          <span class="switch-thumb"></span>
          <span class="sr-only">{data.requireFollowApproval ? 'On' : 'Off'}</span>
        </button>
      </div>

      <div class="setting-item">
        <div>
          <strong>Hide personal posts from non-followers</strong>
          <p>Follower-only posts stay hidden from people who do not follow you.</p>
        </div>
        <button
          aria-checked={data.hidePersonalFeedFromNonFollowers}
          class="switch"
          class:on={data.hidePersonalFeedFromNonFollowers}
          disabled={pendingKey === 'private-posts'}
          role="switch"
          type="button"
          on:click={togglePrivatePosts}
        >
          <span class="switch-thumb"></span>
          <span class="sr-only">{data.hidePersonalFeedFromNonFollowers ? 'On' : 'Off'}</span>
        </button>
      </div>

      <div class="setting-item">
        <div>
          <strong>Hide my public activity from others’ personal feeds</strong>
          <p>Stops your public project, thread, and event activity from appearing in follow-based personal timelines.</p>
        </div>
        <button
          aria-checked={data.hidePublicActivityFromPersonalFeeds}
          class="switch"
          class:on={data.hidePublicActivityFromPersonalFeeds}
          disabled={pendingKey === 'personal-activity'}
          role="switch"
          type="button"
          on:click={togglePublicActivity}
        >
          <span class="switch-thumb"></span>
          <span class="sr-only">{data.hidePublicActivityFromPersonalFeeds ? 'On' : 'Off'}</span>
        </button>
      </div>
    </div>
  </section>
</section>
</section>

<style>
  .settings-layout {
    display: grid;
    gap: 24px;
    align-items: start;
    width: 100%;
    max-width: 1024px;
  }

  .settings-nav {
    display: none;
  }

  .settings-nav-label {
    margin: 0 0 8px;
    padding: 0 10px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-soft);
  }

  .nav-item {
    display: block;
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    color: var(--text-soft);
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
  }

  .nav-item:hover {
    background: var(--panel-soft);
    color: var(--text-main);
  }

  .settings-page {
    display: grid;
    gap: 22px;
    max-width: 760px;
    min-width: 0;
  }

  .page-header h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 800;
    color: var(--brand-strong);
  }

  .page-header p {
    margin: 6px 0 0;
    color: var(--text-soft);
  }

  .settings-section {
    display: grid;
    gap: 12px;
    scroll-margin-top: 1.5rem;
  }

  .settings-section h2 {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-soft);
  }

  .card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-md);
    background: var(--panel);
  }

  .card.stack {
    display: grid;
    gap: 12px;
  }

  .card.stack.flush {
    gap: 0;
    padding: 0;
    overflow: hidden;
  }

  .card.stack.flush .setting-item {
    padding: 14px 16px;
    border-bottom: 1px solid var(--panel-border);
  }

  .card.stack.flush .setting-item:last-child,
  .card.stack.flush .status {
    border-bottom: none;
  }

  .card.stack.flush .status {
    padding: 0 16px 14px;
  }

  .profile-row {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 14px;
  }

  .avatar-picker {
    position: relative;
    display: inline-flex;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
    border-radius: 999px;
  }

  .avatar-picker:hover,
  .avatar-picker:focus-visible {
    outline: 2px solid var(--brand);
    outline-offset: 2px;
  }

  .avatar-hint {
    position: absolute;
    right: -4px;
    bottom: -4px;
    padding: 2px 6px;
    border-radius: 999px;
    background: var(--brand);
    color: var(--page-background);
    font-size: 10px;
    font-weight: 800;
  }

  .profile-copy {
    display: grid;
    gap: 6px;
    flex: 1;
    min-width: 0;
  }

  .profile-copy textarea {
    width: 100%;
    min-height: 64px;
    padding: 8px 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-main);
    font: inherit;
    font-size: 14px;
    line-height: 1.4;
    resize: vertical;
  }

  .field {
    display: grid;
    gap: 6px;
    margin-top: 12px;
  }

  .label {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-soft);
  }

  .profile-image-error {
    margin: 0;
    color: var(--danger, #c0392b);
    font-size: 13px;
    line-height: 1.4;
  }

  .bio-saved {
    margin: 6px 0 0;
    color: var(--brand-strong);
    font-size: 13px;
    font-weight: 700;
  }

  .bio-counter {
    justify-self: end;
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
  }

  textarea,
  input[type='file'] {
    width: 100%;
  }

  textarea {
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-main);
    resize: vertical;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
  }

  .actions .button-danger {
    margin-left: auto;
  }

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }

  .setting-item p {
    margin: 4px 0 0;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.45;
    max-width: 46ch;
  }

  .language-note {
    margin-top: 6px;
  }

  .language-field {
    flex-shrink: 0;
  }

  .language-select {
    min-width: 180px;
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-main);
    font-weight: 700;
    font-size: 13px;
  }

  .language-select:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .follow-request-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .follow-request-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .button-primary,
  .button-secondary,
  .button-danger {
    border-radius: var(--radius-sm);
    font-weight: 700;
    cursor: pointer;
  }

  .button-primary {
    padding: 8px 14px;
    border: 0;
    background: var(--accent-strong);
    color: white;
  }

  .button-secondary,
  .button-danger {
    padding: 8px 14px;
    border: 1px solid var(--panel-border);
    background: var(--panel-soft);
    color: var(--text-main);
  }

  .button-danger {
    border-color: color-mix(in srgb, #b91c1c 50%, var(--panel-border));
    background: color-mix(in srgb, #b91c1c 10%, var(--panel-soft));
    color: #b91c1c;
  }

  .switch {
    position: relative;
    flex: 0 0 auto;
    width: 44px;
    height: 24px;
    padding: 0;
    border: 2px solid transparent;
    border-radius: 999px;
    background: var(--panel-border);
    cursor: pointer;
    transition: background-color 0.18s ease;
  }

  .switch.on {
    background: var(--brand);
  }

  .switch:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .switch:focus-visible {
    outline: 2px solid var(--brand);
    outline-offset: 2px;
  }

  .switch-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    background: var(--page-background);
    box-shadow: 0 1px 2px color-mix(in srgb, var(--text-main) 25%, transparent);
    transition: transform 0.18s ease;
  }

  .switch.on .switch-thumb {
    transform: translateX(20px);
  }

  @media (min-width: 900px) {
    .settings-layout {
      grid-template-columns: 180px minmax(0, 1fr);
      gap: 32px;
    }

    .settings-nav {
      position: sticky;
      top: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .page-header {
      display: none;
    }
  }

  @media (max-width: 720px) {
    .setting-item {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
