<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { portal } from '$lib/utils/portal';

  export let open = false;
  export let title = '';
  export let labelledById = 'overlay-sheet-title';
  export let wide = false;
  export let elevated = false;
  export let activity = false;
  export let hideClose = false;

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
  <div class="overlay-root" class:elevated role="presentation" use:portal={'body'}>
    <button aria-label="Close" class="overlay-scrim" type="button" on:click={close}></button>
    <div
      aria-labelledby={labelledById}
      aria-modal="true"
      class="overlay-sheet"
      class:activity
      class:has-footer={true}
      class:has-toolbar={Boolean($$slots.toolbar)}
      class:wide
      role="dialog"
    >
      <header class="overlay-header">
        <div class="overlay-header-copy">
          <h2 id={labelledById}>
            <slot name="title">{title}</slot>
          </h2>
          <slot name="subtitle" />
        </div>
        <div class="overlay-header-actions">
          <slot name="header-actions" />
          {#if !hideClose}
            <button class="overlay-close header-close" type="button" on:click={close}>Close</button>
          {/if}
        </div>
      </header>
      <slot name="toolbar" />
      <div class="overlay-body">
        <slot />
      </div>
      <footer class="overlay-footer" class:has-actions={Boolean($$slots.footer)}>
        <slot name="footer" />
        {#if !hideClose}
          <button class="overlay-close sheet-close" type="button" on:click={close}>Close</button>
        {/if}
      </footer>
    </div>
  </div>
{/if}

<style>
  .overlay-root {
    position: fixed;
    inset: 0;
    z-index: var(--z-sheet);
    display: grid;
    place-items: center;
    padding: 24px;
    pointer-events: auto;
  }

  .overlay-root.elevated {
    z-index: var(--z-sheet-elevated);
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
    grid-template-rows: auto minmax(0, 1fr);
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

  .overlay-sheet.activity {
    width: min(640px, 100%);
    background: var(--panel);
  }

  .overlay-sheet.activity .overlay-body {
    padding: 16px 20px 24px;
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
    overflow-x: clip;
    overflow-y: auto;
    padding: 8px 0 12px;
  }

  .overlay-footer {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px 20px;
    border-top: 1px solid color-mix(in srgb, var(--panel-border) 75%, transparent);
    background: var(--panel);
  }

  .overlay-footer:not(.has-actions),
  .overlay-footer:not(:has(:not(.sheet-close))) {
    display: none;
  }

  .sheet-close {
    display: none;
  }

  :global(.overlay-footer:has(.sheet-actions)) {
    gap: 0;
    padding: 0;
    padding-bottom: var(--shell-safe-bottom, 0px);
    border-top: 0;
  }

  :global(.overlay-footer .sheet-actions) {
    display: flex;
    width: 100%;
  }

  :global(.overlay-footer .sheet-actions > .sheet-cancel),
  :global(.overlay-footer .sheet-actions > .sheet-submit) {
    flex: 1 1 0;
    min-height: 56px;
    margin: 0;
    padding: 8px;
    border: 0;
    border-radius: 0;
    font-size: 16px;
    font-weight: 800;
    line-height: 1.15;
    white-space: normal;
    cursor: pointer;
  }

  :global(.overlay-footer .sheet-actions > .sheet-cancel) {
    background: var(--panel-strong);
    color: var(--text-main);
    box-shadow: inset -1px 0 0 var(--panel-border);
  }

  :global(.overlay-footer .sheet-actions > .sheet-submit) {
    background: var(--brand);
    color: var(--page-bg);
  }

  :global(.overlay-footer .sheet-actions > .sheet-submit:disabled) {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .overlay-sheet.has-toolbar {
    grid-template-rows: auto auto minmax(0, 1fr);
  }

  .overlay-sheet.has-footer {
    grid-template-rows: auto minmax(0, 1fr) auto;
  }

  .overlay-sheet.has-toolbar.has-footer {
    grid-template-rows: auto auto minmax(0, 1fr) auto;
  }

  @media (max-width: 1080px) {
    .overlay-root:not(:has(.overlay-sheet.activity)) {
      padding: 0;
      place-items: stretch;
    }

    .overlay-sheet:not(.activity) {
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

    .overlay-sheet.has-footer .overlay-body {
      padding-bottom: 8px;
    }

    .overlay-footer {
      padding: 14px 16px calc(24px + var(--shell-safe-bottom, 0px));
    }
  }

  @media (max-width: 760px) {
    .overlay-root {
      place-items: stretch;
      padding: 0;
    }

    .header-close {
      display: none;
    }

    .overlay-footer,
    .overlay-footer:not(.has-actions) {
      display: flex;
    }

    .overlay-footer.has-actions .sheet-close {
      display: none;
    }

    .sheet-close {
      display: inline-flex;
      width: 100%;
      min-height: 56px;
      align-items: center;
      justify-content: center;
      border: 0;
      border-radius: 0;
      font-size: 16px;
    }

    .overlay-sheet,
    .overlay-sheet.activity {
      width: 100%;
      height: 100dvh;
      max-height: 100dvh;
      margin: 0;
      border: none;
      border-radius: 0;
    }

    .overlay-header {
      align-items: flex-end;
      padding: 28px 20px 18px;
      padding-top: calc(36px + var(--shell-safe-top, 0px));
    }

    .overlay-header h2 {
      font-size: clamp(28px, 8vw, 36px);
      line-height: 1.08;
    }

    .overlay-footer.has-actions {
      flex-direction: row;
      gap: 0;
      padding: 0;
      padding-bottom: var(--shell-safe-bottom, 0px);
    }

    .overlay-footer.has-actions :global(button) {
      flex: 1 1 0;
      min-height: 56px;
      border: 0;
      border-radius: 0;
      border-right: 1px solid var(--panel-border);
      font-size: 16px;
      font-weight: 800;
    }

    .overlay-footer.has-actions :global(button:last-child) {
      border-right: 0;
    }
  }
</style>
