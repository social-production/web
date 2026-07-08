<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import { extractErrorMessage } from '$lib/api/drivers/fastapi/client';
  import {
    acceptFollowRequest,
    getFollowRequests,
    rejectFollowRequest,
    signOut,
    updateSettings
  } from '$lib/services/queries/account';
  import type {
    AppearanceThemeMode,
    PreferredLanguage,
    SettingsPageData,
    SettingsUpdateInput
  } from '$lib/types/account';
  import type { ViewerSummary } from '$lib/types/bootstrap';
  import { applyLocale } from '$lib/i18n/locale';
  import { I18N_ENABLED, LANGUAGE_OPTIONS } from '$lib/i18n/config';
  import { listDisplayTimezones, setDisplayTimezone } from '$lib/stores/timezoneStore';
  import * as m from '$lib/paraglide/messages';

  export let data: SettingsPageData;

  let pendingKey = '';
  let bioDraft = data.profileBio;
  let lastLoadedBio = data.profileBio;
  let lastLoadedProfileImage = data.profileImageUrl;
  let pendingFollowRequests: ViewerSummary[] = [];
  let followRequestPending = '';
  let profileImageError = '';
  let profilePreviewUrl = '';
  let timezoneDraft = data.displayTimezone ?? '';

  $: if (pendingKey !== 'timezone' && data.displayTimezone !== timezoneDraft) {
    timezoneDraft = data.displayTimezone ?? '';
  }

  const timezoneOptions = listDisplayTimezones();

  $: if (pendingKey !== 'bio' && data.profileBio !== lastLoadedBio) {
    bioDraft = data.profileBio;
    lastLoadedBio = data.profileBio;
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

    try {
      await updateSettings(patch);
      await invalidateAll();
    } catch (err) {
      if (key === 'profile-image') {
        profilePreviewUrl = '';
        profileImageError = extractErrorMessage(err, 'Could not update profile photo.');
      }

      throw err;
    } finally {
      pendingKey = '';
    }
  }

  function setTheme(theme: AppearanceThemeMode) {
    return applySettings('theme', { appearanceThemeMode: theme });
  }

  function handleTimezoneChange(event: Event) {
    const value = (event.currentTarget as HTMLSelectElement).value;
    timezoneDraft = value;
    void applySettings('timezone', { displayTimezone: value || null }).then(() => {
      setDisplayTimezone(value || null);
    });
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
    return applySettings('bio', {
      profileBio: bioDraft.trim()
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

<section class="settings-page">
  <header class="page-header">
    <h1>{m.settings_title()}</h1>
    <p>{m.settings_intro()}</p>
  </header>

  <section class="settings-section">
    <h2>{m.settings_profile_heading()}</h2>
    <div class="card">
      <div class="profile-row">
        <AvatarBadge size="md" username={data.profileUsername} imageUrl={displayedProfileImageUrl || null} />
        <div>
          <strong>{data.profileUsername}</strong>
          <p>{data.profileBio || m.settings_profile_no_bio()}</p>
        </div>
      </div>

      <label class="field">
        <span class="label">{m.settings_profile_photo_label()}</span>
        <input accept="image/jpeg,image/png,image/webp" type="file" on:change={handleProfileImageFileChange} />
      </label>
      {#if profileImageError}
        <p class="profile-image-error">{profileImageError}</p>
      {/if}

      <label class="field">
        <span class="label">{m.settings_bio_label()}</span>
        <textarea bind:value={bioDraft} rows="3" placeholder={m.settings_bio_placeholder()}></textarea>
      </label>

      <div class="actions">
        <button class="button-secondary" disabled={pendingKey === 'profile-image'} type="button" on:click={clearProfileImage}>
          {m.settings_remove_photo()}
        </button>
        <button class="button-primary" disabled={pendingKey === 'bio'} type="button" on:click={saveBio}>{m.settings_save_bio()}</button>
        <button class="button-secondary" disabled={pendingKey === 'sign-out'} type="button" on:click={handleSignOut}>
          {pendingKey === 'sign-out' ? m.settings_signing_out() : m.settings_sign_out()}
        </button>
      </div>
    </div>
  </section>

  <section class="settings-section">
    <h2>{m.settings_appearance_heading()}</h2>
    <div class="card setting-item">
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
    <div class="card setting-item">
      <div>
        <strong>Theme</strong>
        <p>{data.appearanceThemeMode === 'dark' ? m.settings_theme_dark() : m.settings_theme_light()}</p>
      </div>
      <button class="button-secondary" disabled={pendingKey === 'theme'} type="button" on:click={toggleTheme}>
        Switch to {data.appearanceThemeMode === 'dark' ? m.settings_theme_light() : m.settings_theme_dark()}
      </button>
    </div>
    <div class="card setting-item">
      <div>
        <strong>Display timezone</strong>
        <p>Used for scheduled activity and event times across the app.</p>
      </div>
      <label class="timezone-field">
        <span class="sr-only">Display timezone</span>
        <select disabled={pendingKey === 'timezone'} value={timezoneDraft} on:change={handleTimezoneChange}>
          <option value="">Use browser timezone</option>
          {#each timezoneOptions as timezone}
            <option value={timezone}>{timezone}</option>
          {/each}
        </select>
      </label>
    </div>
  </section>

  {#if pendingFollowRequests.length > 0}
    <section class="settings-section">
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

  <section class="settings-section">
    <h2>{m.settings_privacy_heading()}</h2>
    <div class="card stack">
      <div class="setting-item">
        <div>
          <strong>Hide profile activity from non-followers</strong>
          <p>When on, only followers can see your projects, threads, events, and public posts on your profile.</p>
        </div>
        <button class="toggle" class:on={data.hidePublicProfileActivityFromNonFollowers} disabled={pendingKey === 'private-profile-activity'} type="button" on:click={togglePrivateProfileActivity}>
          {data.hidePublicProfileActivityFromNonFollowers ? 'On' : 'Off'}
        </button>
      </div>

      <div class="setting-item">
        <div>
          <strong>Require approval to follow you</strong>
          <p>When on, new followers must be approved before they can see follower-only content.</p>
        </div>
        <button class="toggle" class:on={data.requireFollowApproval} disabled={pendingKey === 'follow-approval'} type="button" on:click={toggleRequireFollowApproval}>
          {data.requireFollowApproval ? 'On' : 'Off'}
        </button>
      </div>

      <div class="setting-item">
        <div>
          <strong>Hide personal posts from non-followers</strong>
          <p>Follower-only posts stay hidden from people who do not follow you.</p>
        </div>
        <button class="toggle" class:on={data.hidePersonalFeedFromNonFollowers} disabled={pendingKey === 'private-posts'} type="button" on:click={togglePrivatePosts}>
          {data.hidePersonalFeedFromNonFollowers ? 'On' : 'Off'}
        </button>
      </div>

      <div class="setting-item">
        <div>
          <strong>Hide my public activity from others’ personal feeds</strong>
          <p>Stops your public project, thread, and event activity from appearing in follow-based personal timelines.</p>
        </div>
        <button class="toggle" class:on={data.hidePublicActivityFromPersonalFeeds} disabled={pendingKey === 'personal-activity'} type="button" on:click={togglePublicActivity}>
          {data.hidePublicActivityFromPersonalFeeds ? 'On' : 'Off'}
        </button>
      </div>
    </div>
  </section>
</section>

<style>
  .settings-page {
    display: grid;
    gap: 18px;
    max-width: 760px;
  }

  .page-header h1 {
    margin: 0;
    font-size: 24px;
    color: var(--brand-strong);
  }

  .page-header p {
    margin: 6px 0 0;
    color: var(--text-soft);
  }

  .settings-section {
    display: grid;
    gap: 10px;
  }

  .settings-section h2 {
    margin: 0;
    font-size: 13px;
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

  .profile-row {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 14px;
  }

  .profile-row p {
    margin: 4px 0 0;
    color: var(--text-soft);
    font-size: 14px;
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
    margin-top: 14px;
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
  .toggle {
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
  .toggle {
    padding: 8px 14px;
    border: 1px solid var(--panel-border);
    background: var(--panel-soft);
    color: var(--text-main);
  }

  .toggle.on {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  @media (max-width: 720px) {
    .setting-item {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
