<script lang="ts">
  import VoteDecisionSheet from '$lib/components/shared/VoteDecisionSheet.svelte';
  import type { DecisionHistoryEntry, ProjectApprovalVote } from '$lib/types/detail';
  import { historyEntryToVoteItem } from '$lib/utils/pendingVotes';
  import {
    formatProjectVoteRequirement,
    formatProjectVoteSummary
  } from '$lib/utils/projectVotes';
  import { formatRelativeTime } from '$lib/utils/time';

  export let entry: DecisionHistoryEntry;
  export let highlighted = false;
  export let onVote: (
    entry: DecisionHistoryEntry,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};

  let sheetOpen = false;

  function openSheet() {
    sheetOpen = true;
  }

  function closeSheet() {
    sheetOpen = false;
  }

  async function voteFromSheet(vote: ProjectApprovalVote | null) {
    await onVote(entry, vote);
  }

  function statusLabel(status: DecisionHistoryEntry['status']) {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Active';
    }
  }

  function requirementLabel(entry: DecisionHistoryEntry) {
    if (entry.status === 'open') {
      return formatProjectVoteRequirement(entry.voteSummary, entry.approvalThresholdPercent);
    }

    return `${entry.approvalThresholdPercent}% approval needed`;
  }

  function historyVoteSummary(entry: DecisionHistoryEntry) {
    const baseSummary = formatProjectVoteSummary(entry.voteSummary);

    if (entry.status === 'open') {
      return baseSummary;
    }

    const castLabel = entry.voteSummary.totalVotes === 1 ? 'vote' : 'votes';
    const quorumLabel = entry.voteSummary.votesRequired === 1 ? 'vote' : 'votes';

    return `${baseSummary} · ${entry.voteSummary.totalVotes} ${castLabel} cast out of ${entry.voteSummary.votesRequired} quorum ${quorumLabel}`;
  }
</script>

<article
  id={`decision-${entry.id}`}
  class="history-card"
  class:open={entry.status === 'open'}
  class:approved={entry.status === 'approved'}
  class:rejected={entry.status === 'rejected'}
  class:highlighted
>
  <button
    class="history-toggle"
    type="button"
    aria-label={`${entry.kindLabel}, ${statusLabel(entry.status)}`}
    on:click={openSheet}
  >
    <div class="history-status-row">
      <span class="history-kicker">{entry.kindLabel}</span>
      <span class="history-requirement">{requirementLabel(entry)}</span>
    </div>
    {#if entry.originLabel}
      <p class="origin-label">{entry.originLabel}</p>
    {/if}
    <div class="history-meta-row">
      <span class="history-meta-left">{historyVoteSummary(entry)}</span>
      <span class="history-meta-right">{entry.authorUsername} · {formatRelativeTime(entry.createdAt)}</span>
    </div>
  </button>

  <VoteDecisionSheet
    item={sheetOpen ? historyEntryToVoteItem(entry) : null}
    sheetId={`history-vote-${entry.id}`}
    onClose={closeSheet}
    onVote={voteFromSheet}
  />
</article>

<style>
  .history-card {
    position: relative;
    border: 0;
    border-bottom: 1px solid var(--panel-border);
    border-left: 3px solid transparent;
    border-radius: 0;
    background: transparent;
    overflow: hidden;
  }

  .history-card.open {
    border-left-color: #e6b325;
  }

  .history-card.approved {
    border-left-color: #2f9e44;
  }

  .history-card.rejected {
    border-left-color: #e03131;
  }

  :global(.history-rail-card:last-child) .history-card {
    border-bottom: 0;
  }

  .history-toggle {
    display: grid;
    gap: 6px;
    width: 100%;
    padding: 10px 14px;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    text-align: left;
  }

  .history-toggle:hover,
  .history-toggle:focus-visible {
    background: color-mix(in srgb, var(--panel-strong) 88%, var(--text-main));
  }

  .history-status-row,
  .history-meta-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) max-content;
    gap: 12px;
    align-items: center;
  }

  .history-kicker,
  .history-meta-left,
  .history-meta-right,
  .history-requirement,
  .origin-label {
    color: var(--text-soft);
    font-size: 12px;
  }

  .history-kicker {
    color: var(--text-main);
    font-size: 14px;
    font-weight: 700;
  }

  .origin-label,
  .history-card p {
    margin: 0;
  }

  .history-meta-left {
    min-width: 0;
  }

  .history-requirement,
  .history-meta-right {
    text-align: right;
  }

  .history-card.highlighted .history-toggle {
    background: color-mix(in srgb, var(--brand-soft) 55%, var(--panel));
  }

  @media (max-width: 720px) {
    .history-status-row,
    .history-meta-row {
      grid-template-columns: minmax(0, 1fr);
    }

    .history-requirement,
    .history-meta-right {
      text-align: left;
    }
  }
</style>
