<script lang="ts">
  import DecisionHistoryCard from '$lib/components/shared/DecisionHistoryCard.svelte';
  import type { DecisionHistoryEntry, ProjectApprovalVote } from '$lib/types/detail';

  export let title = 'History';
  export let description = '';
  export let entries: DecisionHistoryEntry[] = [];
  export let highlightedDecisionId: string | null = null;
  export let emptyMessage = 'No decision history yet.';
  export let onVote: (
    entry: DecisionHistoryEntry,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};

  $: activeEntries = entries.filter((entry) => entry.status === 'open');
  $: completedEntries = entries.filter((entry) => entry.status !== 'open');
</script>

<section class="history-shell">
  <div class="section-copy">
    <h2>{title}</h2>
    {#if description}
      <p>{description}</p>
    {/if}
  </div>

  <section class="history-group">
    <div class="group-head">
      <h3>Active Decisions</h3>
      <span>{activeEntries.length}</span>
    </div>

    {#if activeEntries.length === 0}
      <div class="empty-card">
        <p>No active decisions.</p>
      </div>
    {:else}
      <div class:scrollable={activeEntries.length > 5} class="history-list">
        {#each activeEntries as entry (entry.id)}
          <div class="history-rail-card">
            <DecisionHistoryCard {entry} highlighted={highlightedDecisionId === entry.id} {onVote} />
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <section class="history-group">
    <div class="group-head">
      <h3>Resolutions</h3>
      <span>{completedEntries.length}</span>
    </div>

    {#if completedEntries.length === 0}
      <div class="empty-card">
        <p>{entries.length === 0 ? emptyMessage : 'No resolutions yet.'}</p>
      </div>
    {:else}
      <div class:scrollable={completedEntries.length > 5} class="history-list">
        {#each completedEntries as entry (entry.id)}
          <div class="history-rail-card">
            <DecisionHistoryCard {entry} highlighted={highlightedDecisionId === entry.id} {onVote} />
          </div>
        {/each}
      </div>
    {/if}
  </section>
</section>

<style>
  .history-shell,
  .history-group,
  .history-list {
    display: grid;
    gap: 12px;
  }

  .history-list {
    grid-template-columns: minmax(0, 1fr);
    grid-auto-rows: max-content;
    align-content: start;
    align-items: start;
  }

  .history-rail-card {
    min-width: 0;
  }

  .group-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .section-copy h2,
  .section-copy p,
  .group-head h3,
  .group-head span,
  .empty-card p {
    margin: 0;
  }

  .group-head span,
  .section-copy p,
  .empty-card {
    color: var(--text-soft);
  }

  .empty-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .history-list.scrollable {
    max-height: min(34rem, 72vh);
    overflow-y: auto;
    padding-right: 2px;
  }
</style>
