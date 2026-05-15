<script lang="ts">
  import VoteCardFooter from '$lib/components/shared/VoteCardFooter.svelte';
  import type { DecisionHistoryEntry, ProjectApprovalVote } from '$lib/types/detail';
  import {
    formatProjectVoteRequirement,
    formatProjectVoteSummary
  } from '$lib/utils/projectVotes';
  import { formatRelativeTime } from '$lib/utils/time';

  export let entry: DecisionHistoryEntry;
  export let onVote: (
    entry: DecisionHistoryEntry,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};

  let open = false;

  function toggleOpen() {
    open = !open;
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

  function compactLabel(entry: DecisionHistoryEntry) {
    switch (entry.payload.type) {
      case 'phase-change':
        return `${entry.payload.fromPhaseLabel} -> ${entry.payload.toPhaseLabel}`;
      case 'update':
        return 'Proposed Update';
      case 'settings-change':
        return entry.payload.proposedSettings.summary;
      default:
        return null;
    }
  }

  function requirementLabel(entry: DecisionHistoryEntry) {
    if (entry.status === 'open') {
      return formatProjectVoteRequirement(entry.voteSummary, entry.approvalThresholdPercent);
    }

    return `${entry.approvalThresholdPercent}% approval needed`;
  }
</script>

<article class:expanded={open} class="history-card">
  <button
    aria-expanded={open}
    aria-controls={`history-details-${entry.id}`}
    class="history-toggle"
    type="button"
    on:click={toggleOpen}
  >
    <div class="history-status-row">
      <div class="history-status-left">
        <span class="history-kicker">{entry.kindLabel}</span>
        <span class={`status-pill ${entry.status}`}>{statusLabel(entry.status)}</span>
      </div>
      <span class="history-requirement">{requirementLabel(entry)}</span>
    </div>
  </button>

  {#if open}
    <div id={`history-details-${entry.id}`} class="history-details">
      {#if compactLabel(entry)}
        <div class="history-details-head">
          <strong>{compactLabel(entry)}</strong>
        </div>
      {/if}

      {#if entry.payload.type === 'phase-change'}
        <div class="detail-grid two-up">
          <div class="detail-card">
            <span>From</span>
            <strong>{entry.payload.fromPhaseLabel}</strong>
          </div>
          <div class="detail-card">
            <span>To</span>
            <strong>{entry.payload.toPhaseLabel}</strong>
          </div>
        </div>
        <div class="detail-copy">
          <span class="detail-section-title">Reason</span>
          <p>{entry.payload.reason}</p>
        </div>
      {:else if entry.payload.type === 'update'}
        <p>{entry.payload.body}</p>
        {#if entry.payload.appliedUpdateId}
          <p class="detail-note">Applied to the public update list.</p>
        {/if}
      {:else if entry.payload.type === 'edit'}
        <div class="change-list">
          {#each entry.payload.changes as change}
            <div class="detail-card change-card">
              <strong>{change.label}</strong>
              <div class="change-values">
                <div>
                  <span>Before</span>
                  <p>{change.before}</p>
                </div>
                <div>
                  <span>After</span>
                  <p>{change.after}</p>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="detail-copy">
          <span class="detail-section-title">Reason</span>
          <p>{entry.payload.reason}</p>
        </div>
        <div class="detail-grid two-up">
          <div class="detail-card">
            <span>Previous</span>
            <strong>{entry.payload.previousSettings.summary}</strong>
          </div>
          <div class="detail-card">
            <span>Proposed</span>
            <strong>{entry.payload.proposedSettings.summary}</strong>
          </div>
        </div>
      {/if}

      {#if entry.canVote}
        <VoteCardFooter
          authorUsername={entry.authorUsername}
          createdAt={entry.createdAt}
          activeVote={entry.voteSummary.activeVote}
          canVote={entry.canVote}
          showMeta={false}
          onVote={(vote) => onVote(entry, vote)}
        />
      {/if}
    </div>
  {/if}

  <button
    aria-controls={`history-details-${entry.id}`}
    aria-expanded={open}
    class="history-toggle history-toggle-footer"
    type="button"
    on:click={toggleOpen}
  >
    <div class="history-meta-row">
      <span class="history-meta-left">{formatProjectVoteSummary(entry.voteSummary)}</span>
      <span class="history-meta-right">{entry.authorUsername} · {formatRelativeTime(entry.createdAt)}</span>
    </div>
  </button>
</article>

<style>
  .history-card,
  .history-details,
  .history-details-head,
  .detail-copy,
  .change-list,
  .detail-grid,
  .change-values {
    display: grid;
    gap: 12px;
  }

  .history-card {
    position: relative;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    overflow: hidden;
  }

  .history-card {
    gap: 0;
  }

  .history-toggle {
    display: block;
    width: 100%;
    padding: 14px 16px;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    text-align: left;
  }

  .history-toggle-footer {
    padding-top: 12px;
  }

  .history-status-row,
  .history-meta-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) max-content;
    gap: 12px;
    align-items: center;
  }

  .history-kicker,
  .status-pill,
  .detail-card span,
  .detail-section-title,
  .detail-note,
  .history-meta-left,
  .history-meta-right,
  .history-requirement {
    color: var(--text-soft);
    font-size: 12px;
  }

  .history-details-head strong,
  .detail-card strong,
  .change-card strong {
    color: var(--text-main);
  }

  .detail-section-title {
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .status-pill {
    padding: 4px 8px;
    border-radius: 999px;
    border: 1px solid var(--panel-border);
    background: var(--panel-strong);
    font-weight: 700;
  }

  .status-pill.open {
    color: var(--brand-strong);
  }

  .status-pill.approved {
    color: var(--success-strong, #1c6a46);
  }

  .status-pill.rejected {
    color: var(--danger-strong, #8f2d2d);
  }

  .history-meta-left {
    min-width: 0;
  }

  .history-requirement {
    text-align: right;
  }

  .history-meta-right {
    text-align: right;
  }

  .history-status-left {
    display: flex;
    gap: 12px;
    align-items: center;
    min-width: 0;
    flex-wrap: wrap;
  }

  .history-details {
    padding: 0 16px 12px;
  }

  .history-toggle-footer {
    padding-top: 12px;
  }

  .history-details-head {
    padding-top: 12px;
  }

  .detail-grid.two-up,
  .change-values {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-card {
    display: grid;
    gap: 6px;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .change-values div {
    display: grid;
    gap: 6px;
  }

  .change-values p,
  .detail-note,
  .history-card p {
    margin: 0;
  }

  .history-card.expanded {
    z-index: 1;
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 18%, transparent);
  }

  @media (max-width: 720px) {
    .detail-grid.two-up,
    .change-values {
      grid-template-columns: minmax(0, 1fr);
    }

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
