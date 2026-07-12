<script lang="ts">
  import CollapsibleActivityCard from '$lib/components/cards/project-detail/CollapsibleActivityCard.svelte';
  import HistoryCompletionSideRow from '$lib/features/projects/detail/components/HistoryCompletionSideRow.svelte';
  import HistoryRatingComposer from '$lib/features/projects/detail/components/HistoryRatingComposer.svelte';
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
  export let deleteActivityRating: (activityId: string) => void | Promise<void> = () => {};

  let expandedComments: Record<string, boolean> = {};

  function completionStatusText(summary: ProjectServiceHistoryCompletionState) {
    if (summary.statusLabel) {
      return summary.statusLabel;
    }

    if (summary.systemAutoUncompleted) {
      return 'Marked uncompleted — no participants signed up';
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

  function viewerHasHistoryFollowUp(item: ProjectServiceHistoryItem) {
    const requesterNeeds =
      item.requesterCompletion?.viewerCanSet && item.requesterCompletion.viewerSelection == null;
    const participantNeeds =
      item.participantCompletion.viewerCanSet && item.participantCompletion.viewerSelection == null;

    return requesterNeeds || participantNeeds || item.viewerCanRate;
  }

  function viewerNeedsCompletionFollowUp(item: ProjectServiceHistoryItem) {
    const requesterNeeds =
      item.requesterCompletion?.viewerCanSet && item.requesterCompletion.viewerSelection == null;
    const participantNeeds =
      item.participantCompletion.viewerCanSet && item.participantCompletion.viewerSelection == null;

    return requesterNeeds || participantNeeds;
  }

  function hasCommunityCompletion(item: ProjectServiceHistoryItem) {
    return item.historyState !== 'unanswered-request';
  }

  function hasCommunitySection(item: ProjectServiceHistoryItem) {
    return hasCommunityCompletion(item) || item.ratings.length > 0;
  }

  function communityRatingSummary(item: ProjectServiceHistoryItem) {
    if (item.aggregateRating?.count > 0 && item.aggregateRating.average !== null) {
      return `${item.aggregateRating.average}★ · ${item.aggregateRating.count} ratings`;
    }

    return null;
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
    return item.aggregateCompletionLabel;
  }

  function historyRatingSummary(item: ProjectServiceHistoryItem) {
    if (item.aggregateRating?.count > 0 && item.aggregateRating.average !== null) {
      return `${item.aggregateRating.average}★`;
    }

    return 'No ratings yet';
  }

  function historyRatingIsMuted(item: ProjectServiceHistoryItem) {
    return !(item.aggregateRating?.count > 0 && item.aggregateRating.average !== null);
  }

  function toggleComments(itemId: string) {
    expandedComments = { ...expandedComments, [itemId]: !expandedComments[itemId] };
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
        <div id={`history-card-${item.id}`} class="rail-card">
          <CollapsibleActivityCard
            activity={item.activity}
            badgeLabel={historyBadgeLabel(item)}
            badgeClass={historyBadgeClass(item)}
            historyRatingSummary={historyRatingSummary(item)}
            historyRatingMuted={historyRatingIsMuted(item)}
            highlighted={highlightedHistoryId === item.id}
            historyMode={true}
            readOnly={true}
          >
            <div class="history-expanded-content">
              <div class="history-context">
                <p class="history-context-primary">
                  <strong>{item.historyStateLabel}</strong>
                  {#if item.historyStateDescription}
                    <span> — {item.historyStateDescription}</span>
                  {/if}
                </p>
                <p class="history-context-meta">
                  {#if item.requesterUsername}
                    <span>Requester: {item.requesterUsername}</span>
                    <span class="meta-separator">·</span>
                  {/if}
                  <span>Ended {formatRelativeTime(item.activity.endAt)}</span>
                </p>
              </div>

              {#if viewerHasHistoryFollowUp(item) || hasCommunitySection(item)}
                <div class="history-expanded-actions">
                  {#if viewerHasHistoryFollowUp(item)}
                    <section class="history-panel history-follow-up-panel">
                      <h4 class="history-section-heading">Your follow-up</h4>

                      {#if viewerNeedsCompletionFollowUp(item) && item.historyState !== 'unanswered-request'}
                        <div
                          class="completion-follow-up"
                          data-participation-target="history-completion"
                        >
                          {#if item.requesterCompletion}
                            <HistoryCompletionSideRow
                              label={item.requesterCompletion.label}
                              viewerCanSet={item.requesterCompletion.viewerCanSet}
                              viewerSelection={item.requesterCompletion.viewerSelection}
                              onSelect={(choice) => toggleHistoryCompletion(item.id, 'requester', choice)}
                            />
                          {/if}
                          <HistoryCompletionSideRow
                            label={item.participantCompletion.label}
                            viewerCanSet={item.participantCompletion.viewerCanSet}
                            viewerSelection={item.participantCompletion.viewerSelection}
                            onSelect={(choice) => toggleHistoryCompletion(item.id, 'participants', choice)}
                          />
                        </div>
                      {/if}

                      {#if item.viewerCanRate}
                        <div data-participation-target="history-rating">
                          {#key `${item.id}-${item.viewerRating?.rating ?? 'none'}-${item.viewerRating?.comment ?? ''}`}
                            <HistoryRatingComposer
                              {item}
                              hideTitle={true}
                              variant="flat"
                              {saveActivityRating}
                              {deleteActivityRating}
                            />
                          {/key}
                        </div>
                      {/if}
                    </section>
                  {/if}

                  {#if hasCommunitySection(item)}
                    <section class="history-panel history-community-panel">
                      <h4 class="history-section-heading">Community</h4>

                      {#if hasCommunityCompletion(item)}
                        <div class="community-completion-lines">
                          {#if item.requesterCompletion}
                            <p>
                              <strong>{item.requesterCompletion.label}:</strong>
                              {completionStatusText(item.requesterCompletion)}
                            </p>
                          {/if}
                          <p>
                            <strong>{item.participantCompletion.label}:</strong>
                            {completionStatusText(item.participantCompletion)}
                          </p>
                        </div>
                      {/if}

                      {#if item.ratings.length > 0}
                        {#if communityRatingSummary(item)}
                          <p class="community-rating-summary">{communityRatingSummary(item)}</p>
                        {/if}
                        <button class="comments-toggle" type="button" on:click={() => toggleComments(item.id)}>
                          {expandedComments[item.id] ? 'Hide comments' : `Show comments (${item.ratings.length})`}
                        </button>
                        {#if expandedComments[item.id]}
                          <div class="comments-list">
                            {#each item.ratings as rating (rating.userId)}
                              <div class="comment-row">
                                <div class="comment-head">
                                  <strong>{rating.username}</strong>
                                  {#if rating.roleLabel}
                                    <span class="role-badge">{rating.roleLabel}</span>
                                  {/if}
                                  <span>{rating.rating}★</span>
                                </div>
                                {#if rating.comment}
                                  <p>{rating.comment}</p>
                                {/if}
                              </div>
                            {/each}
                          </div>
                        {/if}
                      {/if}
                    </section>
                  {/if}
                </div>
              {/if}
            </div>
          </CollapsibleActivityCard>
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  .card-rail-section,
  .card-rail,
  .history-expanded-content,
  .history-panel,
  .completion-follow-up,
  .community-completion-lines,
  .comments-list {
    display: grid;
    gap: 10px;
  }

  .history-expanded-content {
    display: grid;
    gap: 12px;
  }

  .history-expanded-actions {
    display: grid;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid color-mix(in srgb, var(--panel-border) 70%, transparent);
  }

  .history-context {
    display: grid;
    gap: 4px;
  }

  .history-context-primary,
  .history-context-meta,
  .community-completion-lines p,
  .community-rating-summary,
  .comment-row p {
    margin: 0;
  }

  .history-context-primary {
    color: var(--text-main);
    font-size: 13px;
    line-height: 1.45;
  }

  .history-context-primary strong {
    font-weight: 700;
  }

  .history-context-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
    color: var(--text-soft);
    font-size: 12px;
  }

  .meta-separator {
    color: var(--text-soft);
  }

  .history-panel {
    gap: 8px;
    padding: 12px 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .history-section-heading {
    margin: 0;
    color: var(--brand-strong);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .card-rail {
    gap: 12px;
  }

  .section-head,
  .section-copy {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .section-head {
    justify-content: space-between;
  }

  .section-copy {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .section-copy h3,
  .section-copy p {
    margin: 0;
  }

  .section-copy p,
  .community-completion-lines p,
  .community-rating-summary,
  .comments-toggle {
    color: var(--text-soft);
    font-size: 12px;
  }

  .community-completion-lines p strong {
    color: var(--text-main);
    font-weight: 700;
  }

  .comment-row,
  .empty-card {
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .comments-toggle {
    border: 0;
    background: transparent;
    padding: 0;
    width: fit-content;
    text-decoration: underline;
    text-underline-offset: 2px;
    font-weight: 700;
    cursor: pointer;
  }

  .comment-head {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .role-badge {
    padding: 2px 6px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    color: var(--text-soft);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .comment-row {
    display: grid;
    gap: 4px;
  }
</style>
