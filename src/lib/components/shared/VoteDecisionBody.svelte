<script lang="ts">
  import type { ProjectApprovalVote } from '$lib/types/detail';
  import type { PendingVoteItem } from '$lib/utils/pendingVotes';

  export let item: PendingVoteItem;
  export let showLabel = false;
  export let hideChoices = false;
  export let onVote: (vote: ProjectApprovalVote | null) => void | Promise<void> = () => {};
  export let onAssess: () => void | Promise<void> = () => {};
  export let onAction: () => void | Promise<void> = () => {};

  function outcomeSentence(current: PendingVoteItem) {
    if (current.voteKind === 'edit') {
      return 'If this passes, the title and description change.';
    }
    if (current.voteKind === 'update') {
      return 'If this passes, this update is posted.';
    }
    if (current.voteKind === 'phase_change') {
      const parts = current.title.split(' → ');
      if (parts.length === 2) {
        return `If this passes, this moves from ${parts[0]} to ${parts[1]}.`;
      }
      return `If this passes, ${current.title}.`;
    }
    if (current.voteKind === 'request_settings') {
      return 'If this passes, the request settings change.';
    }
    return 'If this passes, this change is applied.';
  }

  function tallyLine(current: PendingVoteItem) {
    const summary = current.voteSummary;
    if (!summary || summary.totalVotes <= 0) {
      return 'No one has voted yet';
    }
    return `${summary.yesCount} yes · ${summary.noCount} no · ${Math.round(summary.approvalPercent)}%`;
  }

  async function cast(vote: ProjectApprovalVote) {
    const next = item.voteSummary.activeVote === vote ? null : vote;
    await onVote(next);
  }
</script>

<div class="vote-sheet">
  {#if showLabel}
    <h2 class="vote-label">{item.label}</h2>
  {/if}
  <p class="outcome">{outcomeSentence(item)}</p>
  {#if item.authorUsername}
    <p class="proposer">Proposed by {item.authorUsername}</p>
  {/if}

  {#if item.voteKind === 'update'}
    <section class="change-card">
      <h3>Proposed update</h3>
      <p class="proposed-copy">{item.reason || '—'}</p>
    </section>
  {:else if item.voteKind === 'edit'}
    <section class="change-card">
      <h3>Title</h3>
      <div class="pair">
        <div>
          <p class="field-kicker">Now</p>
          <p>{item.previousTitle || '—'}</p>
        </div>
        <div class="proposed">
          <p class="field-kicker">Proposed</p>
          <p>{item.title || '—'}</p>
        </div>
      </div>
    </section>
    <section class="change-card">
      <h3>Description</h3>
      <div class="pair">
        <div>
          <p class="field-kicker">Now</p>
          <p>{item.previousDescription || '—'}</p>
        </div>
        <div class="proposed">
          <p class="field-kicker">Proposed</p>
          <p>{item.reason || '—'}</p>
        </div>
      </div>
    </section>
  {:else}
    {#if item.title && item.title !== item.label}
      <section class="change-card">
        <h3>{item.title}</h3>
        {#if item.description}
          <p>{item.description}</p>
        {/if}
      </section>
    {/if}
    {#if item.reason}
      <section class="change-card">
        <h3>Why</h3>
        <p>{item.reason}</p>
      </section>
    {/if}
  {/if}

  <section class="tally">
    <p>{tallyLine(item)}</p>
    <p class="tally-note">Needs {Math.round(item.approvalThresholdPercent)}% yes to pass.</p>
  </section>

  {#if item.actionLabel}
    <div class="sheet-actions">
      <button class="approve-button" type="button" on:click={onAction}>{item.actionLabel}</button>
    </div>
  {:else if item.planCriterionId}
    <div class="sheet-actions">
      <button class="approve-button" type="button" on:click={onAssess}>Assess</button>
    </div>
  {:else if item.canVote && !hideChoices}
    <div class="sheet-actions">
      <button
        class="choice-button no-choice"
        class:selected={item.voteSummary.activeVote === 'no'}
        type="button"
        aria-pressed={item.voteSummary.activeVote === 'no'}
        on:click={() => cast('no')}
      >No</button>
      <button
        class="choice-button yes-choice"
        class:selected={item.voteSummary.activeVote === 'yes'}
        type="button"
        aria-pressed={item.voteSummary.activeVote === 'yes'}
        on:click={() => cast('yes')}
      >Yes</button>
    </div>
    <p class="clear-hint">Tap the selected choice again to clear your vote.</p>
  {/if}
</div>

<style>
  .vote-sheet {
    display: grid;
    gap: 14px;
  }

  .vote-label {
    margin: 0;
    color: var(--text-main);
    font-size: 18px;
    font-weight: 800;
  }

  .outcome {
    margin: 0;
    color: var(--text-main);
    font-size: 16px;
    line-height: 1.45;
  }

  .proposer,
  .tally-note,
  .clear-hint,
  .field-kicker {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.4;
  }

  .proposer {
    margin-top: -8px;
  }

  .change-card {
    display: grid;
    gap: 10px;
    padding: 12px 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .change-card h3 {
    margin: 0;
    color: var(--text-main);
    font-size: 15px;
    font-weight: 700;
  }

  .change-card p,
  .tally p {
    margin: 0;
    color: var(--text-main);
    font-size: 15px;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  .change-card p.field-kicker,
  .tally p.tally-note {
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.4;
  }

  .change-card p.field-kicker {
    font-weight: 700;
  }

  .pair {
    display: grid;
    gap: 12px;
  }

  .proposed {
    padding-left: 10px;
    border-left: 3px solid #2f9e44;
  }

  .proposed-copy {
    padding-left: 10px;
    border-left: 3px solid #2f9e44;
  }

  .field-kicker {
    font-weight: 700;
  }

  .tally {
    display: grid;
    gap: 4px;
  }

  .sheet-actions {
    display: flex;
    gap: 10px;
  }

  .approve-button,
  .choice-button {
    flex: 1 1 0;
    min-height: 64px;
    padding: 12px 16px;
    border-radius: var(--radius-sm);
    font-size: 18px;
    font-weight: 800;
    cursor: pointer;
  }

  .approve-button {
    border: 1px solid #2f9e44;
    background: #2f9e44;
    color: #fff;
  }

  .yes-choice {
    border: 1px solid #2f9e44;
    background: color-mix(in srgb, #2f9e44 18%, var(--panel));
    color: #1b7a32;
  }

  .yes-choice.selected {
    background: #2f9e44;
    color: #fff;
  }

  .no-choice {
    border: 1px solid #e03131;
    background: color-mix(in srgb, #e03131 16%, var(--panel));
    color: #c22525;
  }

  .no-choice.selected {
    background: #e03131;
    color: #fff;
  }

  @media (min-width: 640px) {
    .pair {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
