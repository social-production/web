<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { signIn, signUp } from '$lib/services/commands/account';
  import type { AccountOption, OnboardingPageData } from '$lib/types/account';
  import { canonicalizeHandle, validateHandle } from '$lib/utils/handles';

  export let data: OnboardingPageData;

  const FALLBACK_MODES: AccountOption[] = [
    {
      value: 'signup',
      label: 'Sign up',
      description: 'Create a new account.'
    },
    {
      value: 'login',
      label: 'Log in',
      description: 'Use an existing account.'
    }
  ];

  let mode: 'login' | 'signup' = 'signup';
  let username = '';
  let password = '';
  let statusMessage = '';
  let isSubmitting = false;

  $: viewer = $page.data.bootstrap?.viewer ?? null;
  $: accountModes =
    Array.isArray(data?.accountModes) && data.accountModes.length > 0
      ? data.accountModes
      : FALLBACK_MODES;
  $: pageTitle = data?.title?.trim() || 'Sign in or create an account';
  $: pageIntro =
    data?.intro?.trim() ||
    'Sign in to post, follow people, and create projects, threads, and events.';
  $: activeMode = accountModes.find((option) => option.value === mode) ?? null;
  $: handleCheck = mode === 'signup' ? validateHandle(username, 'Username') : null;
  $: canonicalPreview =
    handleCheck && handleCheck.ok ? `/profile/${handleCheck.canonical}` : username.trim()
      ? `/profile/${canonicalizeHandle(username)}`
      : '';

  async function handleSubmit() {
    isSubmitting = true;
    statusMessage = '';

    try {
      if (mode === 'signup') {
        const handle = validateHandle(username, 'Username');
        if (!handle.ok) {
          statusMessage = handle.error;
          return;
        }
      }

      const result =
        mode === 'login'
          ? await signIn({ username, password })
          : await signUp({
              username: username.trim(),
              password
            });

      if (!result.ok) {
        statusMessage = result.error ?? 'This auth request could not be completed.';
        return;
      }

      await invalidateAll();
      await goto('/');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<section class="page">
  <section class="hero-card">
    <h1>{pageTitle}</h1>
    <p>{pageIntro}</p>
    {#if viewer}
      <div class="signed-in-note">
        <strong>Signed in as @{viewer.username}</strong>
        <button class="button-primary" type="button" on:click={() => goto('/')}>Go to feed</button>
      </div>
    {/if}
  </section>

  {#if !viewer}
    <section class="panel">
      <p class="mode-hint">Choose <strong>Sign up</strong> for a new account, or <strong>Log in</strong> if you already have one.</p>
      <div class="choice-row" role="tablist" aria-label="Account mode">
        {#each accountModes as option}
          <button
            class:active={mode === option.value}
            class="toggle-chip"
            type="button"
            role="tab"
            aria-selected={mode === option.value}
            on:click={() => (mode = option.value as 'login' | 'signup')}
          >
            {option.label}
          </button>
        {/each}
      </div>
      {#if activeMode?.description}
        <p class="helper-text">{activeMode.description}</p>
      {/if}

      <form class="stack" on:submit|preventDefault={handleSubmit}>
        <label>
          <span class="field-label">Username</span>
          <input bind:value={username} autocomplete="username" />
        </label>
        {#if mode === 'signup' && username.trim()}
          {#if handleCheck && !handleCheck.ok}
            <p class="status-note">{handleCheck.error}</p>
          {:else if canonicalPreview}
            <p class="helper-text">Profile URL: <code>{canonicalPreview}</code></p>
          {/if}
        {/if}

        <label>
          <span class="field-label">Password</span>
          <input bind:value={password} type="password" autocomplete="current-password" />
        </label>

        <div class="button-row">
          <button
            class="button-primary"
            disabled={isSubmitting || (mode === 'signup' && Boolean(handleCheck && !handleCheck.ok))}
            type="submit"
          >
            {#if isSubmitting}
              Working...
            {:else if mode === 'login'}
              Log in
            {:else}
              Create account
            {/if}
          </button>
        </div>

        {#if statusMessage}
          <p class="status-note">{statusMessage}</p>
        {/if}
      </form>
    </section>
  {/if}
</section>

<style>
  .page,
  .stack {
    display: grid;
    gap: 12px;
    max-width: 480px;
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

  p {
    color: var(--text-soft);
    line-height: 1.45;
  }

  .hero-card p {
    margin-top: 8px;
  }

  .mode-hint {
    margin-bottom: 10px;
    font-size: 13px;
  }

  .choice-row,
  .button-row,
  .signed-in-note {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .choice-row {
    margin-bottom: 8px;
  }

  .toggle-chip {
    min-width: 96px;
    padding: 10px 14px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-soft);
    color: var(--text);
    font-weight: 600;
    cursor: pointer;
  }

  .toggle-chip.active {
    border-color: var(--brand-strong);
    background: color-mix(in srgb, var(--brand-strong) 14%, var(--panel));
    color: var(--brand-strong);
  }

  .signed-in-note {
    margin-top: 12px;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
  }

  .field-label {
    display: block;
    margin-bottom: 6px;
    color: var(--text-soft);
    font-size: 12px;
  }

  input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text);
  }

  .helper-text,
  .status-note {
    margin: 0;
    font-size: 13px;
  }

  .status-note {
    color: var(--danger, #b91c1c);
  }
</style>
