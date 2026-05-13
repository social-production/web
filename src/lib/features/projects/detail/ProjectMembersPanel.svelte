<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import { toggleProjectManagerNomination } from '$lib/services/queries/details';
  import { setVote } from '$lib/services/queries/feeds';
  import type { ProjectPageData, ProjectRoleMember } from '$lib/types/detail';
  import type { VoteDirection } from '$lib/types/feed';

  export let data: ProjectPageData;

  let managerTogglePending = false;
  let showRoleRules = false;

  function meetsConfidenceThreshold(member: ProjectRoleMember) {
    return !!member.confidenceReviewCount && (member.confidenceRatio ?? 0) >= 70;
  }

  function roleStatusLabel(member: ProjectRoleMember) {
    if (member.isManagerCandidate) {
      return meetsConfidenceThreshold(member) ? 'Candidate at threshold' : 'Candidate below threshold';
    }

    if (member.confidenceReviewCount && !meetsConfidenceThreshold(member)) {
      return 'Under review';
    }

    return 'Project manager';
  }

  async function handleManagerConfidenceVote(
    member: ProjectRoleMember,
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
      await toggleProjectManagerNomination(data.slug);
      await invalidateAll();
    } finally {
      managerTogglePending = false;
    }
  }

  $: managerToggleLabel = !data.viewerCanToggleManagerNomination
    ? 'Only project members can become project managers'
    : data.viewerIsProjectManager
      ? 'Step back from project manager'
      : data.viewerIsManagerCandidate
        ? 'Withdraw manager request'
        : 'Become project manager';
</script>

<section class="members-panel">
  <div class="members-header">
    <div class="section-header compact-header">
      <h2>Project managers</h2>
      <p>Project managers coordinate activities and phase-change requests. Members enter the role through visible confidence voting.</p>
    </div>
    <div class="header-actions">
      <button class:active={showRoleRules} class="secondary-button" type="button" on:click={() => (showRoleRules = !showRoleRules)}>
        {showRoleRules ? 'Hide role rules' : 'How it works'}
      </button>
      <button
        class="secondary-button"
        disabled={!data.viewerCanToggleManagerNomination || managerTogglePending}
        type="button"
        on:click={handleManagerNominationToggle}
      >
        {managerToggleLabel}
      </button>
    </div>
  </div>

  {#if showRoleRules}
    <div class="rules-card">
      <h3>How project manager roles work</h3>
      <ul>
        <li>Any project member can nominate themselves for project manager.</li>
        <li>Members vote confidence on the nomination using the same visible vote strip shown here.</li>
        <li>A candidate clears into the role once confidence reaches 70% with visible reviews.</li>
        <li>Managers who fall below 70% stay visible as under review until the group renews or removes the role.</li>
      </ul>
    </div>
  {/if}

  <div class="members-scroll-shell">
    <div class="stack">
      {#if data.projectManagers.length === 0}
        <div class="empty-card">
          <p>No one has cleared the 70% manager confidence threshold yet.</p>
        </div>
      {:else}
        {#each data.projectManagers as member}
          <div class="person-row confidence-row">
            <div class="person-copy">
              <a class="person-link" href={`/profile/${member.username}`}>
                <strong>{member.username}</strong>
              </a>
              <div class="confidence-summary">
                <span class={`status-chip ${meetsConfidenceThreshold(member) ? 'healthy' : 'warning'}`}>
                  {roleStatusLabel(member)}
                </span>
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
      <p>Everyone else stays listed here. Manager requests keep their confidence vote visible until they cross the 70% threshold.</p>
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
                  <span class={`status-chip ${meetsConfidenceThreshold(member) ? 'healthy' : 'warning'}`}>
                    {roleStatusLabel(member)}
                  </span>
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
  .confidence-summary,
  .header-actions {
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
  .empty-card,
  .rules-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  h2,
  h3,
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

  .status-chip {
    padding: 4px 8px;
    border-radius: 999px;
    border: 1px solid var(--panel-border);
    font-size: 10px;
    font-weight: 700;
  }

  .status-chip.healthy {
    background: color-mix(in srgb, var(--brand-soft) 75%, var(--panel));
    color: var(--brand-strong);
  }

  .status-chip.warning {
    background: color-mix(in srgb, var(--accent-warm) 18%, var(--panel));
    color: var(--accent-warm-strong);
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

  ul {
    margin: 0;
    padding-left: 18px;
    color: var(--text-soft);
    line-height: 1.5;
  }

  @media (max-width: 760px) {
    .members-header {
      align-items: stretch;
    }
  }
</style>
