<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { signIn, signUp } from '$lib/services/queries/account';
  import type { OnboardingPageData } from '$lib/types/account';

  export let data: OnboardingPageData;

  let mode: 'login' | 'signup' = 'login';
  let username = '';
  let password = '';
  let profileBio = '';
  let statusMessage = '';
  let isSubmitting = false;

  $: viewer = $page.data.bootstrap?.viewer ?? null;

  async function handleSubmit() {
    isSubmitting = true;
    statusMessage = '';

    try {
      const result =
        mode === 'login'
          ? await signIn({ username, password })
          : await signUp({
              username,
              password,
              profileBio
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
    <h1>{data.title}</h1>
    <p>{data.intro}</p>
    {#if viewer}
      <div class="signed-in-note">
        <strong>Signed in as @{viewer.username}</strong>
        <button class="button-primary" type="button" on:click={() => goto('/')}>Go to feed</button>
      </div>
    {/if}
  </section>

  <section class="grid">
    <section class="panel">
      <h2>Account Mode</h2>
      <div class="choice-row">
        {#each data.accountModes as option}
          <button
            class:active={mode === option.value}
            class="toggle-chip"
            type="button"
            on:click={() => (mode = option.value as 'login' | 'signup')}
          >
            {option.label}
          </button>
        {/each}
      </div>

      <form class="stack" on:submit|preventDefault={handleSubmit}>
        <label>
          <span class="field-label">Username</span>
          <input bind:value={username} placeholder="Enter username" />
        </label>

        <label>
          <span class="field-label">Password</span>
          <input bind:value={password} type="password" placeholder="••••••••" />
        </label>

        {#if mode === 'signup'}
          <label>
            <span class="field-label">Bio</span>
            <textarea bind:value={profileBio} rows="4" placeholder="What kind of work do you want people to know you for?"></textarea>
          </label>
        {/if}

        <div class="button-row">
          <button class="button-primary" disabled={isSubmitting} type="submit">
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

    <section class="panel">
      <h2>Create Profile</h2>
      <div class="stack">
        <div class="option-row">
          <strong>One account, one profile</strong>
          <span>Your profile is just your profile. Add a bio if you want people to understand what kind of work you do.</span>
        </div>
        <div class="option-row">
          <strong>Privacy still lives in settings</strong>
          <span>Feed and follow controls still exist in Settings, but signup no longer asks you to pick a profile mode.</span>
        </div>
      </div>
    </section>
  </section>

  <section class="grid">
    <section class="panel">
      <h2>Starter Channels</h2>
      <div class="chip-row">
        {#each data.starterChannels as label}
          <span class="tag-chip">{label}</span>
        {/each}
      </div>
    </section>

    <section class="panel">
      <h2>Starter Communities</h2>
      <div class="chip-row">
        {#each data.starterCommunities as label}
          <span class="tag-chip community">{label}</span>
        {/each}
      </div>
    </section>
  </section>
</section>

<style>
  .page,
  .stack {
    display: grid;
    gap: 12px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .hero-card,
  .panel,
  .option-row {
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
  span {
    color: var(--text-soft);
    line-height: 1.45;
  }

  .hero-card p,
  .option-row span {
    margin-top: 6px;
  }

  .chip-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .choice-row,
  .button-row,
  .signed-in-note {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
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
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .toggle-chip {
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .toggle-chip.active {
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .tag-chip {
    display: inline-flex;
    padding: 7px 10px;
    border-radius: var(--radius-sm);
    background: var(--brand-soft);
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
  }

  .community {
    background: var(--accent-warm-soft);
    color: var(--accent-warm-strong);
  }

  .status-note {
    margin: 0;
    color: var(--accent-warm-strong);
  }

  @media (max-width: 760px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>