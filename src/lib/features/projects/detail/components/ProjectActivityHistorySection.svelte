<script lang="ts">
  import CollapsibleActivityCard from '$lib/components/cards/project-detail/CollapsibleActivityCard.svelte';
  import { formatRelativeTime } from '$lib/utils/time';
  import type {
    ProjectServiceHistoryCompletionChoice,
    ProjectServiceHistoryCompletionRole,
    ProjectServiceHistoryCompletionState,
    ProjectServiceHistoryItem
  } from '$lib/types/detail';

  export let title = '';
  export let description = '';
  export let items: ProjectServiceHistoryItem[] = [];
  export let emptyMessage = '';
  export let highlightedHistoryId: string | null = null;
  export let toggleHistoryCompletion: (
    historyId: string,
    role: ProjectServiceHistoryCompletionRole,
    selection?: ProjectServiceHistoryCompletionChoice
  ) => void | Promise<void> = () => {};

  function completionStatusText(summary: ProjectServiceHistoryCompletionState) {
    if (summary.totalEligible === 0) {
      return 'No eligible people are assigned on this side yet.';
    }

    const statusParts = [
      `${summary.completedCount}/${summary.totalEligible} completed`,
      `${summary.uncompletedCount} uncompleted`
    ];

    if (summary.pendingCount > 0) {
      statusParts.push(`${summary.pendingCount} pending`);
    }

    return statusParts.join(' · ');
  }

  function isCompletionChoiceActive(
    summary: ProjectServiceHistoryCompletionState,
    selection: ProjectServiceHistoryCompletionChoice
  ) {
    return summary.viewerSelection === selection;
  }

  function historyBadgeClass(item: ProjectServiceHistoryItem) {
    switch (item.aggregateCompletionTone) {
      case 'uncompleted':
        return 'locked';
      case 'mixed':
        return 'upcoming';
      default:
        return 'complete';
    }
  }
</script>

<section class="card-rail-section">
  <div class="section-head">
    <div class="section-copy">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  </div>

  {#if items.length === 0}
    <div class="empty-card">{emptyMessage}</div>
  {:else}
    <div class="card-rail">
      {#each items as item (item.id)}
        <div id={`history-card-${item.id}`} class="rail-card">
          <CollapsibleActivityCard
            activity={item.activity}
            badgeLabel={item.aggregateCompletionLabel}
            badgeClass={historyBadgeClass(item)}
            highlighted={highlightedHistoryId === item.id}
            readOnly={true}
          >
            {#if item.requesterUsername}
              <div class="history-meta-row">
                <span>Requester: {item.requesterUsername}</span>
                <span>{formatRelativeTime(item.activity.endAt)}</span>
              </div>
            {/if}

            <div class="history-state-row">
              <strong>{item.historyStateLabel}</strong>
              <span>{item.historyStateDescription}</span>
            </div>

            {#if item.historyState !== 'unanswered-request'}
              <div class:single-column={!item.requesterCompletion} class="completion-grid">
                {#if item.requesterCompletion}
                  <div class="completion-card">
                    <strong>{item.requesterCompletion.label}</strong>
                    <span>{completionStatusText(item.requesterCompletion)}</span>
                    {#if item.requesterCompletion.viewerCanSet}
                      <div class="completion-actions">
                        <button
                          class:selected={isCompletionChoiceActive(item.requesterCompletion, 'completed')}
                          class="vote-chip"
                          type="button"
                          on:click={() => toggleHistoryCompletion(item.id, 'requester', 'completed')}
                        >
                          Completed
                        </button>
                        <button
                          class:selected={isCompletionChoiceActive(item.requesterCompletion, 'uncompleted')}
                          class="vote-chip negative"
                          type="button"
                          on:click={() => toggleHistoryCompletion(item.id, 'requester', 'uncompleted')}
                        >
                          Uncompleted
                        </button>
                      </div>
                    {/if}
                  </div>
                {/if}

                <div class="completion-card">
                  <strong>{item.participantCompletion.label}</strong>
                  <span>{completionStatusText(item.participantCompletion)}</span>
                  {#if item.participantCompletion.viewerCanSet}
                    <div class="completion-actions">
                      <button
                        class:selected={isCompletionChoiceActive(item.participantCompletion, 'completed')}
                        class="vote-chip"
                        type="button"
                        on:click={() => toggleHistoryCompletion(item.id, 'participants', 'completed')}
                      >
                        Completed
                      </button>
                      <button
                        class:selected={isCompletionChoiceActive(item.participantCompletion, 'uncompleted')}
                        class="vote-chip negative"
                        type="button"
                        on:click={() => toggleHistoryCompletion(item.id, 'participants', 'uncompleted')}
                      >
                        Uncompleted
                      </button>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </CollapsibleActivityCard>
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  .card-rail-section,
  .card-rail,
  .completion-grid,
  .completion-card {
    display: grid;
    gap: 12px;
  }

  .section-head,
  .history-meta-row,
  .history-state-row,
  .completion-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .section-head,
  .history-meta-row,
  .history-state-row {
    justify-content: space-between;
  }

  .section-copy h3,
  .section-copy p {
    margin: 0;
  }

  .card-rail {
    grid-template-columns: minmax(0, 1fr);
    max-height: min(34rem, 72vh);
    overflow-y: auto;
    align-items: start;
    padding-right: 2px;
  }

  .rail-card {
    min-width: 0;
  }

  .empty-card,
  .completion-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
  }

  .empty-card {
    background: var(--panel-strong);
    color: var(--text-soft);
  }

  .completion-card {
    background: var(--panel);
  }

  .single-column {
    grid-template-columns: minmax(0, 1fr);
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

  .vote-chip.selected {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .vote-chip.negative {
    color: var(--tablet-community-text);
  }

  .vote-chip.negative.selected {
    border-color: var(--tablet-community-bg);
    background: color-mix(in srgb, var(--tablet-community-bg) 16%, var(--panel));
    color: var(--tablet-community-text);
  }

  .history-state-row span,
  .history-meta-row span,
  .completion-card span {
    color: var(--text-soft);
  }

  .history-state-row strong,
  .completion-card strong,
  .section-copy h3 {
    color: var(--text-main);
  }

  [id^='history-card-'] {
    scroll-margin-top: 92px;
  }

  @media (max-width: 760px) {
    .completion-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>