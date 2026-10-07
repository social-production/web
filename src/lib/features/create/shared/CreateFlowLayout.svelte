<script lang="ts">
  import { createEventDispatcher, setContext } from 'svelte';
  import { goto } from '$app/navigation';
  import { writable } from 'svelte/store';
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import { createReturnHref } from '$lib/stores/createReturnState';
  import {
    CREATE_SHEET_CHROME,
    CREATE_SHEET_CLOSE,
    CREATE_SHEET_FOOTER,
    type CreateSheetChrome,
    type CreateSheetFooter
  } from './createSheetContext';

  export let title = 'Create';
  export let description = '';
  export let submitLabel = 'Create';
  export let submittingLabel = 'Creating...';
  export let canSubmit = false;
  export let isSubmitting = false;
  export let wizard = false;
  export let closeFallbackHref = '/';

  const dispatch = createEventDispatcher<{ submit: void }>();
  const footer = writable<CreateSheetFooter | null>(null);
  const chrome = writable<CreateSheetChrome | null>(null);

  let open = true;

  function handleClose() {
    open = false;
    void goto(createReturnHref(closeFallbackHref));
  }

  setContext(CREATE_SHEET_FOOTER, footer);
  setContext(CREATE_SHEET_CHROME, chrome);
  setContext(CREATE_SHEET_CLOSE, handleClose);
</script>

<OverlaySheet bind:open {title} labelledById="create-sheet-title" wide on:close={handleClose}>
  <svelte:fragment slot="subtitle">
    {#if description}
      <p class="sheet-description">{description}</p>
    {/if}
  </svelte:fragment>

  <svelte:fragment slot="toolbar">
    {#if $chrome && $chrome.steps.length > 1}
      <nav class="step-rail" aria-label="Create steps">
        {#each $chrome.steps as step, index}
          <button
            class="step-chip"
            class:active={index === $chrome.stepIndex}
            class:complete={index < $chrome.stepIndex}
            type="button"
            on:click={() => $chrome?.goTo(index)}
          >
            {step.title}
          </button>
        {/each}
      </nav>
    {/if}
  </svelte:fragment>

  <div class="sheet-form">
    <div class="sheet-fields">
      <slot name="primary" />
    </div>
  </div>

  <svelte:fragment slot="footer">
    <div class="sheet-actions">
      {#if wizard && $footer}
        <button class="sheet-cancel" type="button" on:click={$footer.onLeft}>
          {$footer.leftLabel}
        </button>
        <button class="sheet-submit" type="button" disabled={$footer.rightDisabled} on:click={$footer.onRight}>
          {$footer.rightLabel}
        </button>
      {:else if !wizard}
        <button class="sheet-cancel" type="button" on:click={handleClose}>Cancel</button>
        <button
          class="sheet-submit"
          type="button"
          disabled={!canSubmit || isSubmitting}
          on:click={() => dispatch('submit')}
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
      {/if}
    </div>
  </svelte:fragment>
</OverlaySheet>

<style>
  .sheet-description {
    margin: 0;
    color: var(--text-soft);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
  }

  .step-rail {
    display: flex;
    gap: 0;
    overflow-x: auto;
    padding: 0 8px;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 75%, transparent);
    background: var(--panel);
  }

  .step-chip {
    flex: 0 0 auto;
    margin: 0;
    padding: 10px 12px;
    border: none;
    border-bottom: 2px solid transparent;
    border-radius: 0;
    background: transparent;
    color: var(--text-soft);
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
  }

  .step-chip.active {
    border-bottom-color: var(--brand);
    color: var(--text-main);
  }

  .step-chip.complete {
    color: var(--text-main);
  }

  .sheet-form {
    display: grid;
    gap: 14px;
    padding: 8px 16px 16px;
  }

  .sheet-fields {
    display: grid;
    gap: 14px;
    min-width: 0;
  }

  .sheet-form :global(.panel) {
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
  }

  .sheet-form :global(.panel h2) {
    font-size: 15px;
    font-weight: 800;
  }

  .sheet-form :global(.panel .description) {
    margin-top: 4px;
    font-size: 13px;
  }

  .sheet-form :global(.panel .body) {
    margin-top: 8px;
  }

  .sheet-form :global(.panel.bare .body) {
    margin-top: 0;
  }
</style>
