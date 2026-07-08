<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import CreateMenuIcon from '$lib/app/shell/CreateMenuIcon.svelte';
  import { createContentLinks, createSurfaceLinks } from '$lib/app/shell/createMenuItems';

  export let open = false;
  export let viewerLoggedIn = false;

  const dispatch = createEventDispatcher<{ close: void }>();

  function closeMenu() {
    open = false;
    dispatch('close');
  }

  function toggleMenu() {
    open = !open;
    if (!open) {
      dispatch('close');
    }
  }

  function handleNavigate() {
    closeMenu();
  }

  function handleBackdropClick() {
    closeMenu();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      closeMenu();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if viewerLoggedIn}
  {#if open}
    <button aria-label="Close create menu" class="fab-backdrop" type="button" on:click={handleBackdropClick}></button>
  {/if}

  <div class="create-fab-shell">
    {#if open}
      <div class="create-menu" role="menu" aria-label="Create">
        <p class="menu-kicker">Content</p>
        {#each createContentLinks as link}
          <a class="create-menu-item" href={link.href} role="menuitem" on:click={handleNavigate}>
            <CreateMenuIcon icon={link.icon} />
            <span class="item-copy">
              <span class="item-label">{link.label}</span>
              <span class="item-description">{link.description}</span>
            </span>
          </a>
        {/each}

        <p class="menu-kicker menu-kicker-separated">Surfaces</p>
        {#each createSurfaceLinks as link}
          <a class="create-menu-item" href={link.href} role="menuitem" on:click={handleNavigate}>
            <CreateMenuIcon icon={link.icon} />
            <span class="item-copy">
              <span class="item-label">{link.label}</span>
              <span class="item-description">{link.description}</span>
            </span>
          </a>
        {/each}
      </div>
    {/if}

    <button
      aria-expanded={open}
      aria-haspopup="menu"
      aria-label={open ? 'Close create menu' : 'Create'}
      class="fab-button"
      class:fab-button-open={open}
      type="button"
      on:click={toggleMenu}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" class="fab-icon">
        {#if open}
          <path d="M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none" />
        {:else}
          <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none" />
        {/if}
      </svg>
    </button>
  </div>
{/if}

<style>
  .fab-backdrop {
    position: fixed;
    inset: 0;
    z-index: 55;
    border: none;
    padding: 0;
    background: transparent;
    cursor: default;
  }

  .create-fab-shell {
    position: fixed;
    right: calc(var(--right-width, 0px) + 12px);
    bottom: calc(var(--shell-bottom-nav-offset, 0px) + 12px);
    z-index: 56;
    display: grid;
    justify-items: end;
    gap: 10px;
    pointer-events: none;
  }

  .create-fab-shell .fab-button,
  .create-fab-shell .create-menu {
    pointer-events: auto;
  }

  .fab-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    padding: 0;
    border: none;
    border-radius: 999px;
    background: var(--brand);
    color: #fff;
    box-shadow: 0 8px 24px color-mix(in srgb, var(--brand) 35%, transparent);
    cursor: pointer;
    transition: transform 0.16s ease, background-color 0.16s ease;
  }

  .fab-button:hover {
    transform: scale(1.04);
  }

  .fab-button-open {
    background: var(--panel-strong);
    color: var(--text-main);
    border: 1px solid var(--panel-border);
    box-shadow: 0 4px 16px color-mix(in srgb, var(--page-bg) 50%, transparent);
  }

  .fab-icon {
    width: 22px;
    height: 22px;
  }

  .create-menu {
    width: min(86vw, 320px);
    max-height: min(62vh, 480px);
    overflow-y: auto;
    display: grid;
    gap: 4px;
    padding: 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    box-shadow: 0 12px 32px color-mix(in srgb, var(--page-bg) 65%, transparent);
  }

  .menu-kicker {
    margin: 0;
    padding: 4px 8px 2px;
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .menu-kicker-separated {
    margin-top: 6px;
    padding-top: 10px;
    border-top: 1px solid var(--panel-border);
  }

  .create-menu-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px;
    border-radius: var(--radius-sm);
    color: var(--text-main);
    text-decoration: none;
    transition: background-color 0.16s ease;
  }

  .create-menu-item:hover {
    background: var(--brand-soft);
  }

  .item-copy {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .item-label {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-main);
  }

  .item-description {
    font-size: 12px;
    line-height: 1.4;
    color: var(--text-soft);
  }

  @media (min-width: 1081px) {
    .create-fab-shell {
      right: calc(var(--right-width, 0px) + 20px);
      bottom: 20px;
    }
  }
</style>
