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
  <p slot="subtitle" class="sheet-lead">
    Change the title and description. Others can review this before it applies.
  </p>
  <form id={labelledById + '-form'} class="edit-form" on:submit|preventDefault={handleSubmit}>
    {#if message}
      <div class="warning-card" role="alert">{message}</div>
    {/if}
    <label class="field">
      <span class="field-label">Title</span>
      <input bind:value={title} maxlength="120" placeholder={titlePlaceholder} />
    </label>
    <label class="field">
      <span class="field-label">Description</span>
      <textarea bind:value={description} rows="6" placeholder={descriptionPlaceholder}></textarea>
    </label>
  </form>
  <div slot="footer" class="sheet-actions">
    <button class="sheet-cancel" type="button" on:click={() => (open = false)}>Cancel</button>
    <button
      class="sheet-submit"
      disabled={pending || !title.trim() || !description.trim()}
      form={labelledById + '-form'}
      type="submit"
    >
      {pending ? 'Working...' : submitLabel}
    </button>
  </div>
</OverlaySheet>

<style>
  .edit-form {
    display: grid;
    gap: 16px;
    padding: 8px 20px 20px;
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

  .sheet-lead {
    margin: 6px 0 0;
    color: var(--text-soft);
    font-size: 15px;
    line-height: 1.45;
  }

  .sheet-actions {
    display: flex;
    width: 100%;
  }

  .sheet-cancel,
  .sheet-submit {
    flex: 1 1 0;
    min-height: 52px;
    border: 0;
    border-radius: 0;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
  }

  .sheet-cancel {
    border-right: 1px solid var(--panel-border);
    background: var(--panel-strong);
    color: var(--text-main);
  }

  .sheet-submit {
    background: var(--brand);
    color: var(--page-bg);
  }

  .sheet-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
