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
      <div class="report-modal-copy">
        <h2 id="report-composer-title">Report {itemLabel}</h2>
        <p>Choose a reason and add any useful context.</p>
      </div>

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

      <div class="report-actions">
        <button class="secondary-button" type="button" on:click={closeModal}>Cancel</button>
        <button class="primary-button" disabled={pending || !description.trim()} type="button" on:click={submitModal}>
          Submit report
        </button>
      </div>
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
  .report-modal-copy {
    display: grid;
    gap: 12px;
  }

  .report-modal {
    width: min(420px, calc(100vw - 40px));
  }

  @media (max-width: 760px) {
    .report-modal-backdrop {
      place-items: end stretch;
      padding: 0;
    }

    .report-modal {
      width: 100%;
      margin-bottom: var(--shell-bottom-nav-offset, 0px);
      padding-bottom: calc(18px + var(--shell-safe-bottom, 0px));
      border-radius: 16px 16px 0 0;
    }

    .report-actions {
      flex-direction: column;
    }

    .report-actions :global(button),
    .primary-button,
    .secondary-button {
      width: 100%;
      min-height: var(--shell-touch-min, 44px);
    }
  }

  .report-modal {
    padding: 18px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-md);
    background: var(--panel-soft);
    box-shadow: 0 18px 40px color-mix(in srgb, var(--text-main) 14%, transparent);
  }

  .report-modal-copy h2,
  .report-modal-copy p {
    margin: 0;
  }

  .report-modal-copy p,
  .field-label {
    color: var(--text-soft);
  }

  .field-label {
    font-size: 12px;
    font-weight: 700;
  }

  textarea,
  select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-main);
  }

  textarea {
    min-height: 100px;
    resize: vertical;
  }

  .report-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .primary-button,
  .secondary-button {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
  }

  .primary-button {
    background: var(--brand);
    color: var(--page-bg);
  }

  .secondary-button {
    border: 1px solid var(--panel-border);
    background: var(--panel-strong);
    color: var(--text-soft);
  }
</style>