<script lang="ts">
  import ContentMetaRow from '$lib/components/shared/ContentMetaRow.svelte';
  import type { ProjectApprovalVote } from '$lib/types/detail';

  export let authorUsername: string;
  export let createdAt: string;
  export let activeVote: ProjectApprovalVote | null = null;
  export let canVote = false;
  export let showMeta = true;
  export let onVote: (vote: ProjectApprovalVote | null) => void | Promise<void> = () => {};

  let displayVote: ProjectApprovalVote | null = activeVote;
  let voting = false;
  let holdOptimistic = false;

  $: if (!voting) {
    if (holdOptimistic) {
      if (activeVote === displayVote) {
        holdOptimistic = false;
      }
    } else {
      displayVote = activeVote;
    }
  }

  async function setVote(vote: ProjectApprovalVote) {
    if (voting || !canVote) {
      return;
    }

    const previous = displayVote;
    const next = displayVote === vote ? null : vote;
    displayVote = next;
    voting = true;
    holdOptimistic = false;

    try {
      const pending = onVote(next);
      holdOptimistic = true;
      voting = false;
      await pending;
    } catch (error) {
      displayVote = previous;
      holdOptimistic = false;
      throw error;
    } finally {
      voting = false;
    }
  }
</script>

<div class:actions-only={!showMeta} class="vote-card-footer">
  {#if canVote}
    <div class="vote-card-actions">
      <button
        class:active-vote={displayVote === 'yes'}
        class="vote-chip"
        type="button"
        disabled={voting}
        aria-pressed={displayVote === 'yes'}
        on:click={() => setVote('yes')}
      >
        Approve
      </button>
      <button
        class:active-vote={displayVote === 'no'}
        class="vote-chip negative"
        type="button"
        disabled={voting}
        aria-pressed={displayVote === 'no'}
        on:click={() => setVote('no')}
      >
        Reject
      </button>
    </div>
  {/if}

  {#if showMeta}
    <span class="vote-card-meta">
      <ContentMetaRow {authorUsername} {createdAt} />
    </span>
  {/if}
</div>

<style>
  .vote-card-footer,
  .vote-card-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .vote-card-footer {
    justify-content: space-between;
  }

  .vote-card-footer.actions-only {
    justify-content: flex-start;
  }

  .vote-chip {
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .vote-chip:disabled {
    cursor: wait;
    opacity: 0.85;
  }

  .vote-chip.negative {
    color: var(--danger-strong, #8f2d2d);
  }

  .vote-chip.active-vote {
    border-color: var(--brand);
    color: var(--brand-strong);
    background: color-mix(in srgb, var(--brand-soft) 70%, var(--panel));
  }

  .vote-chip.negative.active-vote {
    border-color: var(--danger-strong, #8f2d2d);
    color: var(--danger-strong, #8f2d2d);
    background: color-mix(in srgb, var(--danger-strong, #8f2d2d) 12%, var(--panel));
  }

  .vote-card-meta {
    margin-left: auto;
    text-align: right;
    color: var(--text-soft);
    font-size: 12px;
  }
</style>
