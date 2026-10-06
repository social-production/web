<script lang="ts">
  import type { ContentReportReason } from '$lib/types/detail';
  import { createEventDispatcher, tick } from 'svelte';
  import { portal } from '$lib/utils/portal';

  export let open = false;
  export let itemLabel = 'item';
  export let reason: ContentReportReason = 'spam';
  export let description = '';
  export let pending = false;

  const dispatch = createEventDispatcher<{ close: void; submit: void }>();

  let dialogElement: HTMLDivElement | null = null;

  function closeModal() {
    dispatch('close');
  }

  async function focusDialog() {
    await tick();
    dialogElement?.querySelector<HTMLElement>('select, textarea, button')?.focus();
  }

  $: if (open) {
    void focusDialog();
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  function handleBackdropKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      closeModal();
    }
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (open && event.key === 'Escape') {
      closeModal();
    }
  }

  function submitModal() {
    dispatch('submit');
  }
</script>

<svelte:window on:keydown={handleWindowKeydown} />

{#if open}
  <div
    class="report-modal-backdrop"
    on:click={handleBackdropClick}
    on:keydown={handleBackdropKeydown}
    role="presentation"
    tabindex="-1"
    use:portal={'body'}
  >
    <div
      aria-labelledby="report-composer-title"
      aria-modal="true"
      bind:this={dialogElement}
      class="report-modal"
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="dialog"
      tabindex="-1"
    >
      <header class="report-header">
        <h2 id="report-composer-title">Report {itemLabel}</h2>
      </header>

      <div class="report-body">
        <label class="field-stack">
          <span class="field-label">Reason</span>
          <select bind:value={reason}>
            <option value="spam">Spam</option>
            <option value="serious-harm">Serious harm</option>
          </select>
        </label>

        <label class="field-stack">
          <span class="field-label">Description</span>
          <textarea bind:value={description} placeholder="Add context for the report..." rows="4"></textarea>
        </label>
      </div>

      <footer class="report-actions">
        <button class="secondary-button" type="button" on:click={closeModal}>Cancel</button>
        <button class="primary-button" disabled={pending || !description.trim()} type="button" on:click={submitModal}>
          Submit
        </button>
      </footer>
    </div>
  </div>
{/if}

<style>
  .report-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: var(--z-sheet-elevated);
    display: grid;
    place-items: center;
    padding: 24px;
    background: var(--shell-scrim);
  }

  .report-modal,
  .field-stack,
  .report-body {
    display: grid;
  }

  .report-modal {
    display: grid;
    gap: 0;
    grid-template-rows: auto minmax(0, 1fr) auto;
    width: min(420px, calc(100vw - 40px));
    max-height: min(720px, calc(100dvh - 48px));
    padding: 0;
    overflow: hidden;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-md);
    background: var(--panel);
    box-shadow: 0 18px 40px color-mix(in srgb, var(--text-main) 14%, transparent);
  }

  .report-header {
    display: flex;
    align-items: center;
    min-height: 52px;
    padding: 0 16px;
    border-bottom: 1px solid var(--panel-border);
  }

  .report-header h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 800;
  }

  .report-body {
    align-content: start;
    gap: 16px;
    min-height: 0;
    overflow-y: auto;
    padding: 16px;
  }

  .field-stack {
    align-content: start;
    gap: 6px;
  }

  @media (max-width: 760px) {
    .report-modal-backdrop {
      place-items: stretch;
      padding: 0;
    }

    .report-modal {
      width: 100%;
      height: 100dvh;
      max-height: 100dvh;
      margin: 0;
      border: none;
      border-radius: 0;
    }

    .report-header {
      min-height: calc(52px + var(--shell-safe-top, 0px));
      padding-top: var(--shell-safe-top, 0px);
    }

    .report-actions .primary-button,
    .report-actions .secondary-button {
      min-height: calc(56px + var(--shell-safe-bottom, 0px));
      padding-bottom: var(--shell-safe-bottom, 0px);
      font-size: 16px;
    }
  }

  .field-label {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  textarea,
  select {
    align-self: start;
    width: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-main);
  }

  select {
    height: 44px;
  }

  textarea {
    min-height: 120px;
    height: 120px;
    resize: vertical;
  }

  .report-actions {
    display: flex;
    align-items: stretch;
    gap: 0;
    width: 100%;
  }

  .primary-button,
  .secondary-button {
    flex: 1 1 0;
    min-height: 44px;
    margin: 0;
    padding: 0 12px;
    border: 0;
    border-radius: 0;
    border-right: 1px solid var(--panel-border);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }

  .primary-button {
    border-right: 0;
    background: var(--brand);
    color: var(--page-bg);
  }

  .primary-button:disabled {
    opacity: 0.55;
    cursor: default;
  }

  .secondary-button {
    background: var(--panel-strong);
    color: var(--text-main);
  }
</style>