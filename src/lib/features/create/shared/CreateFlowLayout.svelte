<script lang="ts">
  import { goto } from '$app/navigation';
  import { createReturnHref } from '$lib/stores/createReturnState';

  export let showClose = true;
  export let closeFallbackHref = '/';

  function handleClose() {
    void goto(createReturnHref(closeFallbackHref));
  }
</script>

<div class="flow-layout">
  {#if showClose}
    <div class="flow-toolbar">
      <button class="close-button" type="button" aria-label="Close create" on:click={handleClose}>
        <svg aria-hidden="true" viewBox="0 0 24 24" class="close-icon">
          <path
            d="M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            fill="none"
          />
        </svg>
      </button>
    </div>
  {/if}

  <div class="primary-column">
    <slot name="primary" />
  </div>

  <div class="secondary-column">
    <slot name="secondary" />
  </div>
</div>

<style>
  .flow-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
    gap: 16px;
    align-items: start;
    position: relative;
  }

  .flow-toolbar {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
  }

  .close-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
    color: var(--text-main);
    cursor: pointer;
  }

  .close-button:hover {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .close-icon {
    width: 18px;
    height: 18px;
  }

  .primary-column,
  .secondary-column {
    display: grid;
    gap: 12px;
  }

  @media (max-width: 980px) {
    .flow-layout {
      grid-template-columns: 1fr;
    }
  }
</style>
