<script lang="ts">
  import type { ProjectApprovalVote } from '$lib/types/detail';
  import { formatRelativeTime } from '$lib/utils/time';

  export let authorUsername: string;
  export let createdAt: string;
  export let activeVote: ProjectApprovalVote | null = null;
  export let canVote = false;
  export let onVote: (vote: ProjectApprovalVote | null) => void | Promise<void> = () => {};

  async function setVote(vote: ProjectApprovalVote) {
    await onVote(activeVote === vote ? null : vote);
  }
</script>

<div class="vote-card-footer">
  {#if canVote}
    <div class="vote-card-actions">
      <button
        class:active-vote={activeVote === 'yes'}
        class="vote-chip"
        type="button"
        on:click={() => setVote('yes')}
      >
        Approve
      </button>
      <button
        class:active-vote={activeVote === 'no'}
        class="vote-chip negative"
        type="button"
        on:click={() => setVote('no')}
      >
        Reject
      </button>
    </div>
  {/if}

  <span class="vote-card-meta">{authorUsername} · {formatRelativeTime(createdAt)}</span>
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

  .vote-chip {
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .vote-chip.negative {
    color: var(--danger-strong, #8f2d2d);
  }

  .vote-chip.active-vote {
    border-color: var(--brand);
    color: var(--brand-strong);
    background: color-mix(in srgb, var(--brand-soft) 70%, var(--panel));
  }

  .vote-card-meta {
    margin-left: auto;
    text-align: right;
    color: var(--text-soft);
    font-size: 12px;
  }
</style>