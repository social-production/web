<script lang="ts">
  import type { VoteDirection } from '$lib/types/feed';
  import type { ScopeMemberSummary } from '$lib/types/scope';

  export let title = '';
  export let members: ScopeMemberSummary[] = [];
  export let mode: 'active' | 'candidate' = 'active';
  export let sectionIndex = 0;
  export let boardStatusLabel: (member: ScopeMemberSummary) => string = () => 'Recorded board seat';
  export let meetsConfidenceThreshold: (member: ScopeMemberSummary) => boolean = () => false;
  export let onVote: (member: ScopeMemberSummary, vote: VoteDirection) => void | Promise<void> = () => {};

  function rowTone(member: ScopeMemberSummary) {
    return mode === 'candidate' || !meetsConfidenceThreshold(member) ? 'warning' : 'healthy';
  }

  function voteProgress(member: ScopeMemberSummary) {
    const cast = member.confidenceReviewCount ?? member.confidenceVoteCount ?? 0;
    const required = member.confidenceVotesRequired ?? 0;
    return `${cast} of ${required} votes needed`;
  }

  function approvalLine(member: ScopeMemberSummary) {
    const ratio = member.confidenceRatio !== undefined ? `${(member.confidenceRatio * 100).toFixed(0)}% approval` : null;
    const activeUsers =
      member.confidenceWeeklyActiveUserCount !== undefined
        ? `${member.confidenceWeeklyActiveUserCount} active users this week`
        : null;
    return [ratio, activeUsers].filter(Boolean).join(' · ');
  }

  function helperLine(member: ScopeMemberSummary) {
    const cast = member.confidenceReviewCount ?? member.confidenceVoteCount ?? 0;
    const required = member.confidenceVotesRequired ?? 0;
    const remaining = Math.max(0, required - cast);

    if (member.confidenceStandingState === 'grace') {
      return 'Grace period — more votes needed before standing drops';
    }

    if (member.confidenceStandingState === 'qualifying') {
      return remaining > 0 ? `Needs ${remaining} more vote${remaining === 1 ? '' : 's'} to become moderator` : 'Ready to become moderator';
    }

    if (member.confidenceStandingState === 'active') {
      return 'Standing confirmed';
    }

    if (mode === 'candidate') {
      return remaining > 0 ? `Needs ${remaining} more vote${remaining === 1 ? '' : 's'} to qualify` : boardStatusLabel(member);
    }

    return boardStatusLabel(member);
  }

  function handleVote(member: ScopeMemberSummary, value: Exclude<VoteDirection, 0>) {
    void onVote(member, member.confidenceActiveVote === value ? 0 : value);
  }
</script>

{#if members.length > 0}
  <section class="member-section" class:follows-section={sectionIndex > 0}>
    <div class="section-label">{title}</div>

    {#each members as member}
      <div class={`person-row ${rowTone(member)}`}>
        <div class="person-primary">
          <a class="person-link" href={`/profile/${member.username}`}>
            <strong>{member.username}</strong>
          </a>
          <span class="status-copy">{helperLine(member)}</span>
        </div>
        <div class="person-secondary">
          <span class="requirement-value">{voteProgress(member)}</span>
          {#if approvalLine(member)}
            <span class="requirement-copy">{approvalLine(member)}</span>
          {/if}
        </div>
        <div class="confidence-metrics">
          <div class="vote-group">
            {#if member.confidenceTargetId}
              <button
                aria-label={`Vote up for ${member.username}`}
                class="vote-pill"
                type="button"
                on:click={() => handleVote(member, 1)}
              >
                <span class:active-up={member.confidenceActiveVote === 1} class="vote-arrow">▲</span>
                <span class="vote-number">{member.confidenceUpVotes ?? 0}</span>
              </button>
              <button
                aria-label={`Vote down for ${member.username}`}
                class="vote-pill down-vote"
                type="button"
                on:click={() => handleVote(member, -1)}
              >
                <span class:active-down={member.confidenceActiveVote === -1} class="vote-arrow">▼</span>
                <span class="vote-number">{member.confidenceDownVotes ?? 0}</span>
              </button>
            {:else}
              <span class="vote-pill">
                <span class="vote-arrow">▲</span>
                <span class="vote-number">{member.confidenceUpVotes ?? 0}</span>
              </span>
              <span class="vote-pill">
                <span class="vote-arrow">▼</span>
                <span class="vote-number">{member.confidenceDownVotes ?? 0}</span>
              </span>
            {/if}
          </div>

          {#if member.confidenceRatio !== undefined}
            <span class="approval-pill">{(member.confidenceRatio * 100).toFixed(0)}%</span>
          {/if}
        </div>
      </div>
    {/each}
  </section>
{/if}

<style>
  .member-section {
    display: grid;
    gap: 0;
    min-width: 0;
  }

  .member-section.follows-section .section-label {
    border-top: 1px solid var(--panel-border);
    margin-top: 4px;
    padding-top: 12px;
  }

  .section-label {
    padding: 8px 0 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-soft);
  }

  .person-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: nowrap;
    padding: 10px 0;
    border-bottom: 1px solid var(--panel-border);
    min-width: 0;
  }

  .person-primary {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1 1 auto;
  }

  .person-secondary {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 0 1 auto;
  }

  .person-row:last-child {
    border-bottom: none;
  }

  .person-row.warning {
    box-shadow: inset 2px 0 0 color-mix(in srgb, var(--accent-warm) 70%, transparent);
    padding-left: 8px;
  }

  .person-row.healthy {
    box-shadow: inset 2px 0 0 color-mix(in srgb, var(--brand) 55%, transparent);
    padding-left: 8px;
  }

  .person-link {
    color: inherit;
    text-decoration: none;
    flex: 0 1 auto;
    min-width: 0;
    white-space: nowrap;
  }

  strong {
    color: var(--text-main);
    font-size: 13px;
  }

  .status-copy {
    color: var(--text-soft);
    font-size: 11px;
    line-height: 1.35;
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .confidence-metrics,
  .vote-group {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: nowrap;
    flex: 0 0 auto;
    margin-left: auto;
  }

  .vote-pill,
  .approval-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: transparent;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
  }

  button.vote-pill {
    transition: border-color 120ms ease, background-color 120ms ease;
  }

  button.vote-pill:hover {
    border-color: var(--brand);
    background: color-mix(in srgb, var(--brand-soft) 50%, transparent);
  }

  button.vote-pill.down-vote:hover {
    border-color: var(--accent-warm);
    background: color-mix(in srgb, var(--accent-warm) 12%, transparent);
  }

  .vote-arrow {
    color: var(--text-soft);
    font-size: 10px;
    line-height: 1;
  }

  .vote-number {
    color: var(--text-main);
  }

  .active-up {
    color: var(--brand);
  }

  .active-down {
    color: var(--accent-warm);
  }

  .approval-pill {
    color: var(--text-soft);
  }

  .requirement-value {
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
    flex: 0 1 auto;
    white-space: nowrap;
  }

  .requirement-copy {
    color: var(--text-soft);
    font-size: 11px;
    line-height: 1.35;
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 640px) {
    .person-row {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-rows: auto auto;
      gap: 8px 10px;
      align-items: center;
    }

    .person-primary {
      grid-column: 1 / -1;
      flex: initial;
    }

    .person-secondary {
      grid-column: 1;
      flex: initial;
      min-width: 0;
    }

    .confidence-metrics {
      grid-column: 2;
      grid-row: 2;
      margin-left: 0;
      justify-self: end;
    }

    .requirement-copy {
      display: none;
    }
  }
</style>
