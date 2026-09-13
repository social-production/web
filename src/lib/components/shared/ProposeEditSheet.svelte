<script lang="ts">
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';

  export let open = false;
  export let title = '';
  export let description = '';
  export let message = '';
  export let pending = false;
  export let sheetTitle = 'Propose Edit';
  export let submitLabel = 'Propose Edit';
  export let titlePlaceholder = 'Title';
  export let descriptionPlaceholder = 'Describe the change...';
  export let labelledById = 'propose-edit-sheet';
  export let onSubmit: () => void | Promise<void> = () => {};

  async function handleSubmit() {
    await onSubmit();
  }
</script>

<OverlaySheet bind:open title={sheetTitle} {labelledById}>
  <form class="edit-form" on:submit|preventDefault={handleSubmit}>
    {#if message}
      <div class="warning-card" role="alert">{message}</div>
    {/if}
    <label class="field">
      <span class="field-label">Title</span>
      <input bind:value={title} maxlength="120" placeholder={titlePlaceholder} />
    </label>
    <label class="field">
      <span class="field-label">Description</span>
      <textarea bind:value={description} rows="5" placeholder={descriptionPlaceholder}></textarea>
    </label>
    <div class="actions">
      <button class="secondary-button" type="button" on:click={() => (open = false)}>Cancel</button>
      <button class="primary-button" disabled={pending || !title.trim() || !description.trim()} type="submit">
        {submitLabel}
      </button>
    </div>
  </form>
</OverlaySheet>

<style>
  .edit-form {
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

  input,
  textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
  }

  textarea {
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
