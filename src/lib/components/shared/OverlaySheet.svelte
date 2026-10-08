<script lang="ts">
  import { afterUpdate, createEventDispatcher, onDestroy } from 'svelte';
  import { portal } from '$lib/utils/portal';
  import { fitText } from '$lib/utils/fitText';

  export let open = false;
  export let title = '';
  export let labelledById = 'overlay-sheet-title';
  export let wide = false;
  export let elevated = false;
  export let activity = false;
  export let hideClose = false;

  const dispatch = createEventDispatcher<{ close: void }>();
  let footerEl: HTMLElement | null = null;
  let inlineClose = false;
  let showClose = !hideClose;
  let footerObserver: MutationObserver | null = null;

  function isCancelLabel(element: HTMLButtonElement) {
    return (element.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase() === 'cancel';
  }

  function syncClosePlacement() {
    if (!footerEl) {
      inlineClose = false;
      showClose = !hideClose;
      return;
    }

    const controls = [...footerEl.querySelectorAll('button:not(.sheet-close), a')];
    const hasCancel = controls.some((element) => element instanceof HTMLButtonElement && isCancelLabel(element));
    showClose = !hideClose || hasCancel;

    for (const element of controls) {
      if (element instanceof HTMLButtonElement) {
        element.classList.toggle('sheet-dismiss-duplicate', showClose && isCancelLabel(element));
      }
    }

    const count = controls.filter((element) => !element.classList.contains('sheet-dismiss-duplicate')).length;
    inlineClose = showClose && count > 0 && count < 3;
  }

  function watchFooter(node: HTMLElement) {
    footerEl = node;
    footerObserver?.disconnect();
    footerObserver = new MutationObserver(syncClosePlacement);
    footerObserver.observe(node, { childList: true, subtree: true });
    syncClosePlacement();
    return {
      destroy() {
        footerObserver?.disconnect();
        footerObserver = null;
        if (footerEl === node) {
          footerEl = null;
        }
      }
    };
  }

  afterUpdate(syncClosePlacement);

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
          <h2 id={labelledById} use:fitText={{ min: 13, text: title }}>
            <slot name="title">{title}</slot>
          </h2>
          <slot name="subtitle" />
        </div>
        <div class="overlay-header-actions">
          <slot name="header-actions" />
          {#if showClose && !inlineClose}
            <button aria-label="Close" class="overlay-close header-close" type="button" on:click={close}>×</button>
          {/if}
        </div>
      </header>
      {#if $$slots.toolbar}
        <div class="overlay-toolbar">
          <slot name="toolbar" />
        </div>
      {/if}
      <div class="overlay-body">
        <slot />
      </div>
      <footer
        class="overlay-footer"
        class:has-actions={Boolean($$slots.footer)}
        class:inline-close={inlineClose}
        use:watchFooter
      >
        {#if showClose}
          <button aria-label="Close" class="overlay-close sheet-close" type="button" on:click={close}>×</button>
        {/if}
        <slot name="footer" />
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

  button.overlay-scrim.overlay-scrim:hover,
  button.overlay-scrim.overlay-scrim:focus-visible {
    background: var(--shell-scrim);
    color: inherit;
    filter: none;
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

  .overlay-sheet.activity .header-close {
    align-self: stretch;
    height: auto;
    border-left: 1px solid var(--panel-border);
    border-radius: 0;
    background: transparent;
  }

  .overlay-header {
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: 12px;
    padding: 0 0 0 16px;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 75%, transparent);
  }

  .overlay-header-copy {
    min-width: 0;
    display: grid;
    gap: 4px;
    align-content: center;
    padding: 14px 0;
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
    align-self: stretch;
    gap: 0;
    flex-shrink: 0;
    padding-right: 8px;
  }

  .overlay-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    min-width: 44px;
    height: 44px;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: var(--panel-strong);
    color: var(--text-main);
    font-size: 22px;
    font-weight: 500;
    line-height: 1;
    cursor: pointer;
  }

  .overlay-close:hover {
    background: var(--brand-soft);
    color: var(--brand-strong);
    filter: none;
    transform: none;
  }

  :global(.overlay-footer .sheet-dismiss-duplicate) {
    display: none !important;
  }

  .header-close {
    align-self: center;
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
    gap: 0;
    padding: 0;
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

  :global(.overlay-footer.inline-close > .sheet-actions),
  :global(.overlay-footer.inline-close > .vote-footer) {
    flex: 1 1 auto;
    width: auto;
    min-width: 0;
  }

  .overlay-footer.inline-close {
    flex-direction: row;
    align-items: stretch;
  }

  .overlay-footer.inline-close .sheet-close {
    display: flex;
    flex: 0 0 56px;
    align-self: stretch;
    width: 56px;
    min-width: 56px;
    height: auto;
    min-height: 56px;
    border-right: 1px solid var(--panel-border);
    background: var(--panel-strong);
    color: var(--text-main);
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

  :global(.overlay-footer .sheet-actions > .sheet-cancel:hover:not(:disabled)) {
    background: var(--brand-soft);
    color: var(--brand-strong);
    filter: none;
  }

  :global(.overlay-footer .sheet-actions > .sheet-submit) {
    background: var(--brand);
    color: var(--page-bg);
  }

  :global(.overlay-footer .sheet-actions > .sheet-submit:hover:not(:disabled)) {
    background: var(--brand);
    color: var(--page-bg);
    filter: none;
  }

  :global(.overlay-footer .sheet-actions > .sheet-submit:disabled) {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .overlay-toolbar:empty {
    display: block;
    height: 0;
    overflow: hidden;
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
      padding-top: 0;
    }

    .overlay-header-copy {
      padding-top: calc(14px + var(--shell-safe-top, 0px));
    }

    .overlay-body {
      padding-bottom: calc(12px + var(--shell-safe-bottom, 0px));
    }

    .overlay-sheet.has-footer .overlay-body {
      padding-bottom: 8px;
    }

    .overlay-footer {
      padding: 0;
    }
  }

  @media (max-width: 760px) {
    .overlay-root {
      place-items: stretch;
      padding: 0;
    }

    :global(.overlay-footer:has(.sheet-actions)),
    :global(.overlay-footer:has(.vote-dock)),
    :global(.overlay-footer:has(.vote-footer)) {
      padding-bottom: 0;
    }

    .overlay-footer:not(.has-actions),
    .overlay-footer:not(.inline-close):not(:has(:not(.sheet-close))) {
      display: none;
    }

    .overlay-footer.inline-close,
    .overlay-footer.inline-close.has-actions {
      flex-direction: row;
    }

    .overlay-footer.inline-close .sheet-close {
      min-height: calc(56px + var(--shell-safe-bottom, 0px));
      padding-bottom: var(--shell-safe-bottom, 0px);
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
      align-items: stretch;
      padding: 0 0 0 20px;
    }

    .overlay-header-copy {
      padding-top: calc(28px + var(--shell-safe-top, 0px));
      padding-bottom: 18px;
    }

    .overlay-header h2 {
      font-size: clamp(16px, 4.8vw, 20px);
      line-height: 1.2;
    }

    .overlay-footer.has-actions {
      flex-direction: column;
      gap: 0;
      padding: 0;
    }

    .overlay-footer.has-actions:not(:has(.sheet-actions, .choice-bar, .vote-footer)) {
      padding-bottom: var(--shell-safe-bottom, 0px);
    }

    .overlay-footer.has-actions:has(.sheet-actions, .choice-bar, .vote-footer) {
      padding-bottom: 0 !important;
    }

    .overlay-footer.has-actions :global(.sheet-actions > button),
    .overlay-footer.has-actions :global(.choice-bar > .choice),
    .overlay-footer.has-actions :global(.vote-footer > .vote-next:last-child) {
      min-height: calc(56px + var(--shell-safe-bottom, 0px));
      padding-bottom: calc(8px + var(--shell-safe-bottom, 0px));
    }

    .overlay-footer.has-actions :global(.sheet-actions) {
      display: flex;
      width: 100%;
    }

    .overlay-footer.has-actions :global(.sheet-actions > button) {
      flex: 1 1 0;
      min-height: 56px;
      border: 0;
      border-radius: 0;
      border-right: 1px solid var(--panel-border);
      font-size: 16px;
      font-weight: 800;
    }

    .overlay-footer.has-actions :global(.sheet-actions > button:last-child) {
      border-right: 0;
    }
  }
</style>
