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
  export let hideHeader = false;
  export let highlightedHistoryId: string | null = null;
  export let toggleHistoryCompletion: (
    historyId: string,
    role: ProjectServiceHistoryCompletionRole,
    selection?: ProjectServiceHistoryCompletionChoice
  ) => void | Promise<void> = () => {};
  export let saveActivityRating: (
    activityId: string,
    rating: number,
    comment: string | null
  ) => void | Promise<void> = () => {};

  let expandedComments: Record<string, boolean> = {};
  let ratingDrafts: Record<string, { rating: number; comment: string }> = {};
  let savingRatingId = '';

  function completionStatusText(summary: ProjectServiceHistoryCompletionState) {
    if (summary.statusLabel) {
      return summary.statusLabel;
    }

    if (summary.systemAutoUncompleted) {
      return 'Marked uncompleted — minimum staffing not met';
    }

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

  function historyBadgeLabel(item: ProjectServiceHistoryItem) {
    if (item.aggregateRating?.count > 0 && item.aggregateRating.average !== null) {
      return `${item.aggregateRating.average} · ${item.aggregateRating.count} rating${item.aggregateRating.count === 1 ? '' : 's'}`;
    }

    return item.aggregateCompletionLabel;
  }

  function ensureRatingDraft(item: ProjectServiceHistoryItem) {
    if (ratingDrafts[item.id]) {
      return ratingDrafts[item.id];
    }

    ratingDrafts[item.id] = {
      rating: item.viewerRating?.rating ?? 0,
      comment: item.viewerRating?.comment ?? ''
    };
    return ratingDrafts[item.id];
  }

  function setRatingDraft(item: ProjectServiceHistoryItem, rating: number) {
    const draft = ensureRatingDraft(item);
    ratingDrafts[item.id] = { ...draft, rating };
  }

  function toggleComments(itemId: string) {
    expandedComments[itemId] = !expandedComments[itemId];
  }

  async function submitRating(item: ProjectServiceHistoryItem) {
    const draft = ensureRatingDraft(item);
    if (draft.rating < 1 || draft.rating > 5) {
      return;
    }

    savingRatingId = item.id;
    try {
      await saveActivityRating(
        item.activity.id,
        draft.rating,
        draft.comment.trim() ? draft.comment.trim() : null
      );
    } finally {
      savingRatingId = '';
    }
  }
</script>

<section class="card-rail-section">
  {#if !hideHeader}
    <div class="section-head">
      <div class="section-copy">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  {/if}

  {#if items.length === 0}
    <div class="empty-card">{emptyMessage}</div>
  {:else}
    <div class="card-rail">
      {#each items as item (item.id)}
        {@const draft = ensureRatingDraft(item)}
        <div id={`history-card-${item.id}`} class="rail-card">
          <CollapsibleActivityCard
            activity={item.activity}
            badgeLabel={historyBadgeLabel(item)}
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

            {#if item.viewerCanRate || item.ratings.length > 0}
              <div class="rating-block">
                {#if item.viewerCanRate}
                  <div class="rating-editor">
                    <strong>Your rating</strong>
                    <div class="star-row" role="group" aria-label="Rate this activity from 1 to 5 stars">
                      {#each [1, 2, 3, 4, 5] as star}
                        <button
                          class:selected={draft.rating === star}
                          class="star-button"
                          type="button"
                          on:click={() => setRatingDraft(item, star)}
                        >
                          {star}★
                        </button>
                      {/each}
                    </div>
                    <textarea
                      bind:value={ratingDrafts[item.id].comment}
                      maxlength="2000"
                      placeholder="Optional comment"
                      rows="3"
                    ></textarea>
                    <button
                      class="secondary-button"
                      disabled={draft.rating < 1 || savingRatingId === item.id}
                      type="button"
                      on:click={() => submitRating(item)}
                    >
                      {savingRatingId === item.id ? 'Saving…' : 'Save rating'}
                    </button>
                  </div>
                {/if}

                {#if item.ratings.length > 0}
                  <button class="comments-toggle" type="button" on:click={() => toggleComments(item.id)}>
                    {expandedComments[item.id] ? 'Hide comments' : `Show comments (${item.ratings.length})`}
                  </button>
                  {#if expandedComments[item.id]}
                    <div class="comments-list">
                      {#each item.ratings as rating (rating.userId)}
                        <div class="comment-row">
                          <strong>{rating.username}</strong>
                          <span>{rating.rating}★</span>
                          {#if rating.comment}
                            <p>{rating.comment}</p>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  {/if}
                {/if}
              </div>
            {/if}

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
  .completion-card,
  .rating-block,
  .rating-editor,
  .comments-list {
    display: grid;
    gap: 12px;
  }

  .section-head,
  .history-meta-row,
  .history-state-row,
  .completion-actions,
  .star-row {
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
  .completion-card,
  .rating-block {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .empty-card {
    background: var(--panel-strong);
    color: var(--text-soft);
  }

  .single-column {
    grid-template-columns: minmax(0, 1fr);
  }

  .vote-chip,
  .star-button,
  .secondary-button,
  .comments-toggle {
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .star-button.selected,
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

  .comments-toggle {
    width: fit-content;
  }

  .comment-row {
    display: grid;
    gap: 4px;
    padding-top: 8px;
    border-top: 1px solid var(--panel-border);
  }

  .comment-row p {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.45;
  }

  textarea {
    width: 100%;
    min-height: 72px;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-main);
    resize: vertical;
  }

  .history-state-row span,
  .history-meta-row span,
  .completion-card span {
    color: var(--text-soft);
  }

  .history-state-row strong,
  .completion-card strong,
  .section-copy h3,
  .rating-editor strong {
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
