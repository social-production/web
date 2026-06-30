<script lang="ts">
  import { browser } from '$app/environment';
  import { createEventDispatcher } from 'svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import SubjectTablet from '$lib/components/cards/shared/SubjectTablet.svelte';
  import {
    setEventActivityCommitment,
    setProjectActivityCommitment,
    toggleEventMembership
  } from '$lib/services/queries/details';
  import type { RightRailActivityItem } from '$lib/types/bootstrap';
  import { formatScheduleLabel } from '$lib/utils/time';

  export let items: RightRailActivityItem[] = [];
  export let viewerId: string | null = null;

  const dispatch = createEventDispatcher<{ close: void }>();

  let pendingSubjectId = '';
  let dismissedRailIds = new Set<string>();

  $: dismissedStorageKey = viewerId ? `dismissed-rail-ids-${viewerId}` : 'dismissed-rail-ids';

  function readDismissedRailIds(storageKey: string) {
    if (!browser) {
      return new Set<string>();
    }

    try {
      const stored = localStorage.getItem(storageKey);

      if (!stored) {
        return new Set<string>();
      }

      const parsed = JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        return new Set<string>();
      }

      return new Set<string>(parsed.filter((value): value is string => typeof value === 'string'));
    } catch {
      return new Set<string>();
    }
  }

  function persistDismissedRailIds(storageKey: string) {
    if (!browser) {
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify([...dismissedRailIds]));
  }

  function dismissRailItem(itemId: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    dismissedRailIds = new Set([...dismissedRailIds, itemId]);
    persistDismissedRailIds(dismissedStorageKey);
  }

  $: if (browser) {
    dismissedRailIds = readDismissedRailIds(dismissedStorageKey);
  }

  $: visibleItems = items.filter(
    (item) =>
      item.kind === 'vote' ||
      item.viewerIsAuthor ||
      !dismissedRailIds.has(item.id)
  );
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
      return '';
    }
    if (item.kind === 'request') return 'Service request';
    if (item.kind === 'vote') return item.voteKindLabel ? `Vote · ${item.voteKindLabel.replace('_', ' ')}` : 'Vote';
    return item.kind === 'event' ? 'Event activity' : 'Project activity';
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
    if (item.timeLabel && !item.timeLabel.includes('T')) {
      return item.timeLabel;
    }

    const source = item.timeLabel ?? item.createdAt;

    if (!source) {
      return '';
    }

    return formatScheduleLabel(source);
  }

  function itemDetail(item: RightRailActivityItem) {
    if (item.kind === 'request' && item.requesterUsername) return `Requested by ${item.requesterUsername}`;
    return item.countLabel ?? '';
  }

  async function handleOpenItem(item: RightRailActivityItem) {
    requestClose();
    await goto(item.href);
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
    <p class="section-subtitle">Project activity and related events from your memberships and scopes.</p>
    <div class:snapshot-scroll={activityItems.length > 5} class="snapshot-stack">
      {#if activityItems.length === 0}
        <div class="snapshot-row">
          <strong>No activity yet</strong>
          <span>Tagged project activity, invites, and related events will appear here when they match your memberships.</span>
        </div>
      {:else}
        {#each activityItems as item}
          <article class="snapshot-row activity-row">
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
                <SubjectTablet kind={itemSurfaceKind(item)} projectMode={item.projectMode ?? 'productive'} />
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
    <p class="section-subtitle">Open help requests in your scopes and anything you signed up for.</p>
    <div class:snapshot-scroll={helpRequestItems.length > 5} class="snapshot-stack">
      {#if helpRequestItems.length === 0}
        <div class="snapshot-row">
          <strong>No help requests yet</strong>
          <span>Open requests in channels and communities you belong to, plus any you sign up for, appear here.</span>
        </div>
      {:else}
        {#each helpRequestItems as item}
          <article class="snapshot-row activity-row help-request-row">
            {#if !item.viewerIsAuthor}
              <button
                aria-label="Dismiss help request card"
                class="dismiss-card"
                type="button"
                on:click={(event) => dismissRailItem(item.id, event)}
              >
                ×
              </button>
            {/if}
            <button class="activity-open-button" type="button" on:click={() => handleOpenItem(item)}>
              <div class="activity-topline">
                <SubjectTablet kind={itemSurfaceKind(item)} projectMode={item.projectMode ?? 'productive'} />
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
    <p class="section-subtitle">Open service requests on projects you manage or personal services you offer.</p>
    <div class:snapshot-scroll={requestItems.length > 5} class="snapshot-stack">
      {#if requestItems.length === 0}
        <div class="snapshot-row">
          <strong>No open requests</strong>
          <span>Service requests you can review will appear here and open the matching project card.</span>
        </div>
      {:else}
        {#each requestItems as item}
          <article class="snapshot-row activity-row request-row">
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
                <SubjectTablet kind={itemSurfaceKind(item)} projectMode={item.projectMode ?? 'collective-service'} />
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
    <p class="section-subtitle">Open project and event decisions where your vote is still needed.</p>
    <div class:snapshot-scroll={voteItems.length > 5} class="snapshot-stack">
      {#if voteItems.length === 0}
        <div class="snapshot-row">
          <strong>No active votes</strong>
          <span>When your memberships have open decisions, they appear here for one-click voting.</span>
        </div>
      {:else}
        {#each voteItems as item}
          <article class="snapshot-row activity-row vote-row">
            <button class="activity-open-button" type="button" on:click={() => handleOpenItem(item)}>
              <div class="activity-topline">
                <SubjectTablet
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
          </article>
        {/each}
      {/if}
    </div>
  </section>
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

  .section-subtitle {
    margin: 4px 0 10px;
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.45;
  }

  .snapshot-stack {
    display: grid;
    gap: 6px;
  }

  .snapshot-stack.snapshot-scroll {
    max-height: 31rem;
    overflow-y: auto;
    padding-right: 4px;
  }

  .snapshot-row {
    position: relative;
    display: grid;
    gap: 10px;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    transition: border-color 0.16s ease, background-color 0.16s ease;
  }

  .activity-row:hover {
    border-color: var(--brand);
    background: color-mix(in srgb, var(--brand-soft) 42%, var(--panel-soft));
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
</style>
