<script lang="ts">
  import type { PendingVoteItem } from '$lib/utils/pendingVotes';
  import { pendingVoteCardId } from '$lib/utils/pendingVotes';

  export let items: PendingVoteItem[] = [];
  export let onApprove: (item: PendingVoteItem) => void | Promise<void> = () => {};
  export let onReject: (item: PendingVoteItem) => void | Promise<void> = () => {};

  $: primary = items[0] ?? null;
  $: remainingCount = Math.max(items.length - 1, 0);

  function scrollToVote(item: PendingVoteItem) {
    if (typeof document === 'undefined') {
      return;
    }

    const card = document.getElementById(pendingVoteCardId(item.voteKind, item.id));
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function scrollToNextVote() {
    if (items[1]) {
      scrollToVote(items[1]);
    }
  }
</script>

{#if primary}
  <section class="pending-vote-banner" aria-live="polite">
    <div class="banner-copy">
      <strong>Your vote is needed</strong>
      <span class="banner-label">{primary.label}</span>
      <span class="banner-title">{primary.title}</span>
      {#if primary.reason}
        <p>{primary.reason}</p>
      {/if}
      {#if remainingCount > 0}
        <button class="inline-link-button" type="button" on:click={scrollToNextVote}>
          {remainingCount} more {remainingCount === 1 ? 'vote' : 'votes'} needed
        </button>
      {/if}
    </div>
    <div class="banner-actions">
      <button class="secondary-button" type="button" on:click={() => scrollToVote(primary)}>
        View details
      </button>
      <button class="reject-button" type="button" on:click={() => onReject(primary)}>Reject</button>
      <button class="approve-button" type="button" on:click={() => onApprove(primary)}>Approve</button>
    </div>
  </section>
{/if}

<style>
  .pending-vote-banner {
    display: flex;
    gap: 16px;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    margin: 0 0 18px;
    padding: 16px;
    border: 1px solid color-mix(in srgb, var(--brand) 42%, var(--panel-border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--brand-soft) 58%, var(--panel));
  }

  .banner-copy {
    display: grid;
    gap: 6px;
    min-width: min(100%, 280px);
    flex: 1;
  }

  .banner-copy strong,
  .banner-title {
    color: var(--text-main);
  }

  .banner-label {
    color: var(--brand-strong);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .banner-copy p {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.45;
  }

  .banner-actions {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .secondary-button,
  .approve-button,
  .reject-button {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
  }

  .secondary-button {
    border: 1px solid var(--panel-border);
    background: var(--panel-strong);
    color: var(--text-soft);
  }

  .approve-button {
    background: var(--brand);
    color: var(--page-bg);
  }

  .reject-button {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    color: var(--text-main);
  }

  .inline-link-button {
    justify-self: start;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
    text-decoration: underline;
  }
</style>
