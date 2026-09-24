<script lang="ts">
  import VoteDecisionSheet from '$lib/components/shared/VoteDecisionSheet.svelte';
  import type { ProjectApprovalVote } from '$lib/types/detail';
  import { pendingVoteCardId, type PendingVoteItem } from '$lib/utils/pendingVotes';

  export let items: PendingVoteItem[] = [];
  export let lookupItems: PendingVoteItem[] | null = null;
  export let openVoteKind: string | null = null;
  export let openVoteId: string | null = null;
  export let onVote: (
    item: PendingVoteItem,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  export let onAssess: (item: PendingVoteItem) => void | Promise<void> = () => {};
  export let onAction: (item: PendingVoteItem) => void | Promise<void> = () => {};

  let openItem: PendingVoteItem | null = null;
  let openedRailKey = '';

  $: {
    const railKey = `${openVoteKind ?? ''}:${openVoteId ?? ''}`;
    if (railKey !== ':' && railKey !== openedRailKey) {
      const source = lookupItems ?? items;
      const match = source.find((item) => item.voteKind === openVoteKind && item.id === openVoteId);
      if (match) {
        openItem = match;
        openedRailKey = railKey;
      }
    }
  }

  function itemKey(item: PendingVoteItem) {
    return item.id + item.voteKind + (item.planValueId ?? '') + (item.planCriterionId ?? '') + (item.actionLabel ?? '');
  }

  function approvalLabel(item: PendingVoteItem) {
    const summary = item.voteSummary;
    if (!summary || summary.totalVotes <= 0) {
      return '—';
    }
    return `${Math.round(summary.approvalPercent)}%`;
  }

  function open(item: PendingVoteItem) {
    openItem = item;
  }

  function close() {
    openItem = null;
  }
</script>

{#if items.length > 0}
  <section id="pending-votes-panel" class="pending-votes-panel" aria-label="Votes needed" aria-live="polite">
    <div class="vote-stack">
      {#each items as item (itemKey(item))}
        {@const cardId = pendingVoteCardId(item.voteKind, item.id, item.planValueId, item.planCriterionId)}
        <button
          id={cardId}
          class="vote-row"
          type="button"
          data-participation-action={item.actionLabel ? 'software-action' : item.planCriterionId ? 'assess-plan' : 'cast-vote'}
          on:click={() => open(item)}
        >
          <span class="vote-label">{item.label}</span>
          <span class="vote-percent">{approvalLabel(item)}</span>
        </button>
      {/each}
    </div>
  </section>
{/if}

<VoteDecisionSheet
  item={openItem}
  onClose={close}
  onVote={(vote) => {
    if (openItem) {
      return onVote(openItem, vote);
    }
  }}
  onAssess={() => {
    if (openItem) {
      return onAssess(openItem);
    }
  }}
  onAction={() => {
    if (openItem) {
      return onAction(openItem);
    }
  }}
/>

<style>
  .pending-votes-panel {
    display: grid;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    scroll-margin-top: 120px;
  }

  .vote-stack {
    display: grid;
    gap: 6px;
  }

  .vote-row {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 36px;
    padding: 6px 12px;
    border: 1px solid color-mix(in srgb, #2f9e44 45%, var(--panel-border));
    border-radius: 999px;
    background: color-mix(in srgb, #2f9e44 12%, var(--panel));
    color: var(--text-main);
    cursor: pointer;
    scroll-margin-top: 120px;
  }

  .vote-row:hover {
    border-color: #2f9e44;
  }

  .vote-label {
    font-size: 13px;
    font-weight: 800;
    color: #2f9e44;
  }

  .vote-percent {
    color: #2f9e44;
    font-size: 13px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
</style>
