<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import * as m from '$lib/paraglide/messages';
  import type { BootstrapPayload } from '$lib/types/bootstrap';

  export let open = false;
  export let bootstrap: BootstrapPayload;
  export let isActive: (href: string) => boolean = () => false;

  const dispatch = createEventDispatcher<{
    close: void;
    openCreate: void;
    openActivity: void;
  }>();

  function close() {
    dispatch('close');
  }

  function handleNavigate() {
    close();
  }

  function handleOpenCreate() {
    dispatch('openCreate');
    close();
  }

  function handleOpenActivity() {
    dispatch('openActivity');
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
    <div class="sheet-handle" aria-hidden="true"></div>

    <div class="sheet-links">
      {#if bootstrap.viewer}
        <a
          class:active-link={isActive(`/profile/${bootstrap.viewer.username}`)}
          class="sheet-link"
          href={`/profile/${bootstrap.viewer.username}`}
          on:click={handleNavigate}
        >
          {bootstrap.viewer.username}
        </a>
      {:else}
        <a class="sheet-link" href="/onboarding" on:click={handleNavigate}>{m.shell_nav_login()}</a>
      {/if}

      <a
        class:active-link={isActive('/settings')}
        class="sheet-link"
        href="/settings"
        on:click={handleNavigate}
      >
        Settings
      </a>

      <a
        class:active-link={isActive('/about') || isActive('/roadmap')}
        class="sheet-link"
        href="/about"
        on:click={handleNavigate}
      >
        {m.shell_nav_about()}
      </a>
    </div>

    <div class="sheet-divider"></div>

    <div class="sheet-actions">
      <button class="sheet-action" type="button" on:click={handleOpenCreate}>
        Create
      </button>
      <button class="sheet-action" type="button" on:click={handleOpenActivity}>
        Activity
      </button>
    </div>
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
    left: 0;
    right: 0;
    bottom: var(--shell-bottom-nav-height);
    z-index: 75;
    display: grid;
    gap: 8px;
    padding: 8px 16px calc(12px + var(--shell-safe-bottom));
    border-top: 1px solid var(--panel-border);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    background: var(--panel);
    box-shadow: 0 -12px 32px color-mix(in srgb, var(--text-main) 14%, transparent);
    max-height: min(70vh, 420px);
    overflow-y: auto;
  }

  .sheet-handle {
    justify-self: center;
    width: 40px;
    height: 4px;
    border-radius: 999px;
    background: var(--panel-border);
    margin-bottom: 4px;
  }

  .sheet-links,
  .sheet-actions {
    display: grid;
    gap: 4px;
  }

  .sheet-link,
  .sheet-action {
    display: flex;
    align-items: center;
    min-height: var(--shell-touch-min);
    padding: 0 12px;
    border-radius: var(--radius-sm);
    color: var(--text-main);
    font-size: 15px;
    font-weight: 700;
    text-align: left;
    background: transparent;
    border: none;
    transition: background-color 0.16s ease, color 0.16s ease;
  }

  .sheet-link:hover,
  .sheet-link.active-link,
  .sheet-action:hover {
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .sheet-divider {
    height: 1px;
    background: var(--panel-border);
    margin: 4px 0;
  }
</style>
