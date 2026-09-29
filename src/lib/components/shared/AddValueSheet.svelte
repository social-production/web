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

<OverlaySheet bind:open hideClose title="Add value" labelledById="add-value-sheet">
  <form id="add-value-form" class="add-value-form" on:submit|preventDefault={handleSubmit}>
    <label class="field">
      <span class="field-label">What should this achieve?</span>
      <input bind:value maxlength="160" {placeholder} />
    </label>
  </form>
  <svelte:fragment slot="footer">
    <div class="sheet-actions">
      <button class="sheet-cancel" type="button" on:click={() => (open = false)}>Cancel</button>
      <button class="sheet-submit" disabled={!value.trim()} form="add-value-form" type="submit">Add value</button>
    </div>
  </svelte:fragment>
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
</style>
