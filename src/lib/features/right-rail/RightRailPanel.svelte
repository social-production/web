<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import SubjectTablet from '$lib/components/cards/shared/SubjectTablet.svelte';
  import {
    setEventActivityCommitment,
    setProjectActivityCommitment,
    toggleEventMembership
  } from '$lib/services/queries/details';
  import type { RightRailActivityItem } from '$lib/types/bootstrap';
  import { formatCalendarTime } from '$lib/utils/time';

  export let compact = false;
  export let items: RightRailActivityItem[] = [];

  const dispatch = createEventDispatcher<{ close: void }>();

  let pendingSubjectId = '';

  $: activityItems = items.filter((item) => item.kind !== 'request' && item.kind !== 'vote');
  $: requestItems = items.filter((item) => item.kind === 'request');
  $: voteItems = items.filter((item) => item.kind === 'vote');

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

  function itemSurfaceKind(item: RightRailActivityItem) {
    return item.kind === 'event' || item.voteEntityKind === 'event' ? 'event' : 'project';
  }

  function itemKicker(item: RightRailActivityItem) {
    if (item.kind === 'request') return 'Service request';
    if (item.kind === 'vote') return item.voteKindLabel ? `Vote · ${item.voteKindLabel.replace('_', ' ')}` : 'Vote';
    return item.kind === 'event' ? 'Event activity' : 'Project activity';
  }

  function itemTimeLabel(item: RightRailActivityItem) {
    return item.kind === 'event' && item.timeLabel ? item.timeLabel : formatCalendarTime(item.createdAt);
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

{#if compact}
  <div class="compact-rail-header">
    <h2>Activity, Events & Requests</h2>
    <button class="close-rail" type="button" on:click={requestClose}>Close</button>
  </div>
{/if}

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
            <button class="activity-open-button" type="button" on:click={() => handleOpenItem(item)}>
              <div class="activity-topline">
                <SubjectTablet kind={itemSurfaceKind(item)} projectMode={item.projectMode ?? 'productive'} />
                <span class="snapshot-time">{itemTimeLabel(item)}</span>
              </div>
              <span class="card-kicker">{itemKicker(item)}</span>
              <strong>{item.title}</strong>
              <span class="card-meta">{item.meta}</span>
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
            <button class="activity-open-button" type="button" on:click={() => handleOpenItem(item)}>
              <div class="activity-topline">
                <SubjectTablet kind={itemSurfaceKind(item)} projectMode={item.projectMode ?? 'collective-service'} />
                <span class="snapshot-time">{itemTimeLabel(item)}</span>
              </div>
              <span class="card-kicker">{itemKicker(item)}</span>
              <strong>{item.title}</strong>
              <span class="card-meta">{item.meta}</span>
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
              <span class="card-kicker">{itemKicker(item)}</span>
              <strong>{item.title}</strong>
              <span class="card-meta">{item.meta}</span>
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
  .compact-rail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .close-rail {
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

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

  .activity-open-button {
    display: grid;
    gap: 8px;
    width: 100%;
    padding: 0;
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