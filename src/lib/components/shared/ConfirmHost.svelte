<script lang="ts">
  import { portal } from '$lib/utils/portal';
  import { confirmRequest, settleConfirm } from '$lib/stores/confirmDialog';

  let confirmButton: HTMLButtonElement | null = null;

  $: if ($confirmRequest && confirmButton) confirmButton.focus();
</script>

<svelte:window
  on:keydown={(event) => {
    if ($confirmRequest && event.key === 'Escape') settleConfirm(false);
  }}
/>

{#if $confirmRequest}
  <div class="confirm-root" use:portal={'body'}>
    <button
      class="confirm-scrim"
      type="button"
      aria-label="Cancel"
      on:click={() => settleConfirm(false)}
    ></button>
    <div
      class="confirm-card"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <h2 id="confirm-dialog-title">{$confirmRequest.title}</h2>
      {#if $confirmRequest.body}
        <p>{$confirmRequest.body}</p>
      {/if}
      <div class="confirm-actions">
        <button class="keep" type="button" on:click={() => settleConfirm(false)}>Keep</button>
        <button
          bind:this={confirmButton}
          class="go"
          class:danger={$confirmRequest.danger}
          type="button"
          on:click={() => settleConfirm(true)}
        >
          {$confirmRequest.confirmLabel ?? 'Confirm'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .confirm-root {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: grid;
    place-items: center;
    padding: 16px;
  }

  .confirm-scrim {
    position: absolute;
    inset: 0;
    border: 0;
    background: var(--shell-scrim, rgba(0, 0, 0, 0.4));
  }

  .confirm-card {
    position: relative;
    display: grid;
    gap: 10px;
    width: min(360px, 100%);
    padding: 20px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-md, 14px);
    background: var(--panel);
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.25);
  }

  h2 {
    margin: 0;
    color: var(--text-main);
    font-size: 17px;
    font-weight: 800;
  }

  p {
    margin: 0;
    color: var(--text-soft);
    font-size: 14px;
    line-height: 1.5;
  }

  .confirm-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 6px;
  }

  .confirm-actions button {
    min-height: 44px;
    border: 0;
    border-radius: var(--radius-sm, 10px);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .keep {
    background: var(--panel-strong);
    color: var(--text-main);
  }

  .go {
    background: var(--brand);
    color: var(--page-bg, #fff);
  }

  .go.danger {
    background: var(--danger, #c0392b);
    color: #fff;
  }
</style>
