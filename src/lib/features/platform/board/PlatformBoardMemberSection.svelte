<script lang="ts">
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import { GOVERNANCE_APPROVAL_THRESHOLD_PERCENT } from '$lib/services/governance/rules';
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
    const required = `${GOVERNANCE_APPROVAL_THRESHOLD_PERCENT}% required`;
    const activeUsers =
      member.confidenceWeeklyActiveUserCount !== undefined
        ? `${member.confidenceWeeklyActiveUserCount} active users this week`
        : null;
    return [required, activeUsers].filter(Boolean).join(' · ');
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
        <a class="person-avatar" href={`/profile/${member.username}`}>
          <AvatarBadge size="sm" username={member.username} imageUrl={member.profileImageUrl ?? null} />
        </a>

        <div class="person-body">
          <a class="person-name" href={`/profile/${member.username}`}>
            <strong>{member.username}</strong>
          </a>
          <p class="status-copy">{helperLine(member)}</p>
          <div class="person-footer">
            <div class="person-meta">
              <span class="requirement-value">{voteProgress(member)}</span>
              {#if approvalLine(member)}
                <span class="requirement-copy">{approvalLine(member)}</span>
              {/if}
            </div>
            <div class="vote-strip" title={`${member.confidenceUpVotes ?? 0} support · ${member.confidenceDownVotes ?? 0} oppose`}>
              {#if member.confidenceTargetId}
                <button
                  aria-label={`Support · ${member.confidenceUpVotes ?? 0}`}
                  aria-pressed={member.confidenceActiveVote === 1}
                  class:active-support={member.confidenceActiveVote === 1}
                  class="vote-button"
                  type="button"
                  on:click={() => handleVote(member, 1)}
                >
                  ▲
                </button>
              {:else}
                <span aria-hidden="true" class="vote-button">▲</span>
              {/if}
              <span class="signal-percent">
                {member.confidenceRatio !== undefined ? `${(member.confidenceRatio * 100).toFixed(0)}%` : '—'}
              </span>
              {#if member.confidenceTargetId}
                <button
                  aria-label={`Oppose · ${member.confidenceDownVotes ?? 0}`}
                  aria-pressed={member.confidenceActiveVote === -1}
                  class:active-oppose={member.confidenceActiveVote === -1}
                  class="vote-button"
                  type="button"
                  on:click={() => handleVote(member, -1)}
                >
                  ▼
                </button>
              {:else}
                <span aria-hidden="true" class="vote-button">▼</span>
              {/if}
            </div>
          </div>
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
    border-top: 1px solid color-mix(in srgb, var(--panel-border) 75%, transparent);
    margin-top: 4px;
    padding-top: 12px;
  }

  .section-label {
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-soft);
  }

  .person-row {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 10px;
    align-items: start;
    padding: 10px 16px;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 75%, transparent);
    min-width: 0;
  }

  .person-row:hover {
    background: color-mix(in srgb, var(--panel-hover) 70%, transparent);
  }

  .person-row:last-child {
    border-bottom: none;
  }

  .person-row.warning {
    box-shadow: inset 2px 0 0 color-mix(in srgb, var(--accent-warm) 70%, transparent);
  }

  .person-row.healthy {
    box-shadow: inset 2px 0 0 color-mix(in srgb, var(--brand) 55%, transparent);
  }

  .person-avatar {
    display: inline-flex;
    padding-top: 2px;
    color: inherit;
    text-decoration: none;
  }

  .person-body {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .person-name {
    min-width: 0;
    color: inherit;
    text-decoration: none;
  }

  .person-name strong {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-main);
    font-size: 13px;
  }

  .status-copy {
    margin: 0;
    color: var(--text-soft);
    font-size: 11px;
    line-height: 1.35;
  }

  .person-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }

  .person-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 10px;
    align-items: baseline;
    min-width: 0;
    flex: 1 1 140px;
  }

  .vote-strip {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
    min-height: 32px;
    padding: 4px 6px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    flex: 0 0 auto;
  }

  .vote-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--text-soft);
    font-size: 11px;
    line-height: 1;
    border-radius: 999px;
  }

  button.vote-button:hover {
    background: color-mix(in srgb, var(--brand-soft) 88%, transparent);
    color: var(--brand-strong);
  }

  .signal-percent {
    min-width: 28px;
    text-align: center;
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
  }

  .active-support {
    color: #22c55e;
  }

  .active-oppose {
    color: #ef4444;
  }

  .requirement-value {
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
  }

  .requirement-copy {
    color: var(--text-soft);
    font-size: 11px;
    line-height: 1.35;
  }

  @media (max-width: 640px) {
    .vote-strip {
      gap: 4px;
      min-height: 24px;
      padding: 2px 4px;
    }

    .vote-button {
      width: 20px;
      height: 20px;
      font-size: 10px;
    }

    .signal-percent {
      min-width: 22px;
      font-size: 10px;
    }
  }
</style>
