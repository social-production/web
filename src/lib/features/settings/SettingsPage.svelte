<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import { signOut, updateSettings } from '$lib/services/queries/account';
  import type {
    AppearanceThemeMode,
    DefaultFeedMode,
    SettingsPageData,
    SettingsUpdateInput
  } from '$lib/types/account';

  export let data: SettingsPageData;

  let pendingKey = '';
  let bioDraft = data.profileBio;
  let lastLoadedBio = data.profileBio;
  let lastLoadedProfileImage = data.profileImageUrl;

  $: if (pendingKey !== 'bio' && data.profileBio !== lastLoadedBio) {
    bioDraft = data.profileBio;
    lastLoadedBio = data.profileBio;
  }

  $: if (pendingKey !== 'profile-image' && data.profileImageUrl !== lastLoadedProfileImage) {
    lastLoadedProfileImage = data.profileImageUrl;
  }

  async function applySettings(key: string, patch: SettingsUpdateInput) {
    pendingKey = key;

    try {
      await updateSettings(patch);
      await invalidateAll();
    } finally {
      pendingKey = '';
    }
  }

  function setTheme(theme: AppearanceThemeMode) {
    return applySettings('theme', { appearanceThemeMode: theme });
  }

  function toggleTheme() {
    return setTheme(data.appearanceThemeMode === 'dark' ? 'light' : 'dark');
  }

  function setDefaultFeed(feed: DefaultFeedMode) {
    return applySettings('default-feed', { defaultFeed: feed });
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

    const dataUrl = await readFileAsDataUrl(file);
    await applySettings('profile-image', { profileImageUrl: dataUrl });
    input.value = '';
  }

  function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(reader.error ?? new Error('Could not read image file.'));
      reader.readAsDataURL(file);
    });
  }

  function togglePublicActivity() {
    return applySettings('personal-activity', {
      hidePublicActivityFromPersonalFeeds: !data.hidePublicActivityFromPersonalFeeds
    });
  }

  function togglePrivateProfile() {
    const nextValue = !data.hidePersonalFeedFromNonFollowers;

    return applySettings('private-profile', {
      hidePersonalFeedFromNonFollowers: nextValue,
      requireFollowApproval: nextValue
    });
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

<section class="page">
  <section class="hero-card">
    <h1>Settings</h1>
    <p>Manage appearance, feed defaults, and privacy in one place.</p>
  </section>

  <section class="grid">
    <section class="panel">
      <h2>Account</h2>
      <div class="account-summary">
        <div class="account-headline">
          <AvatarBadge size="md" username={data.profileUsername} imageUrl={data.profileImageUrl || null} />
          <strong>{data.profileUsername}</strong>
        </div>
        <p>{data.profileBio}</p>
      </div>
      <p class="helper-copy">Profile text is hydrated from the same mock account data as the shell and profile page.</p>

      <label class="field-stack">
        <span class="field-label">Upload profile image</span>
        <input accept="image/*" type="file" on:change={handleProfileImageFileChange} />
      </label>

      <label class="field-stack">
        <span class="field-label">Bio</span>
        <textarea bind:value={bioDraft} rows="4" placeholder="Tell people what you work on."></textarea>
      </label>

      <div class="button-row">
        <button class="button-ghost" disabled={pendingKey === 'profile-image'} type="button" on:click={clearProfileImage}>Remove photo</button>
        <button class="button-primary" disabled={pendingKey === 'bio'} type="button" on:click={saveBio}>Save bio</button>
        <button class="button-ghost" disabled={pendingKey === 'sign-out'} type="button" on:click={handleSignOut}>
          {pendingKey === 'sign-out' ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </section>

    <section class="panel">
      <h2>Appearance & Feed</h2>
      <div class="setting-row">
        <div>
          <strong>Theme</strong>
          <p>{data.appearanceThemeMode === 'dark' ? 'Dark mode is active.' : 'Light mode is active.'}</p>
        </div>
        <button
          class="theme-toggle"
          class:light-active={data.appearanceThemeMode === 'light'}
          disabled={pendingKey === 'theme'}
          type="button"
          on:click={toggleTheme}
        >
          <span class="toggle-pill"></span>
          <span class="toggle-label">{data.appearanceThemeMode === 'dark' ? 'Switch to light' : 'Switch to dark'}</span>
        </button>
      </div>

      <div class="setting-row">
        <div>
          <strong>Default feed</strong>
          <p>Choose which feed should feel primary for this account.</p>
        </div>
        <div class="choice-row">
          <button
            class:active={data.defaultFeed === 'public'}
            class="toggle-chip"
            disabled={pendingKey === 'default-feed'}
            type="button"
            on:click={() => setDefaultFeed('public')}
          >
            Public
          </button>
          <button
            class:active={data.defaultFeed === 'personal'}
            class="toggle-chip"
            disabled={pendingKey === 'default-feed'}
            type="button"
            on:click={() => setDefaultFeed('personal')}
          >
            Personal
          </button>
        </div>
      </div>
    </section>
  </section>

  <section class="grid">
    <section class="panel">
      <h2>Personal Feed</h2>
      <div class="setting-row">
        <div>
          <strong>Hide my public activity from personal feeds</strong>
          <p>Use this if you do not want your public project, thread, event, or comment activity showing up in follow-based personal feeds.</p>
        </div>
        <button class="toggle-chip" disabled={pendingKey === 'personal-activity'} type="button" on:click={togglePublicActivity}>
          {data.hidePublicActivityFromPersonalFeeds ? 'On' : 'Off'}
        </button>
      </div>

      <div class="status-note">
        This already affects the hydrated personal feed in the development adapter.
      </div>
    </section>

    <section class="panel">
      <h2>Privacy</h2>
      <div class="setting-row">
        <div>
          <strong>Hide my personal feed from non-followers</strong>
          <p>Turn this on if you want your personal side to stay follower-only.</p>
        </div>
        <button class="toggle-chip" disabled={pendingKey === 'private-profile'} type="button" on:click={togglePrivateProfile}>
          {data.hidePersonalFeedFromNonFollowers ? 'On' : 'Off'}
        </button>
      </div>

      <div class="status-note">
        {data.requireFollowApproval
          ? 'Follower approval is automatically required while your personal feed is hidden from non-followers.'
          : 'Follower approval stays open while your personal feed is visible.'}
      </div>
    </section>
  </section>
</section>

<style>
  .page,
  .panel {
    display: grid;
    gap: 12px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .hero-card,
  .panel {
    padding: 18px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .hero-card {
    background: color-mix(in srgb, var(--brand-soft) 16%, var(--panel));
  }

  h1 {
    font-size: 22px;
    letter-spacing: -0.02em;
    color: var(--brand-strong);
  }

  h2,
  strong {
    font-size: 14px;
  }

  p,
  .helper-copy {
    color: var(--text-soft);
    line-height: 1.45;
  }

  .account-summary,
  .field-stack,
  .setting-row,
  .button-row {
    display: grid;
    gap: 8px;
  }

  .account-headline {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .button-row {
    display: flex;
    flex-wrap: wrap;
  }

  .field-label {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .setting-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
  }

  .account-summary {
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
  }

  .account-summary strong {
    font-size: 16px;
  }

  .choice-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .theme-toggle {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 7px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel);
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
  }

  .toggle-pill {
    width: 34px;
    height: 20px;
    border-radius: 999px;
    border: 1px solid var(--panel-border);
    background: color-mix(in srgb, var(--brand-soft) 56%, var(--panel));
    position: relative;
  }

  .toggle-pill::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    border-radius: 999px;
    background: var(--brand);
    transition: transform 0.12s ease;
  }

  .theme-toggle.light-active .toggle-pill::after {
    transform: translateX(14px);
  }

  .toggle-label {
    color: var(--text-soft);
  }

  @media (max-width: 760px) {
    .grid {
      grid-template-columns: 1fr;
    }

    .setting-row {
      align-items: stretch;
      flex-direction: column;
    }
  }
</style>