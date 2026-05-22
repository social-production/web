<script lang="ts">
  import type { VoteDirection } from '$lib/types/feed';
  import type { ScopeMemberSummary } from '$lib/types/scope';

  export let title = '';
  export let members: ScopeMemberSummary[] = [];
  export let mode: 'active' | 'candidate' = 'active';
  export let boardStatusLabel: (member: ScopeMemberSummary) => string = () => 'Recorded board seat';
  export let meetsConfidenceThreshold: (member: ScopeMemberSummary) => boolean = () => false;
  export let onVote: (member: ScopeMemberSummary, vote: VoteDirection) => void | Promise<void> = () => {};

  function rowTone(member: ScopeMemberSummary) {
    return mode === 'candidate' || !meetsConfidenceThreshold(member) ? 'warning' : 'healthy';
  }

  function requirementSummary(member: ScopeMemberSummary) {
    if (member.confidenceVotesRequired === undefined) {
      return `${member.confidenceReviewCount ?? 0}`;
    }

    return `${member.confidenceReviewCount ?? 0} / ${member.confidenceVotesRequired}`;
  }

  function requirementLabel(member: ScopeMemberSummary) {
    return mode === 'candidate' ? 'counted votes to join the board' : 'counted votes to keep standing';
  }

  function requirementNote(member: ScopeMemberSummary) {
    const notes: string[] = [];

    if (member.confidenceWeeklyActiveUserCount !== undefined) {
      notes.push(`${member.confidenceWeeklyActiveUserCount} weekly active users in scope`);
    }

    const standingLabel = boardStatusLabel(member);

    if (mode !== 'candidate' && standingLabel !== 'Standing confirmed') {
      notes.push(standingLabel);
    }

    return notes.length > 0 ? notes.join(' · ') : null;
  }

  function handleVote(member: ScopeMemberSummary, value: Exclude<VoteDirection, 0>) {
    void onVote(member, member.confidenceActiveVote === value ? 0 : value);
  }
</script>

{#if members.length > 0}
  <section class="member-section">
    <div class="section-label">{title}</div>

    {#each members as member}
      <div class={`person-row ${rowTone(member)}`}>
        <div class="person-copy">
          <a class="person-link" href={`/profile/${member.username}`}>
            <strong>{member.username}</strong>
          </a>

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
                  class="vote-pill"
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
              <span class="approval-pill">{member.confidenceRatio}% approval</span>
            {/if}
          </div>
        </div>

        <div class="confidence-requirement">
          <span class="requirement-value">{requirementSummary(member)}</span>
          <span class="requirement-copy">{requirementLabel(member)}</span>
          {#if requirementNote(member)}
            <span class="requirement-note">{requirementNote(member)}</span>
          {/if}
        </div>
      </div>
    {/each}
  </section>
{/if}

<style>
  .member-section,
  .person-copy,
  .confidence-requirement {
    display: grid;
    gap: 8px;
  }

  .section-label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-soft);
  }

  .person-row,
  .confidence-metrics,
  .vote-group {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .person-row {
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    justify-content: space-between;
    gap: 16px;
  }

  .person-row.healthy {
    border-color: color-mix(in srgb, var(--brand-soft) 32%, var(--panel-border));
  }

  .person-row.warning {
    border-color: color-mix(in srgb, var(--accent-warm) 38%, var(--panel-border));
    background: color-mix(in srgb, var(--accent-warm) 6%, var(--panel-soft));
  }

  .person-link {
    color: inherit;
    text-decoration: none;
  }

  strong {
    color: var(--text-main);
  }

  .person-copy {
    min-width: 0;
  }

  .vote-pill,
  .approval-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
    font-size: 12px;
    font-weight: 700;
  }

  button.vote-pill {
    transition: border-color 120ms ease, background-color 120ms ease;
  }

  button.vote-pill:hover {
    border-color: var(--brand);
    background: color-mix(in srgb, var(--brand-soft) 84%, var(--panel-strong));
  }

  .vote-arrow {
    color: var(--text-soft);
    font-size: 11px;
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
    color: var(--text-main);
  }

  .confidence-requirement {
    min-width: 170px;
    justify-items: end;
    text-align: right;
  }

  .requirement-value {
    color: var(--text-main);
    font-size: 14px;
    font-weight: 700;
  }

  .requirement-copy,
  .requirement-note {
    color: var(--text-soft);
    font-size: 11px;
    line-height: 1.4;
  }

  @media (max-width: 760px) {
    .person-row {
      align-items: stretch;
      flex-direction: column;
    }

    .confidence-requirement {
      min-width: 0;
      justify-items: start;
      text-align: left;
    }
  }
</style>