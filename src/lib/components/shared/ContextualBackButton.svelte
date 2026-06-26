<script lang="ts">
  import { goto } from '$app/navigation';

  export let fallbackHref: string;
  export let label = 'Back';

  function handleBack() {
    if (typeof window === 'undefined') {
      return;
    }

    const referrer = document.referrer;
    let sameOriginReferrer = false;

    if (referrer) {
      try {
        sameOriginReferrer = new URL(referrer).origin === window.location.origin;
      } catch {
        sameOriginReferrer = false;
      }
    }

    if (window.history.length > 1 && sameOriginReferrer) {
      window.history.back();
      return;
    }

    void goto(fallbackHref);
  }
</script>

<div class="back-nav">
  <button class="back-button" type="button" on:click={handleBack}>
    <svg aria-hidden="true" class="back-chevron" viewBox="0 0 24 24">
      <path d="M14.7 5.3a1 1 0 0 1 0 1.4L10.41 11l4.3 4.3a1 1 0 0 1-1.42 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.41 0Z" fill="currentColor" />
    </svg>
    {label}
  </button>
</div>

<style>
  .back-nav {
    margin-bottom: 10px;
  }

  .back-button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .back-button:hover {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .back-chevron {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
</style>
