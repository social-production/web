<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { VoteDirection } from '$lib/types/feed';

  export let count: number;
  export let activeVote: VoteDirection = 0;

  const dispatch = createEventDispatcher<{
    vote: { vote: VoteDirection };
  }>();

  function toggleVote(value: Exclude<VoteDirection, 0>) {
    dispatch('vote', {
      vote: activeVote === value ? 0 : value
    });
  }
</script>

<div class="vote-strip">
  <button
    aria-label="Vote up"
    class:active-up={activeVote === 1}
    class="vote-button"
    type="button"
    on:click={() => toggleVote(1)}
  >
    ▲
  </button>
  <span class:active-up={activeVote === 1} class:active-down={activeVote === -1} class="vote-count">
    {count}
  </span>
  <button
    aria-label="Vote down"
    class:active-down={activeVote === -1}
    class="vote-button"
    type="button"
    on:click={() => toggleVote(-1)}
  >
    ▼
  </button>
</div>

<style>
  .vote-strip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .vote-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    color: var(--text-soft);
    font-size: 11px;
    line-height: 1;
  }

  .vote-count {
    min-width: 20px;
    text-align: center;
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
  }

  .active-up {
    color: var(--brand);
  }

  .active-down {
    color: var(--accent-warm);
  }
</style>