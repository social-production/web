<script lang="ts">
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';

  export let open = false;
  export let body = '';
  export let message = '';
  export let pending = false;
  export let sheetTitle = 'Add update';
  export let submitLabel = 'Propose update';
  export let placeholder = 'Share what changed...';
  export let labelledById = 'add-update-sheet';
  export let onSubmit: () => void | Promise<void> = () => {};

  async function handleSubmit() {
    await onSubmit();
  }
</script>

<OverlaySheet bind:open title={sheetTitle} {labelledById}>
  <form class="update-form" on:submit|preventDefault={handleSubmit}>
    {#if message}
      <div class="warning-card" role="alert">{message}</div>
    {/if}
    <label class="field">
      <span class="field-label">Update</span>
      <textarea bind:value={body} rows="5" {placeholder}></textarea>
    </label>
    <div class="actions">
      <button class="secondary-button" type="button" on:click={() => (open = false)}>Cancel</button>
      <button class="primary-button" disabled={pending || !body.trim()} type="submit">
        {submitLabel}
      </button>
    </div>
  </form>
</OverlaySheet>

<style>
  .update-form {
    display: grid;
    gap: 16px;
    padding: 8px 16px 4px;
  }

  .field {
    display: grid;
    gap: 6px;
  }

  .field-label {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
    resize: vertical;
    min-height: 120px;
  }

  .warning-card {
    padding: 12px 14px;
    border: 1px solid color-mix(in srgb, var(--status-yellow) 50%, var(--panel-border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--status-yellow) 14%, var(--panel-strong));
    color: var(--text-main);
    font-size: 13px;
    font-weight: 700;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
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
    border: 1px solid var(--brand);
    background: var(--brand);
    color: var(--page-bg);
  }

  .primary-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .secondary-button {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    color: var(--text-soft);
  }
</style>
