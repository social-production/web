<script lang="ts">
  import { dismissToast, toasts } from '$lib/stores/toast';
</script>

<div class="toast-host" aria-live="polite">
  {#each $toasts as toast (toast.id)}
    <div class="toast" class:error={toast.tone === 'error'} role={toast.tone === 'error' ? 'alert' : 'status'}>
      <span>{toast.message}</span>
      <button class="dismiss" type="button" aria-label="Dismiss" title="Dismiss" on:click={() => dismissToast(toast.id)}>×</button>
    </div>
  {/each}
</div>

<style>
  .toast-host {
    position: fixed;
    left: 50%;
    bottom: calc(20px + var(--shell-bottom-nav-offset, 0px));
    z-index: 85;
    display: grid;
    gap: 8px;
    justify-items: center;
    width: min(92vw, 420px);
    transform: translateX(-50%);
    pointer-events: none;
  }

  .toast {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 10px 10px 10px 14px;
    border: 1px solid var(--brand);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-main);
    font-size: 13px;
    box-shadow: 0 10px 30px color-mix(in srgb, black 18%, transparent);
    pointer-events: auto;
  }

  .toast.error {
    border-color: var(--danger);
  }

  .dismiss {
    border: none;
    background: transparent;
    color: var(--text-soft);
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    padding: 0 2px;
  }
</style>
