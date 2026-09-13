<script lang="ts">
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';

  export let open = false;
  export let value = '';
  export let placeholder = 'Add a value';
  export let onSubmit: () => void | Promise<void> = () => {};

  async function handleSubmit() {
    await onSubmit();
  }
</script>

<OverlaySheet bind:open title="Add value" labelledById="add-value-sheet">
  <form class="add-value-form" on:submit|preventDefault={handleSubmit}>
    <label class="field">
      <span class="field-label">What should this achieve?</span>
      <input bind:value maxlength="160" {placeholder} />
    </label>
    <div class="actions">
      <button class="secondary-button" type="button" on:click={() => (open = false)}>Cancel</button>
      <button class="primary-button" disabled={!value.trim()} type="submit">Add value</button>
    </div>
  </form>
</OverlaySheet>

<style>
  .add-value-form {
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

  input {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
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
