<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import SurfaceTypeLabel from '$lib/components/cards/shared/SurfaceTypeLabel.svelte';
  import { surfaceAccentCssVar, surfaceTypeAccent } from '$lib/utils/surfaceType';
  import {
    setEventActivityCommitment,
    setEventEditVote,
    setEventPhaseChangeVote,
    setEventPlanOverallVote,
    setEventUpdateVote,
    setProjectActivityCommitment,
    setProjectEditVote,
    setProjectPhaseChangeVote,
    setProjectPlanOverallVote,
    setProjectUpdateVote,
    toggleEventMembership
  } from '$lib/services/queries/details';
  import type { RightRailActivityItem } from '$lib/types/bootstrap';
  import {
    dismissRailItemId,
    dismissedRailRevision,
    dismissedRailStorageKey,
    markRailItemSeen,
    pruneDismissedRailIds,
    readDismissedRailIds,
    readSeenRailIds,
    restoreAllRailItems,
    restoreRailItemId,
    seenRailStorageKey
  } from '$lib/utils/dismissedRailItems';
  import { scrollToPendingVote } from '$lib/utils/pendingVotes';
  import { formatLocalDateTime, formatScheduleLabel } from '$lib/utils/time';

  export let items: RightRailActivityItem[] = [];
  export let historyItems: RightRailActivityItem[] = [];
  export let viewerId: string | null = null;

  const dispatch = createEventDispatcher<{ close: void }>();

  let pendingSubjectId = '';
  let pendingVoteId = '';
  let clearedOpen = false;
  let showAllHistory = false;

  $: dismissedStorageKey = dismissedRailStorageKey(viewerId);
  $: seenStorageKey = seenRailStorageKey(viewerId);
  $: dismissedRailIds = readDismissedRailIds(dismissedStorageKey, $dismissedRailRevision);
  $: seenRailIds = readSeenRailIds(seenStorageKey, $dismissedRailRevision);
  $: activeRailIdSet = new Set(items.map((item) => item.id));
  $: if (dismissedStorageKey) {
    pruneDismissedRailIds(dismissedStorageKey, activeRailIdSet);
  }

  function dismissRailItem(itemId: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    dismissRailItemId(dismissedStorageKey, itemId);
  }

  function restoreRailItem(itemId: string) {
    restoreRailItemId(dismissedStorageKey, itemId);
  }

  function restoreAllClearedItems() {
    restoreAllRailItems(dismissedStorageKey);
    clearedOpen = false;
  }

  $: visibleItems = items.filter((item) => !dismissedRailIds.has(item.id));
  $: clearedItems = items.filter(
    (item) => dismissedRailIds.has(item.id) && activeRailIdSet.has(item.id)
  );
  $: displayedHistoryItems = showAllHistory
    ? historyItems
    : historyItems.filter((item) => item.viewerParticipated !== false);
  $: activityItems = visibleItems.filter(
    (item) =>
      item.kind !== 'request' &&
      item.kind !== 'vote' &&
      item.kind !== 'help-request-open' &&
      item.kind !== 'help-request-signup' &&
      item.kind !== 'help-request-owned'
  );
  $: helpRequestItems = visibleItems.filter(
    (item) =>
      item.kind === 'help-request-open' ||
      item.kind === 'help-request-signup' ||
      item.kind === 'help-request-owned'
  );
  $: requestItems = visibleItems.filter((item) => item.kind === 'request');
  $: voteItems = visibleItems.filter((item) => item.kind === 'vote');

  function requestClose() {
    dispatch('close');
  }

  function usesRoleCommitment(item: RightRailActivityItem) {
    return (item.kind === 'project' || item.kind === 'event') && !!item.activityId;
  }

  function isRailActionActive(item: RightRailActivityItem) {
    if (usesRoleCommitment(item)) {
      return !!item.viewerAssignedRoleLabel;
    }

    return !!item.viewerIsParticipating;
  }

  function isRailActionDisabled(item: RightRailActivityItem) {
    return usesRoleCommitment(item) && !item.viewerAssignedRoleLabel && item.hasOpenRole === false;
  }

  function itemKicker(item: RightRailActivityItem) {
    if (
      item.kind === 'help-request-signup' ||
      item.kind === 'help-request-open' ||
      item.kind === 'help-request-owned'
    ) {
      return 'Help request';
    }
    if (item.kind === 'request') return 'Service request';
    if (item.kind === 'vote') return item.voteKindLabel ? `Vote · ${item.voteKindLabel.replace('_', ' ')}` : 'Vote';
    return item.kind === 'event' ? 'Event activity' : 'Project activity';
  }

  function itemAccent(item: RightRailActivityItem) {
    return surfaceTypeAccent(itemSurfaceKind(item), item.projectMode ?? 'productive');
  }

  function itemSurfaceKind(item: RightRailActivityItem) {
    if (
      item.kind === 'help-request-open' ||
      item.kind === 'help-request-signup' ||
      item.kind === 'help-request-owned'
    ) {
      return 'help-request';
    }

    return item.kind === 'event' || item.voteEntityKind === 'event' ? 'event' : 'project';
  }

  function itemTimeLabel(item: RightRailActivityItem) {
    if (item.kind === 'project' || item.kind === 'event' || item.kind === 'vote') {
      const source = item.createdAt ?? item.timeLabel;

      if (!source) {
        return '';
      }

      const parsed = formatLocalDateTime(source);

      if (parsed) {
        return parsed;
      }

      return source;
    }

    const source = item.timeLabel ?? item.createdAt;

    if (!source) {
      return '';
    }

    const parsed = formatLocalDateTime(source);

    if (parsed) {
      return parsed;
    }

    return formatScheduleLabel(source);
  }

  async function handleRailAssess(item: RightRailActivityItem, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    markRailItemSeen(seenStorageKey, item.id);
    requestClose();

    const basePath = item.href.split('?')[0];
    await goto(`${basePath}#pending-votes-panel`);
  }

  function itemDetail(item: RightRailActivityItem) {
    if (item.kind === 'request' && item.requesterUsername) return `Requested by ${item.requesterUsername}`;
    return item.countLabel ?? '';
  }

  function isUnseenItem(item: RightRailActivityItem) {
    return !seenRailIds.has(item.id);
  }

  async function handleOpenItem(item: RightRailActivityItem) {
    markRailItemSeen(seenStorageKey, item.id);
    requestClose();
    await goto(item.href);
  }

  function slugFromVoteItem(item: RightRailActivityItem) {
    if (item.projectSlug) {
      return { entityKind: 'project' as const, slug: item.projectSlug };
    }

    if (item.eventSlug) {
      return { entityKind: 'event' as const, slug: item.eventSlug };
    }

    const match = item.href.match(/^\/(projects|events)\/([^/?]+)/);

    if (!match) {
      return null;
    }

    return {
      entityKind: match[1] === 'events' ? ('event' as const) : ('project' as const),
      slug: match[2]
    };
  }

  async function handleRailVote(item: RightRailActivityItem, vote: 'yes' | 'no', event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!item.voteKindLabel || !item.voteTargetId) {
      return;
    }

    const slugInfo = slugFromVoteItem(item);

    if (!slugInfo) {
      return;
    }

    pendingVoteId = item.id;

    try {
      const { entityKind, slug } = slugInfo;
      const targetId = item.voteTargetId;

      if (entityKind === 'project') {
        switch (item.voteKindLabel) {
          case 'phase_change':
            await setProjectPhaseChangeVote(slug, targetId, vote);
            break;
          case 'update':
            await setProjectUpdateVote(slug, targetId, vote);
            break;
          case 'edit':
            await setProjectEditVote(slug, targetId, vote);
            break;
          case 'plan':
            await setProjectPlanOverallVote(
              slug,
              item.planPhaseId === 'phase-3' ? 'phase-3' : 'phase-2',
              targetId,
              vote
            );
            break;
        }
      } else {
        switch (item.voteKindLabel) {
          case 'phase_change':
            await setEventPhaseChangeVote(slug, targetId, vote);
            break;
          case 'update':
            await setEventUpdateVote(slug, targetId, vote);
            break;
          case 'edit':
            await setEventEditVote(slug, targetId, vote);
            break;
          case 'plan':
            await setEventPlanOverallVote(slug, targetId, vote);
            break;
        }
      }

      await invalidateAll();
      markRailItemSeen(seenStorageKey, item.id);
      scrollToPendingVote(item.voteKindLabel, item.voteTargetId);
    } finally {
      pendingVoteId = '';
    }
  }

  async function handleRailParticipation(item: RightRailActivityItem) {
    if (item.kind === 'request' || item.kind === 'vote') {
      return;
    }

    if (usesRoleCommitment(item)) {
      if (!item.viewerAssignedRoleLabel && item.hasOpenRole === false) {
        return;
      }

      if (item.viewerAssignedRoleLabel) {
        pendingSubjectId = item.subjectId;

        try {
          if (item.kind === 'project') {
            if (!item.projectSlug || !item.activityId) {
              return;
            }

            await setProjectActivityCommitment(item.projectSlug, item.activityId, null);
          } else {
            if (!item.eventSlug || !item.activityId) {
              return;
            }

            await setEventActivityCommitment(item.eventSlug, item.activityId, null);
          }

          await invalidateAll();
        } finally {
          pendingSubjectId = '';
        }

        return;
      }

      requestClose();
      await goto(item.href);
      return;
    }

    pendingSubjectId = item.subjectId;

    try {
      await toggleEventMembership(item.eventSlug ?? item.subjectId);
      await invalidateAll();
    } finally {
      pendingSubjectId = '';
    }
  }
