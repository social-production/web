<script lang="ts">
  import { authActionNoticeVisible } from '$lib/stores/authActionNotice';
</script>

{#if $authActionNoticeVisible}
  <div class="auth-action-notice" role="status">
    <span>Sign in to vote, signal demand, or join.</span>
    <a href="/onboarding">Sign in</a>
  </div>
{/if}

<style>
  .auth-action-notice {
    position: fixed;
    left: 50%;
    bottom: 20px;
    z-index: 60;
    display: flex;
    gap: 12px;
    align-items: center;
    max-width: min(92vw, 520px);
    padding: 10px 14px;
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
</style>
