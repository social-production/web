<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import * as m from '$lib/paraglide/messages';
  import type { BootstrapPayload } from '$lib/types/bootstrap';

  export let open = false;
  export let bootstrap: BootstrapPayload;
  export let isActive: (href: string) => boolean = () => false;

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  function close() {
    dispatch('close');
  }

  function handleNavigate() {
    close();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      close();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

{#if open}
  <button aria-label="Close menu" class="sheet-backdrop" type="button" on:click={close}></button>

  <div class="more-sheet" role="dialog" aria-modal="true" aria-label="More menu">
    <header class="sheet-header">
      <h2>More</h2>
    </header>

    <div class="sheet-links">
      {#if bootstrap.viewer}
        <a
          class:active-link={isActive(`/profile/${bootstrap.viewer.username}`)}
          class="sheet-link"
          href={`/profile/${bootstrap.viewer.username}`}
          on:click={handleNavigate}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8" /><path d="M6.2 18.5c1.2-2.4 3.2-3.5 5.8-3.5s4.6 1.1 5.8 3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
          <span>{bootstrap.viewer.username}</span>
        </a>
      {:else}
        <a class="sheet-link" href="/onboarding" on:click={handleNavigate}>
          <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8" /><path d="M6.2 18.5c1.2-2.4 3.2-3.5 5.8-3.5s4.6 1.1 5.8 3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
          <span>{m.shell_nav_login()}</span>
        </a>
      {/if}

      <a
        class:active-link={isActive('/settings')}
        class="sheet-link"
        href="/settings"
        on:click={handleNavigate}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8" /><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
        <span>Settings</span>
      </a>

      <a
        class:active-link={isActive('/about') || isActive('/roadmap')}
        class="sheet-link"
        href="/about"
        on:click={handleNavigate}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8" /><path d="M12 11v5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /><circle cx="12" cy="8" r="0.9" fill="currentColor" /></svg>
        <span>{m.shell_nav_about()}</span>
      </a>
    </div>

    <button class="sheet-close" type="button" on:click={close}>Close</button>
  </div>
{/if}

<style>
  .sheet-backdrop {
    position: fixed;
    inset: 0;
    z-index: 70;
    border: none;
    padding: 0;
    background: var(--shell-scrim);
  }

  .more-sheet {
    position: fixed;
    inset: 0;
    z-index: 80;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    background: var(--panel);
  }

  .sheet-header {
    padding: calc(28px + var(--shell-safe-top, 0px)) 20px 18px;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 75%, transparent);
  }

  .sheet-header h2 {
    margin: 0;
    font-size: clamp(28px, 8vw, 36px);
    font-weight: 800;
    line-height: 1.08;
    letter-spacing: -0.02em;
  }

  .sheet-links {
    min-height: 0;
    overflow-y: auto;
    display: grid;
    align-content: start;
    gap: 4px;
    padding: 12px 12px 16px;
  }

  .sheet-link {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 0 12px;
    border-radius: var(--radius-sm);
    color: var(--text-main);
    font-size: 17px;
    font-weight: 700;
    text-align: left;
    background: transparent;
    border: none;
  }

  .sheet-link svg {
    width: 22px;
    height: 22px;
    flex: 0 0 auto;
  }

  .sheet-link:hover,
  .sheet-link.active-link {
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .sheet-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: calc(56px + var(--shell-safe-bottom, 0px));
    margin: 0;
    padding: 0 16px var(--shell-safe-bottom, 0px);
    border: 0;
    border-radius: 0;
    background: var(--danger);
    color: #fff;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
  }
</style>