</script>


<section class="rail-panel">
  <section class="rail-section">
    <h2>Project Activity & Events</h2>
    <div class:snapshot-scroll={activityItems.length > 5} class="snapshot-stack">
      {#if activityItems.length === 0}
        <div class="snapshot-row">
          <strong>No activity yet</strong>
          <span>Tagged project activity, invites, and related events will appear here when they match your memberships.</span>
        </div>
      {:else}
        {#each activityItems as item}
          <article
            class="snapshot-row activity-row"
            class:activity-row-unseen={isUnseenItem(item)}
            style={`--row-accent: ${surfaceAccentCssVar(itemAccent(item))};`}
          >
            <button
              aria-label="Dismiss activity card"
              class="dismiss-card"
              type="button"
              on:click={(event) => dismissRailItem(item.id, event)}
            >
              ×
            </button>
            <button class="activity-open-button" type="button" on:click={() => handleOpenItem(item)}>
              <div class="activity-topline">
                <SurfaceTypeLabel kind={itemSurfaceKind(item)} projectMode={item.projectMode ?? 'productive'} />
                <span class="snapshot-time">{itemTimeLabel(item)}</span>
              </div>
              {#if itemKicker(item)}
                <span class="card-kicker">{itemKicker(item)}</span>
              {/if}
              <strong>{item.title}</strong>
              {#if item.meta}
                <span class="card-meta">{item.meta}</span>
              {/if}
              {#if itemDetail(item)}
                <span class="card-detail">{itemDetail(item)}</span>
              {/if}
            </button>
          </article>
        {/each}
      {/if}
    </div>
  </section>

  <section class="rail-section rail-section-help-requests">
    <h2>Help Requests</h2>
    <div class:snapshot-scroll={helpRequestItems.length > 5} class="snapshot-stack">
      {#if helpRequestItems.length === 0}
        <div class="snapshot-row">
          <strong>No help requests yet</strong>
          <span>Open requests in channels and communities you belong to, plus any you sign up for, appear here.</span>
        </div>
      {:else}
        {#each helpRequestItems as item}
          <article
            class="snapshot-row activity-row help-request-row"
            style={`--row-accent: ${surfaceAccentCssVar(itemAccent(item))};`}
          >
            <button
              aria-label="Dismiss help request card"
              class="dismiss-card"
              type="button"
              on:click={(event) => dismissRailItem(item.id, event)}
            >
              ×
            </button>
            <button class="activity-open-button" type="button" on:click={() => handleOpenItem(item)}>
              <div class="activity-topline">
                <SurfaceTypeLabel kind={itemSurfaceKind(item)} projectMode={item.projectMode ?? 'productive'} />
                <span class="snapshot-time">{itemTimeLabel(item)}</span>
              </div>
              {#if itemKicker(item)}
                <span class="card-kicker">{itemKicker(item)}</span>
              {/if}
              <strong>{item.title}</strong>
              {#if item.body}
                <span class="card-body-preview">{item.body}</span>
              {/if}
              {#if item.meta}
                <span class="card-meta">{item.meta}</span>
              {/if}
              {#if itemDetail(item)}
                <span class="card-detail">{itemDetail(item)}</span>
              {/if}
            </button>
          </article>
        {/each}
      {/if}
    </div>
  </section>

  <section class="rail-section rail-section-requests">
    <h2>Requests</h2>
    <div class:snapshot-scroll={requestItems.length > 5} class="snapshot-stack">
      {#if requestItems.length === 0}
        <div class="snapshot-row">
          <strong>No open requests</strong>
          <span>Service requests you can review will appear here and open the matching project card.</span>
        </div>
      {:else}
        {#each requestItems as item}
          <article
            class="snapshot-row activity-row request-row"
            style={`--row-accent: ${surfaceAccentCssVar(itemAccent(item))};`}
          >
            <button
              aria-label="Dismiss request card"
              class="dismiss-card"
              type="button"
              on:click={(event) => dismissRailItem(item.id, event)}
            >
              ×
            </button>
            <button class="activity-open-button" type="button" on:click={() => handleOpenItem(item)}>
              <div class="activity-topline">
                <SurfaceTypeLabel kind={itemSurfaceKind(item)} projectMode={item.projectMode ?? 'collective-service'} />
                <span class="snapshot-time">{itemTimeLabel(item)}</span>
              </div>
              {#if itemKicker(item)}
                <span class="card-kicker">{itemKicker(item)}</span>
              {/if}
              <strong>{item.title}</strong>
              {#if item.meta}
                <span class="card-meta">{item.meta}</span>
              {/if}
              {#if itemDetail(item)}
                <span class="card-detail">{itemDetail(item)}</span>
              {/if}
            </button>
          </article>
        {/each}
      {/if}
    </div>
  </section>

  <section class="rail-section rail-section-votes">
    <h2>Active Votes</h2>
    <div class:snapshot-scroll={voteItems.length > 5} class="snapshot-stack">
      {#if voteItems.length === 0}
        <div class="snapshot-row">
          <strong>No active votes</strong>
          <span>When your memberships have open decisions, they appear here for one-click voting.</span>
        </div>
      {:else}
        {#each voteItems as item}
          <article
            class="snapshot-row activity-row vote-row"
            style={`--row-accent: ${surfaceAccentCssVar(itemAccent(item))};`}
          >
            <button
              aria-label="Dismiss vote card"
              class="dismiss-card"
              type="button"
              on:click={(event) => dismissRailItem(item.id, event)}
            >
              ×
            </button>
            <button class="activity-open-button" type="button" on:click={() => handleOpenItem(item)}>
              <div class="activity-topline">
                <SurfaceTypeLabel
                  kind={itemSurfaceKind(item)}
                  projectMode={item.projectMode ?? 'productive'}
                />
                <span class="snapshot-time">{itemTimeLabel(item)}</span>
              </div>
              {#if itemKicker(item)}
                <span class="card-kicker">{itemKicker(item)}</span>
              {/if}
              <strong>{item.title}</strong>
              {#if item.meta}
                <span class="card-meta">{item.meta}</span>
              {/if}
              {#if itemDetail(item)}
                <span class="card-detail">{itemDetail(item)}</span>
              {/if}
            </button>
            <div class="vote-row-actions">
              {#if item.voteKindLabel === 'plan'}
                <button
                  class="vote-action-button assess-button"
                  disabled={pendingVoteId === item.id}
                  type="button"
                  on:click={(event) => handleRailAssess(item, event)}
                >
                  Assess
                </button>
              {/if}
              {#if item.voteKindLabel !== 'plan' || item.voteSubKind === 'overall'}
                <button
                  class="vote-action-button reject-button"
                  disabled={pendingVoteId === item.id}
                  type="button"
                  on:click={(event) => handleRailVote(item, 'no', event)}
                >
                  Reject
                </button>
                <button
                  class="vote-action-button approve-button"
                  disabled={pendingVoteId === item.id}
                  type="button"
                  on:click={(event) => handleRailVote(item, 'yes', event)}
                >
                  Approve
                </button>
              {/if}
            </div>
          </article>
        {/each}
      {/if}
    </div>
  </section>

  {#if historyItems.length > 0}
    <details class="rail-section rail-section-history history-section">
      <summary class="rail-section-summary">
        <span>History</span>
        <span class="rail-section-count">{historyItems.length}</span>
      </summary>
      <div class="history-body">
        <div class="history-filter" role="group" aria-label="History filter">
          <button
            class:selected={showAllHistory}
            class="history-filter-button"
            type="button"
            on:click={() => (showAllHistory = true)}
          >
            All
          </button>
          <button
            class:selected={!showAllHistory}
            class="history-filter-button"
            type="button"
            on:click={() => (showAllHistory = false)}
          >
            Mine only
          </button>
        </div>
        {#if displayedHistoryItems.length === 0}
          <p class="history-empty">No history items match this filter.</p>
        {:else}
          <div class="history-list">
            {#each displayedHistoryItems as item}
              <button class="history-row" type="button" on:click={() => handleOpenItem(item)}>
                <span class="history-kind">{itemKicker(item)}</span>
                <strong>{item.title}</strong>
                {#if item.meta}
                  <span class="history-meta">{item.meta}</span>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </details>
  {/if}

  {#if clearedItems.length > 0}
    <details class="rail-section rail-section-cleared cleared-section" bind:open={clearedOpen}>
      <summary class="rail-section-summary">
        <span>Cleared</span>
        <span class="rail-section-count">{clearedItems.length}</span>
      </summary>
      <div class="cleared-body">
        <button class="cleared-restore-all" type="button" on:click={restoreAllClearedItems}>
          Restore all
        </button>
        <div class="cleared-list">
          {#each clearedItems as item}
            <div class="cleared-row">
              <button class="cleared-open-button" type="button" on:click={() => handleOpenItem(item)}>
                <span class="cleared-kind">{itemKicker(item)}</span>
                <strong>{item.title}</strong>
                {#if item.meta}
                  <span class="cleared-meta">{item.meta}</span>
                {/if}
              </button>
              <button
                class="cleared-restore-one"
                type="button"
                on:click|stopPropagation={() => restoreRailItem(item.id)}
              >
                Restore
              </button>
            </div>
          {/each}
        </div>
      </div>
    </details>
  {/if}
</section>

<style>
  .rail-panel {
    display: grid;
    gap: 16px;
    padding: 0 0 12px;
    border-bottom: 1px solid var(--panel-border);
  }

  .rail-section {
    display: grid;
    gap: 10px;
  }

  .rail-section-requests {
    padding-top: 4px;
    border-top: 1px solid color-mix(in srgb, var(--panel-border) 75%, transparent);
  }

  .rail-section-votes {
    padding-top: 4px;
    border-top: 1px solid color-mix(in srgb, var(--panel-border) 75%, transparent);
  }

  .rail-panel h2 {
    font-size: 14px;
    color: var(--text-main);
  }

  .snapshot-stack {
    display: grid;
    gap: 0;
  }

  .snapshot-stack.snapshot-scroll {
    max-height: 31rem;
    overflow-y: auto;
    padding-right: 4px;
  }

  .snapshot-row {
    position: relative;
    display: grid;
    gap: 8px;
    padding: 14px 12px;
    border: none;
    border-bottom: 1px solid var(--panel-border);
    border-radius: 0;
    background: var(--panel);
    transition: background-color 0.16s ease;
  }

  .snapshot-row:last-child {
    border-bottom: none;
  }

  .activity-row {
    border-left: 3px solid var(--row-accent, var(--type-accent-neutral));
  }

  .activity-row:hover {
    background: var(--panel-hover);
  }

  .activity-row-unseen {
    background: color-mix(in srgb, var(--panel-hover) 55%, var(--panel));
  }

  .dismiss-card {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel);
    color: var(--text-soft);
    font-size: 16px;
    line-height: 1;
  }

  .dismiss-card:hover {
    border-color: var(--brand);
    color: var(--brand-strong);
    background: var(--brand-soft);
  }

  .activity-open-button {
    display: grid;
    gap: 8px;
    width: 100%;
    padding: 0 28px 0 0;
    border: none;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }

  .card-kicker {
    color: var(--brand-strong);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .snapshot-row strong {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-main);
  }

  .snapshot-row span {
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.45;
  }

  .card-meta {
    color: var(--text-main);
  }

  .card-body-preview {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    color: var(--text-soft);
    line-height: 1.4;
  }

  .card-detail {
    display: inline-flex;
    width: fit-content;
    padding: 4px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--panel) 72%, var(--brand-soft));
    color: var(--text-soft);
    font-weight: 700;
  }

  .activity-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }

  .snapshot-time {
    white-space: nowrap;
  }

  .request-row .card-kicker,
  .vote-row .card-kicker {
    color: var(--accent-warm-strong);
  }

  .vote-row {
    display: grid;
    gap: 10px;
  }

  .vote-row-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding: 0 12px 12px;
  }

  .vote-action-button {
    padding: 7px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
  }

  .vote-action-button.approve-button {
    background: var(--brand);
    color: var(--page-bg);
  }

  .vote-action-button.reject-button {
    border: 1px solid var(--panel-border);
    background: transparent;
    color: var(--text-main);
  }

  .vote-action-button.assess-button {
    border: 1px solid var(--panel-border);
    background: var(--panel-strong);
    color: var(--text-main);
  }

  .rail-section-cleared {
    padding-top: 8px;
    border-top: 1px solid color-mix(in srgb, var(--panel-border) 75%, transparent);
  }

  .rail-section-history {
    padding-top: 8px;
    border-top: 1px solid color-mix(in srgb, var(--panel-border) 75%, transparent);
  }

  .rail-section-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    cursor: pointer;
    list-style: none;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-main);
  }

  .rail-section-summary::-webkit-details-marker {
    display: none;
  }

  .rail-section-count {
    padding: 4px 8px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
  }

  details[open] > .rail-section-summary .rail-section-count {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .history-body,
  .cleared-body {
    display: grid;
    gap: 10px;
    margin-top: 10px;
  }

  .history-filter {
    display: inline-flex;
    gap: 0;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    overflow: hidden;
    width: fit-content;
  }

  .history-filter-button {
    padding: 6px 10px;
    border: none;
    background: var(--panel);
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
  }

  .history-filter-button.selected {
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .history-filter-button:hover {
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .history-empty {
    margin: 0;
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 600;
  }

  .history-row {
    display: grid;
    gap: 4px;
    width: 100%;
    text-align: left;
    padding: 10px 8px;
    border: none;
    border-bottom: 1px solid var(--panel-border);
    border-radius: 0;
    background: transparent;
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .history-row:hover {
    background: var(--panel-strong);
  }

  .history-kind,
  .history-meta {
    color: var(--text-soft);
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .history-meta {
    text-transform: none;
    font-weight: 600;
    font-size: 11px;
  }

  .cleared-restore-all {
    width: fit-content;
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .cleared-restore-all:hover {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .cleared-list {
    display: grid;
    gap: 0;
  }

  .cleared-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    border-bottom: 1px solid var(--panel-border);
  }

  .cleared-row:last-child {
    border-bottom: none;
  }

  .cleared-open-button {
    display: grid;
    gap: 4px;
    width: 100%;
    min-width: 0;
    text-align: left;
    padding: 10px 8px;
    border: none;
    border-radius: 0;
    background: transparent;
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .cleared-open-button:hover {
    background: var(--panel-strong);
  }

  .cleared-open-button strong {
    font-size: 13px;
    color: var(--text-main);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cleared-kind,
  .cleared-meta {
    color: var(--text-soft);
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .cleared-meta {
    text-transform: none;
    font-weight: 600;
    font-size: 11px;
  }

  .cleared-restore-one {
    margin-right: 8px;
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }

  .cleared-restore-one:hover {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }
</style>
