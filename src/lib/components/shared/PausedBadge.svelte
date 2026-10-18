<script lang="ts">
  import { page } from '$app/stores';

  /** A small "Paused" tag after a name that a bot review found to be a bot. */
  export let username: string | null | undefined = null;

  $: paused = Boolean(
    username &&
    ($page.data.bootstrap?.pausedUsernames ?? []).some(
      (name: string) => name.toLowerCase() === username?.toLowerCase()
    )
  );
</script>

{#if paused}
  <span
    class="paused-badge"
    title="A community review found this account is a bot. It's read-only."
  >
    Paused · bot
  </span>
{/if}

<style>
  .paused-badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 6px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--danger, #c0392b) 45%, var(--panel-border));
    color: var(--danger, #c0392b);
    font-size: 10px;
    font-weight: 700;
    white-space: nowrap;
  }
</style>
