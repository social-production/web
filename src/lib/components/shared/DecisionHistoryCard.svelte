<script lang="ts">
  import VoteCardFooter from '$lib/components/shared/VoteCardFooter.svelte';
  import type { DecisionHistoryEntry, ProjectApprovalVote } from '$lib/types/detail';
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

  let open = false;

  $: if (highlighted) {
    open = true;
  }

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
        if (entry.payload.closeOutcome === 'convert' && entry.payload.conversionTarget) {
          return `Convert to ${entry.payload.conversionTarget.projectModeLabel} · ${entry.payload.conversionTarget.projectSubtypeLabel}`;
        }

        return `${entry.payload.fromPhaseLabel} -> ${entry.payload.toPhaseLabel}`;
      case 'update':
        return 'Proposed Update';
      case 'pull-request':
        return entry.payload.pullRequestId;
      case 'merge-capability':
        return entry.payload.targetUsername;
      case 'repository-replacement':
        return entry.payload.repositoryUrl;
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

  function historyVoteSummary(entry: DecisionHistoryEntry) {
    const baseSummary = formatProjectVoteSummary(entry.voteSummary);

    if (entry.status === 'open') {
      return baseSummary;
    }

    const castLabel = entry.voteSummary.totalVotes === 1 ? 'vote' : 'votes';
    const quorumLabel = entry.voteSummary.votesRequired === 1 ? 'vote' : 'votes';

    return `${baseSummary} · ${entry.voteSummary.totalVotes} ${castLabel} cast out of ${entry.voteSummary.votesRequired} quorum ${quorumLabel}`;
  }

  function normalizeExternalUrl(value: string | null | undefined) {
    const trimmed = value?.trim() ?? '';

    if (!trimmed) {
      return '';
    }

    if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)) {
      return trimmed;
    }

    return `https://${trimmed}`;
  }
</script>

<article id={`decision-${entry.id}`} class:expanded={open} class="history-card" class:highlighted={highlighted}>
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
        {#if entry.payload.closeOutcome === 'convert' && entry.payload.conversionTarget}
          <div class="detail-grid two-up">
            <div class="detail-card">
              <span>Successor target</span>
              <strong>{entry.payload.conversionTarget.projectModeLabel} · {entry.payload.conversionTarget.projectSubtypeLabel}</strong>
            </div>
            <div class="detail-card">
              <span>Successor entry phase</span>
              <strong>{entry.payload.conversionTarget.entryPhaseLabel}</strong>
            </div>
          </div>
        {/if}
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
      {:else if entry.payload.type === 'pull-request'}
        <div class="detail-grid two-up">
          <div class="detail-card">
            <span>Pull request</span>
            <a href={entry.payload.pullRequestUrl} rel="noreferrer" target="_blank">
              {entry.payload.pullRequestId}
            </a>
          </div>
          <div class="detail-card">
            <span>Repository</span>
            {#if entry.payload.repositoryUrl}
              <a href={normalizeExternalUrl(entry.payload.repositoryUrl)} rel="noreferrer" target="_blank">
                {entry.payload.repositoryUrl}
              </a>
            {:else}
              <strong>Not recorded</strong>
            {/if}
          </div>
        </div>
        <div class="detail-card">
          <span>Pull request URL</span>
          <a href={entry.payload.pullRequestUrl} rel="noreferrer" target="_blank">
            {entry.payload.pullRequestUrl}
          </a>
        </div>
        <div class="detail-copy">
          <span class="detail-section-title">Title</span>
          <p>{entry.payload.title}</p>
        </div>
        <div class="detail-copy">
          <span class="detail-section-title">Summary</span>
          <p>{entry.payload.summary}</p>
        </div>
        {#if entry.payload.mergeId}
          <div class="detail-card">
            <span>Merged commit</span>
            <strong>{entry.payload.mergeId}</strong>
          </div>
        {/if}
      {:else if entry.payload.type === 'merge-capability'}
        <div class="detail-grid two-up">
          <div class="detail-card">
            <span>Action</span>
            <strong>{entry.payload.actionLabel}</strong>
          </div>
          <div class="detail-card">
            <span>Member</span>
            <strong>{entry.payload.targetUsername}</strong>
          </div>
        </div>
      {:else if entry.payload.type === 'repository-replacement'}
        <div class="detail-grid two-up">
          <div class="detail-card">
            <span>Replacement repository</span>
            <a href={normalizeExternalUrl(entry.payload.repositoryUrl)} rel="noreferrer" target="_blank">
              {entry.payload.repositoryUrl}
            </a>
          </div>
          <div class="detail-card">
            <span>Previous repository</span>
            {#if entry.payload.previousRepositoryUrl}
              <a href={normalizeExternalUrl(entry.payload.previousRepositoryUrl)} rel="noreferrer" target="_blank">
                {entry.payload.previousRepositoryUrl}
              </a>
            {:else}
              <strong>Not recorded</strong>
            {/if}
          </div>
        </div>
        {#if entry.payload.relatedPullRequestId}
          <div class="detail-card">
            <span>Blocked pull request</span>
            <strong>{entry.payload.relatedPullRequestId}</strong>
          </div>
        {/if}
        <div class="detail-copy">
          <span class="detail-section-title">Reason</span>
          <p>{entry.payload.reason}</p>
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
      <span class="history-meta-left">{historyVoteSummary(entry)}</span>
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

  .history-card.highlighted {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--status-green) 45%, var(--brand));
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
