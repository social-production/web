<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { updateSettings } from '$lib/services/queries/account';
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

  $: if (pendingKey !== 'bio' && data.profileBio !== lastLoadedBio) {
    bioDraft = data.profileBio;
    lastLoadedBio = data.profileBio;
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

  function setDefaultFeed(feed: DefaultFeedMode) {
    return applySettings('default-feed', { defaultFeed: feed });
  }

  function saveBio() {
    return applySettings('bio', {
      profileBio: bioDraft.trim()
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
</script>

<section class="page">
  <section class="hero-card">
    <h1>Settings</h1>
    <p>Theme, feed visibility, and privacy preferences stay here instead of hiding behind the shell.</p>
  </section>

  <section class="grid">
    <section class="panel">
      <h2>Account</h2>
      <div class="account-summary">
        <strong>@{data.profileUsername}</strong>
        <p>{data.profileBio}</p>
      </div>
      <p class="helper-copy">Profile text is hydrated from the same mock account data as the shell and profile page.</p>

      <label class="field-stack">
        <span class="field-label">Bio</span>
        <textarea bind:value={bioDraft} rows="4" placeholder="Tell people what you work on."></textarea>
      </label>

      <div class="button-row">
        <button class="button-primary" disabled={pendingKey === 'bio'} type="button" on:click={saveBio}>Save bio</button>
      </div>
    </section>

    <section class="panel">
      <h2>Appearance</h2>
      <div class="setting-row">
        <div>
          <strong>Theme</strong>
          <p>Switch the app shell between the darker work surface and a lighter paper-like surface.</p>
        </div>
        <div class="choice-row">
          <button
            class:active={data.appearanceThemeMode === 'dark'}
            class="toggle-chip"
            disabled={pendingKey === 'theme'}
            type="button"
            on:click={() => setTheme('dark')}
          >
            Dark
          </button>
          <button
            class:active={data.appearanceThemeMode === 'light'}
            class="toggle-chip"
            disabled={pendingKey === 'theme'}
            type="button"
            on:click={() => setTheme('light')}
          >
            Light
          </button>
        </div>
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
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
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
  .setting-row {
    display: grid;
    gap: 8px;
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