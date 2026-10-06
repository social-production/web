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
        <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" /></svg>
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
    z-index: var(--z-sheet);
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    padding-top: var(--shell-safe-top, 0px);
    background: var(--panel);
  }

  .sheet-links {
    min-height: 0;
    display: grid;
    grid-template-rows: repeat(3, minmax(96px, 1fr));
    gap: 0;
  }

  .sheet-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
    min-height: 96px;
    padding: 0 24px;
    border: none;
    border-bottom: 1px solid var(--panel-border);
    border-radius: 0;
    background: var(--panel);
    color: var(--text-main);
    font-size: 20px;
    font-weight: 800;
    text-align: center;
  }

  .sheet-link svg {
    width: 48px;
    height: 48px;
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
