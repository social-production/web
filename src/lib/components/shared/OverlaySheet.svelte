<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { portal } from '$lib/utils/portal';

  export let open = false;
  export let title = '';
  export let labelledById = 'overlay-sheet-title';
  export let wide = false;

  const dispatch = createEventDispatcher<{ close: void }>();

  function close() {
    open = false;
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      close();
    }
  }

  function syncScrollLock(locked: boolean) {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    if (locked) {
      const scrollbarWidth = window.innerWidth - root.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      return;
    }
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  $: if (typeof document !== 'undefined') {
    syncScrollLock(open);
  }

  onDestroy(() => {
    syncScrollLock(false);
  });
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <div class="overlay-root" role="presentation" use:portal={'body'}>
    <button aria-label="Close" class="overlay-scrim" type="button" on:click={close}></button>
    <div
      aria-labelledby={labelledById}
      aria-modal="true"
      class="overlay-sheet"
      class:wide
      role="dialog"
    >
      <header class="overlay-header">
        <div class="overlay-header-copy">
          <h2 id={labelledById}>{title}</h2>
          <slot name="subtitle" />
        </div>
        <div class="overlay-header-actions">
          <slot name="header-actions" />
          <button class="overlay-close" type="button" on:click={close}>Close</button>
        </div>
      </header>
      <slot name="toolbar" />
      <div class="overlay-body">
        <slot />
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay-root {
    position: fixed;
    inset: 0;
    z-index: 80;
    display: grid;
    place-items: center;
    padding: 24px;
    pointer-events: auto;
  }

  .overlay-scrim {
    position: absolute;
    inset: 0;
    border: none;
    padding: 0;
    background: var(--shell-scrim);
    cursor: pointer;
  }

  .overlay-sheet {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr);
    width: min(520px, 100%);
    max-height: min(720px, calc(100dvh - 48px));
    overflow: hidden;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-md);
    background: var(--panel);
    box-shadow: 0 18px 48px color-mix(in srgb, var(--page-background) 55%, transparent);
  }

  .overlay-sheet.wide {
    width: min(680px, 100%);
  }

  .overlay-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 75%, transparent);
  }

  .overlay-header-copy {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  .overlay-header h2 {
    margin: 0;
    font-size: 17px;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .overlay-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .overlay-close {
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .overlay-body {
    min-height: 0;
    overflow-y: auto;
    padding: 8px 0 12px;
  }

  @media (max-width: 1080px) {
    .overlay-root {
      padding: 0;
      place-items: stretch;
    }

    .overlay-sheet {
      width: 100%;
      max-height: none;
      height: 100%;
      border-radius: 0;
      border: none;
    }

    .overlay-header {
      padding-top: calc(12px + var(--shell-safe-top, 0px));
    }

    .overlay-body {
      padding-bottom: calc(12px + var(--shell-safe-bottom, 0px));
    }
  }
</style>
