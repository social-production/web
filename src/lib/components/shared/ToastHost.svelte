<script lang="ts">
  import { dismissToast, toasts } from '$lib/stores/toast';
</script>

<div class="toast-host" aria-live="polite">
  {#each $toasts as toast (toast.id)}
    <button
      class="toast"
      class:error={toast.tone === 'error'}
      role={toast.tone === 'error' ? 'alert' : 'status'}
      type="button"
      title="Dismiss"
      on:click={() => dismissToast(toast.id)}
    >
      <span class="toast-icon" aria-hidden="true">{toast.tone === 'error' ? '!' : '✓'}</span>
      <span>{toast.message}</span>
    </button>
  {/each}
</div>

<style>
  /* A small snackbar: quiet, centred above the bottom bar on phones, bottom-left on desktop. */
  .toast-host {
    position: fixed;
    left: 50%;
    bottom: calc(16px + var(--shell-bottom-nav-offset, 0px));
    z-index: 85;
    display: grid;
    gap: 6px;
    justify-items: center;
    width: max-content;
    max-width: calc(100vw - 32px);
    transform: translateX(-50%);
    pointer-events: none;
  }

  @media (max-width: 899px) {
    .toast-host {
      bottom: calc(76px + env(safe-area-inset-bottom, 0px));
    }
  }

  @media (min-width: 900px) {
    .toast-host {
      left: 24px;
      bottom: 24px;
      justify-items: start;
      transform: none;
    }
  }

  .toast {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    padding: 8px 14px 8px 10px;
    border: 0;
    border-radius: 999px;
    background: color-mix(in srgb, var(--text-main) 88%, transparent);
    color: var(--page-background, #fff);
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 6px 18px color-mix(in srgb, black 22%, transparent);
    pointer-events: auto;
    cursor: pointer;
    animation: toast-in 0.18s ease-out;
  }

  .toast-icon {
    display: inline-grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: var(--brand);
    color: var(--on-brand, #fff);
    font-size: 11px;
    font-weight: 800;
  }

  .toast.error .toast-icon {
    background: var(--danger);
    color: #fff;
  }

  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .toast {
      animation: none;
    }
  }
</style>
