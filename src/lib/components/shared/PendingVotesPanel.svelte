<script lang="ts">
  import type { ProjectApprovalVote } from '$lib/types/detail';
  import {
    formatProjectVoteRequirement,
    formatProjectVoteSummary
  } from '$lib/utils/projectVotes';
  import { pendingVoteCardId, type PendingVoteItem } from '$lib/utils/pendingVotes';
  import { formatRelativeTime } from '$lib/utils/time';

  export let items: PendingVoteItem[] = [];
  export let onVote: (item: PendingVoteItem, vote: ProjectApprovalVote) => void | Promise<void> =
    () => {};
</script>

{#if items.length > 0}
  <section id="pending-votes-panel" class="pending-votes-panel" aria-live="polite">
    <div class="panel-header">
      <strong>Your vote is needed</strong>
      <span>{items.length} open {items.length === 1 ? 'decision' : 'decisions'}</span>
    </div>

    <div class="vote-stack">
      {#each items as item (item.id + item.voteKind + (item.planValueId ?? ''))}
        <article
          id={pendingVoteCardId(item.voteKind, item.id, item.planValueId)}
          class="pending-vote-banner"
        >
          <div class="banner-copy">
            <span class="banner-label">{item.label}</span>
            <span class="banner-title">{item.title}</span>
            {#if item.reason}
              <p>{item.reason}</p>
            {/if}
            <span class="vote-meta">
              {formatProjectVoteRequirement(item.voteSummary, item.approvalThresholdPercent)}
              · {formatProjectVoteSummary(item.voteSummary)}
              · {item.authorUsername} · {formatRelativeTime(item.createdAt)}
            </span>
          </div>
          {#if item.canVote}
            <div class="banner-actions">
              <button
                class="reject-button"
                type="button"
                on:click={() => onVote(item, 'no')}
              >
                Reject
              </button>
              <button
                class="approve-button"
                type="button"
                on:click={() => onVote(item, 'yes')}
              >
                Approve
              </button>
            </div>
          {/if}
        </article>
      {/each}
    </div>
  </section>
{/if}

<style>
  .pending-votes-panel {
    display: grid;
    gap: 12px;
    margin: 0 0 18px;
    padding: 16px;
    border: 1px solid color-mix(in srgb, var(--brand) 42%, var(--panel-border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--brand-soft) 58%, var(--panel));
    scroll-margin-top: 120px;
  }

  .panel-header {
    display: flex;
    gap: 12px;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
  }

  .panel-header strong {
    color: var(--text-main);
    font-size: 15px;
  }

  .panel-header span {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .vote-stack {
    display: grid;
    gap: 10px;
  }

  .pending-vote-banner {
    display: flex;
    gap: 16px;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    padding: 14px;
    border: 1px solid color-mix(in srgb, var(--brand) 20%, var(--panel-border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--panel) 88%, var(--panel-strong));
    scroll-margin-top: 120px;
  }

  :global(.vote-card-highlight) {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand) 45%, transparent);
  }

  .banner-copy {
    display: grid;
    gap: 4px;
    min-width: min(100%, 240px);
    flex: 1;
  }

  .banner-title {
    color: var(--text-main);
    font-weight: 700;
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

  .vote-meta {
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.45;
  }

  .banner-actions {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
    flex-shrink: 0;
  }

  .approve-button,
  .reject-button {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
  }

  .approve-button {
    border: none;
    background: var(--brand);
    color: var(--page-bg);
  }

  .reject-button {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    color: var(--text-main);
  }
</style>
