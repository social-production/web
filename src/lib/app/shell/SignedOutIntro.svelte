<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  /** One line for first-time visitors on what the site is. Dismissed for good with ×. */
  const DISMISS_KEY = 'sp_intro_dismissed';

  let dismissed = true;

  onMount(() => {
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      dismissed = false;
    }
  });

  function dismiss() {
    dismissed = true;
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Private mode: hidden for this page view only.
    }
  }

  $: signupHref = `/onboarding?mode=signup&next=${encodeURIComponent($page.url.pathname)}`;
</script>

{#if !dismissed}
  <aside class="intro" aria-label="About Social Production">
    <p>
      <strong>Social Production</strong> is where people organise projects, events and help together,
      and decide things by vote.
    </p>
    <div class="actions">
      <a class="primary" href={signupHref}>Sign up</a>
      <a class="secondary" href="/about">How it works</a>
      <button aria-label="Dismiss" class="dismiss" type="button" on:click={dismiss}>×</button>
    </div>
  </aside>
{/if}

<style>
  .intro {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    margin: 0 0 12px;
    padding: 10px 8px 10px 14px;
    border: 1px solid color-mix(in srgb, var(--brand) 35%, var(--panel-border));
    border-radius: var(--radius-sm);
    background: var(--brand-soft);
  }

  p {
    flex: 1 1 260px;
    margin: 0;
    color: var(--text-main);
    font-size: 14px;
    line-height: 1.4;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .primary,
  .secondary {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    padding: 0 12px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
  }

  .primary {
    background: var(--brand);
    color: var(--page-bg);
  }

  .secondary {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    color: var(--text-main);
  }

  .dismiss {
    display: inline-grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 0;
    background: transparent;
    color: var(--text-soft);
    font-size: 20px;
    cursor: pointer;
  }
</style>
