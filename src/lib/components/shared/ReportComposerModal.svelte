<script lang="ts">
  import type { ContentReportReason } from '$lib/types/detail';
  import { createEventDispatcher } from 'svelte';

  export let open = false;
  export let itemLabel = 'item';
  export let reason: ContentReportReason = 'spam';
  export let description = '';
  export let pending = false;

  const dispatch = createEventDispatcher<{ close: void; submit: void }>();

  function closeModal() {
    dispatch('close');
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
    aria-hidden="true"
    class="report-modal-backdrop"
    on:click={handleBackdropClick}
    on:keydown={handleBackdropKeydown}
    tabindex="-1"
  >
    <div
      aria-label={`Report ${itemLabel}`}
      aria-modal="true"
      class="report-modal"
      role="dialog"
      tabindex="-1"
    >
      <div class="report-modal-copy">
        <h2>Report {itemLabel}</h2>
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
        <button class="primary-button" disabled={pending} type="button" on:click={submitModal}>
          Submit report
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .report-modal-backdrop,
  .report-modal,
  .field-stack,
  .report-modal-copy {
    display: grid;
    gap: 12px;
  }

  .report-modal-backdrop {
    position: fixed;
    inset: 0;
    place-items: center;
    padding: 24px;
    background: color-mix(in srgb, var(--text-main) 20%, transparent);
    z-index: 80;
  }

  .report-modal {
    width: min(420px, calc(100vw - 40px));
    padding: 18px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-md);
    background: white;
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
    background: white;
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