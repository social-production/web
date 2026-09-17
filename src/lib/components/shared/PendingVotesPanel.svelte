<script lang="ts">
  import type { ProjectApprovalVote } from '$lib/types/detail';
  import { pendingVoteCardId, type PendingVoteItem } from '$lib/utils/pendingVotes';

  export let items: PendingVoteItem[] = [];
  export let onVote: (item: PendingVoteItem, vote: ProjectApprovalVote) => void | Promise<void> =
    () => {};
  export let onAssess: (item: PendingVoteItem) => void | Promise<void> = () => {};
  export let onAction: (item: PendingVoteItem) => void | Promise<void> = () => {};
</script>

{#if items.length > 0}
  <section id="pending-votes-panel" class="pending-votes-panel" aria-label="Votes needed" aria-live="polite">
    <div class="vote-stack">
      {#each items as item (item.id + item.voteKind + (item.planValueId ?? '') + (item.planCriterionId ?? '') + (item.actionLabel ?? ''))}
        {@const cardId = pendingVoteCardId(item.voteKind, item.id, item.planValueId, item.planCriterionId)}
        <div id={cardId} class="pending-vote-banner">
          <span class="vote-copy">
            <span class="vote-label">{item.label}</span>
            <span class="vote-title">{item.title}</span>
          </span>
          {#if item.actionLabel}
            <div class="banner-actions">
              <button
                class="approve-button"
                type="button"
                data-participation-action="software-action"
                on:click={() => onAction(item)}
              >
                {item.actionLabel}
              </button>
            </div>
          {:else if item.planCriterionId}
            <div class="banner-actions">
              <button
                class="approve-button"
                type="button"
                data-participation-action="assess-plan"
                on:click={() => onAssess(item)}
              >
                Assess
              </button>
            </div>
          {:else if item.canVote}
            <div class="banner-actions">
              <button
                class="reject-button"
                type="button"
                data-participation-action="cast-vote"
                on:click={() => onVote(item, 'no')}
              >
                No
              </button>
              <button
                class="approve-button"
                type="button"
                data-participation-action="cast-vote"
                on:click={() => onVote(item, 'yes')}
              >
                Yes
              </button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </section>
{/if}

<style>
  .pending-votes-panel {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 8px 10px;
    border: 1px solid color-mix(in srgb, var(--brand) 28%, var(--panel-border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--brand-soft) 38%, var(--panel));
    scroll-margin-top: 120px;
  }

  .vote-stack {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .pending-vote-banner {
    display: flex;
    gap: 8px;
    justify-content: space-between;
    align-items: center;
    min-height: 36px;
    padding: 5px 8px 5px 10px;
    border: 1px solid color-mix(in srgb, var(--brand) 16%, var(--panel-border));
    border-radius: 999px;
    background: color-mix(in srgb, var(--panel) 82%, var(--panel-strong));
    scroll-margin-top: 120px;
  }

  .vote-copy {
    display: flex;
    gap: 6px;
    align-items: center;
    min-width: 0;
    flex: 1 1 auto;
  }

  .vote-label {
    flex: 0 0 auto;
    color: var(--brand-strong);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .vote-title {
    min-width: 0;
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .banner-actions {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: nowrap;
    flex-shrink: 0;
  }

  .approve-button,
  .reject-button {
    min-height: 28px;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
  }

  .approve-button {
    border: 1px solid color-mix(in srgb, var(--brand) 35%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 50%, var(--panel));
    color: var(--brand-strong);
  }

  .reject-button {
    border: 1px solid var(--panel-border);
    background: var(--panel-strong);
    color: var(--text-main);
  }
</style>
