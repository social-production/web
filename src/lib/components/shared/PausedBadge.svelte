<script lang="ts">
  import { page } from '$app/stores';

  /** A small "Paused" tag after a name that a community bot review found to be a bot. */
  export let username: string | null | undefined = null;

  const explanation = "Paused: a community bot review found this account is a bot. It's read-only.";

  $: paused = Boolean(
    username &&
      ($page.data.bootstrap?.pausedUsernames ?? []).some(
        (name: string) => name.toLowerCase() === username?.toLowerCase()
      )
  );
</script>

{#if paused}
  <span class="paused-badge" title={explanation} aria-label={explanation}>
    <span class="dot" aria-hidden="true"></span>
    <span class="text">Paused</span>
  </span>
{/if}

<style>
  .paused-badge {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 4px;
    padding: 1px 7px;
    border-radius: 999px;
    background: var(--status-warning-soft, color-mix(in srgb, #d97706 14%, transparent));
    color: var(--status-warning-text, #92400e);
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  :global([data-theme='dark']) .paused-badge {
    background: color-mix(in srgb, #f59e0b 18%, transparent);
    color: #fcd34d;
  }

  /* On narrow screens the name wins: the tag becomes a dot with the explanation as its label. */
  @media (max-width: 480px) {
    .paused-badge {
      padding: 3px;
    }

    .text {
      display: none;
    }
  }
</style>
