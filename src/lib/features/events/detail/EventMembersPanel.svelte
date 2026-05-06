<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import { toggleEventManagerNomination } from '$lib/services/queries/details';
  import { setVote } from '$lib/services/queries/feeds';
  import type { EventPageData, EventRoleMember } from '$lib/types/detail';
  import type { VoteDirection } from '$lib/types/feed';

  export let data: EventPageData;

  let managerTogglePending = false;

  function meetsConfidenceThreshold(member: EventRoleMember) {
    return !!member.confidenceReviewCount && (member.confidenceRatio ?? 0) >= 70;
  }

  async function handleManagerConfidenceVote(
    member: EventRoleMember,
    event: CustomEvent<{ vote: VoteDirection }>
  ) {
    if (!member.confidenceTargetId) {
      return;
    }

    await setVote(member.confidenceTargetId, event.detail.vote);
    await invalidateAll();
  }

  async function handleManagerNominationToggle() {
    managerTogglePending = true;

    try {
      await toggleEventManagerNomination(data.slug);
      await invalidateAll();
    } finally {
      managerTogglePending = false;
    }
  }

  $: managerToggleLabel = !data.viewerCanToggleManagerNomination
    ? 'Only public event members can become event managers'
    : data.viewerIsEventManager
      ? 'Step back from event manager'
      : data.viewerIsManagerCandidate
        ? 'Withdraw manager request'
        : 'Become event manager';
</script>

<section class="members-panel">
  <div class="members-header">
    <div class="section-header compact-header">
      <h2>Event managers</h2>
      <p>People going to the event can become event managers. Manager requests use the same 70% confidence rule as the rest of the platform.</p>
    </div>
    <button
      class="secondary-button"
      disabled={!data.viewerCanToggleManagerNomination || managerTogglePending}
      type="button"
      on:click={handleManagerNominationToggle}
    >
      {managerToggleLabel}
    </button>
  </div>

  <div class="members-scroll-shell">
    <div class="stack">
      {#if data.eventManagers.length === 0}
        <div class="empty-card">
          <p>No one has cleared the 70% manager confidence threshold yet.</p>
        </div>
      {:else}
        {#each data.eventManagers as member}
          <div class="person-row confidence-row">
            <div class="person-copy">
              <a class="person-link" href={`/profile/${member.username}`}>
                <strong>{member.username}</strong>
              </a>
              <div class="confidence-summary">
                <span class:healthy={meetsConfidenceThreshold(member)} class:warning={!meetsConfidenceThreshold(member)}>
                  {member.confidenceRatio}% confidence
                </span>
                <span>{member.confidenceReviewCount} reviews</span>
              </div>
            </div>

            {#if member.confidenceTargetId}
              <VoteStrip
                activeVote={member.confidenceActiveVote ?? 0}
                count={member.confidenceVoteCount ?? 0}
                on:vote={(event) => handleManagerConfidenceVote(member, event)}
              />
            {/if}
          </div>
        {/each}
      {/if}
    </div>

    <div class="members-divider"></div>

    <div class="section-header compact-header">
      <h2>Other members</h2>
      <p>Everyone else going to the event stays listed here. Manager requests keep their confidence vote visible until they cross the 70% threshold.</p>
    </div>

    <div class="stack">
      {#if data.members.length === 0}
        <div class="empty-card">
          <p>No additional members listed yet.</p>
        </div>
      {:else}
        {#each data.members as member}
          <div class="person-row confidence-row">
            <div class="person-copy">
              <a class="person-link" href={`/profile/${member.username}`}>
                <strong>{member.username}</strong>
              </a>

              {#if member.isManagerCandidate}
                <div class="confidence-summary">
                  <span class="warning">
                    Manager request
                    {#if member.confidenceReviewCount}
                      · {member.confidenceRatio}% confidence
                    {:else}
                      · awaiting reviews
                    {/if}
                  </span>
                  {#if member.confidenceReviewCount}
                    <span>{member.confidenceReviewCount} reviews</span>
                  {/if}
                </div>
              {/if}
            </div>

            {#if member.confidenceTargetId}
              <VoteStrip
                activeVote={member.confidenceActiveVote ?? 0}
                count={member.confidenceVoteCount ?? 0}
                on:vote={(event) => handleManagerConfidenceVote(member, event)}
              />
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </div>
</section>

<style>
  .members-panel,
  .members-scroll-shell,
  .stack,
  .section-header,
  .person-copy {
    display: grid;
    gap: 14px;
  }

  .members-header,
  .confidence-row,
  .confidence-summary {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .members-header,
  .confidence-row {
    justify-content: space-between;
  }

  .members-panel {
    padding: 22px 0 26px;
    margin-bottom: 26px;
    border-bottom: 1px solid var(--panel-border);
  }

  .members-scroll-shell {
    max-height: 420px;
    overflow-y: auto;
    padding-right: 6px;
    scrollbar-gutter: stable;
  }

  .person-row,
  .empty-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  h2,
  strong {
    font-size: 14px;
    color: var(--text-main);
  }

  p,
  span {
    color: var(--text-soft);
    line-height: 1.45;
  }

  .person-link {
    color: var(--text-main);
    font-weight: 700;
  }

  .confidence-summary {
    font-size: 12px;
    line-height: 1.4;
  }

  .confidence-summary .healthy {
    color: var(--brand-strong);
  }

  .confidence-summary .warning {
    color: var(--accent-warm-strong);
  }

  .secondary-button {
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .secondary-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .members-divider {
    padding-top: 12px;
    border-top: 1px solid var(--panel-border);
  }

  @media (max-width: 760px) {
    .members-header {
      align-items: stretch;
    }
  }
</style>