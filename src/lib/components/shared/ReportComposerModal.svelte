<script lang="ts">
  import type { ContentReportReason } from '$lib/types/detail';
  import { createEventDispatcher } from 'svelte';
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';

  export let open = false;
  export let itemLabel = 'item';
  export let reason: ContentReportReason = 'spam';
  export let description = '';
  export let pending = false;

  const dispatch = createEventDispatcher<{ close: void; submit: void }>();
</script>

<!-- Same sheet as every other popup: footer × on the left, Submit on the right. -->
<OverlaySheet
  {open}
  title={`Report ${itemLabel}`}
  labelledById="report-composer-title"
  elevated
  on:close={() => dispatch('close')}
>
  <div class="report-body">
    <label class="field-stack">
      <span class="field-label">Reason</span>
      <select bind:value={reason}>
        <option value="spam">Spam</option>
        <option value="serious-harm">Serious harm</option>
      </select>
    </label>

    <label class="field-stack">
      <span class="field-label">What's wrong?</span>
      <textarea bind:value={description} placeholder="Add context for the report..." rows="4"
      ></textarea>
    </label>
  </div>

  <svelte:fragment slot="footer">
    <div class="sheet-actions">
      <button
        class="sheet-submit"
        disabled={pending || !description.trim()}
        type="button"
        on:click={() => dispatch('submit')}
      >
        {pending ? 'Sending…' : 'Submit report'}
      </button>
    </div>
  </svelte:fragment>
</OverlaySheet>

<style>
  .report-body {
    display: grid;
    gap: 14px;
    padding: 8px 16px 4px;
  }

  .field-stack {
    display: grid;
    gap: 6px;
  }

  .field-label {
    color: var(--text-main);
    font-size: 13px;
    font-weight: 700;
  }

  textarea,
  select {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-main);
    font: inherit;
  }

  textarea {
    resize: vertical;
  }
</style>
