<script lang="ts">
  import { page } from '$app/stores';
  import { dismissAuthActionNotice, authActionNoticeMessage, authActionNoticeVisible } from '$lib/stores/authActionNotice';

  let lastPath = '';

  $: if ($page.url.pathname !== lastPath) {
    if (lastPath) {
      dismissAuthActionNotice();
    }
    lastPath = $page.url.pathname;
  }
</script>

{#if $authActionNoticeVisible}
  <div class="auth-action-notice" role="status">
    <span>{$authActionNoticeMessage}</span>
    <a href="/onboarding">Sign in</a>
    <button class="dismiss" type="button" aria-label="Dismiss" on:click={dismissAuthActionNotice}>×</button>
  </div>
{/if}

<style>
  .auth-action-notice {
    position: fixed;
    left: 50%;
    bottom: calc(20px + var(--shell-bottom-nav-offset, 0px));
    z-index: 80;
    display: flex;
    gap: 12px;
    align-items: center;
    max-width: min(92vw, 520px);
    padding: 10px 10px 10px 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-main);
    font-size: 13px;
    box-shadow: 0 10px 30px color-mix(in srgb, black 18%, transparent);
    transform: translateX(-50%);
  }

  .auth-action-notice a {
    color: var(--brand-strong);
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;
  }

  .auth-action-notice a:hover {
    text-decoration: underline;
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
