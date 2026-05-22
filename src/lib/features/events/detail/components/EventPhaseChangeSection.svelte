<script lang="ts">
  import { tick } from 'svelte';
  import CountBadge from '$lib/components/shared/CountBadge.svelte';
  import VoteCardFooter from '$lib/components/shared/VoteCardFooter.svelte';
  import {
    formatProjectVoteRequirement,
    formatProjectVoteSummary
  } from '$lib/utils/projectVotes';
  import type {
    EventLifecyclePhaseChangeRequest,
    EventLifecyclePhaseId,
    EventPageData,
    ProjectApprovalVote
  } from '$lib/types/detail';

  export let data: EventPageData;
  export let activePhaseId: EventLifecyclePhaseId;
  export let canAdvanceCurrentPhase = false;
  export let phaseChangeReason = '';
  export let requestPhaseChange: (
    targetPhaseId: EventLifecyclePhaseId,
    reason: string
  ) => void | Promise<void> = () => {};
  export let voteOnPhaseChange: (
    requestId: string,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};

  let showNextPhaseComposer = false;
  let showRevertComposer = false;
  let nextPhaseReason = '';
  let revertReason = '';
  let revertTargetPhaseId: EventLifecyclePhaseId = 'event-plan';
  let expandedVoteGroup: 'return' | 'advance' | 'close' | null = null;
  let nextPhaseComposerElement: HTMLDivElement | null = null;
  let revertComposerElement: HTMLDivElement | null = null;

  $: currentPhaseVisible = activePhaseId === data.lifecycle.currentPhaseId;
  $: returnRequests = data.lifecycle.phaseChangeRequests.filter((request) => request.kind === 'return');
  $: nextVoteKind = (data.lifecycle.nextPhaseId === 'closed' ? 'close' : 'advance') as 'advance' | 'close';
  $: nextActionRequests = data.lifecycle.phaseChangeRequests.filter(
    (request) => request.kind === nextVoteKind
  );
  $: showReturnActions = data.lifecycle.revertablePhaseIds.length > 0 || returnRequests.length > 0;
  $: showNextActions = !!data.lifecycle.nextPhaseId || nextActionRequests.length > 0;

  $: if (!data.lifecycle.revertablePhaseIds.includes(revertTargetPhaseId)) {
    revertTargetPhaseId = data.lifecycle.revertablePhaseIds[0] ?? 'event-plan';
  }

  $: if (!currentPhaseVisible) {
    showNextPhaseComposer = false;
    showRevertComposer = false;
    expandedVoteGroup = null;
  }

  function requestKindLabel(request: EventLifecyclePhaseChangeRequest) {
    switch (request.kind) {
      case 'close':
        return 'Close decision';
      case 'return':
        return 'Return decision';
      default:
        return 'Advance decision';
    }
  }

  function nextPhaseActionLabel() {
    if (!data.lifecycle.nextPhaseId) {
      return null;
    }

    return data.lifecycle.nextPhaseId === 'closed' ? 'Close' : 'Advance';
  }

  function nextPhasePlaceholder() {
    return data.lifecycle.nextPhaseId === 'closed'
      ? 'State why the event should close or what record should stay visible.'
      : 'State why this event should move forward now.';
  }

  function revertPhasePlaceholder() {
    return revertTargetPhaseId === 'proposal'
      ? 'State clearly why the event should return to proposal.'
      : revertTargetPhaseId === 'event-plan'
        ? 'State clearly why the event should return to planning.'
        : 'State clearly why the event should return to the selected phase.';
  }

  function revertTargetLabel(phaseId: EventLifecyclePhaseId) {
    switch (phaseId) {
      case 'proposal':
        return 'Proposal';
      case 'event-plan':
        return 'Event Plan';
      case 'activity':
        return 'Activity';
      default:
        return 'Closed';
    }
  }

  function closeNextPhaseComposer() {
    showNextPhaseComposer = false;
    nextPhaseReason = '';
    phaseChangeReason = '';
  }

  function closeRevertComposer() {
    showRevertComposer = false;
    revertReason = '';
  }

  function scrollComposerIntoView(element: HTMLElement | null) {
    if (typeof window === 'undefined' || !element) {
      return;
    }

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  async function toggleNextPhaseComposer() {
    const willOpen = !showNextPhaseComposer;

    if (!willOpen) {
      closeNextPhaseComposer();
      expandedVoteGroup = null;
      return;
    }

    showNextPhaseComposer = true;
    closeRevertComposer();
    expandedVoteGroup = null;
    await tick();
    scrollComposerIntoView(nextPhaseComposerElement);

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        scrollComposerIntoView(nextPhaseComposerElement);
      });
    }
  }

  async function toggleRevertComposer() {
    const willOpen = !showRevertComposer;

    if (!willOpen) {
      closeRevertComposer();
      expandedVoteGroup = null;
      return;
    }

    showRevertComposer = true;
    closeNextPhaseComposer();
    expandedVoteGroup = null;
    await tick();
    scrollComposerIntoView(revertComposerElement);

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        scrollComposerIntoView(revertComposerElement);
      });
    }
  }

  function toggleVoteGroup(kind: 'return' | 'advance' | 'close') {
    expandedVoteGroup = expandedVoteGroup === kind ? null : kind;
    closeNextPhaseComposer();
    closeRevertComposer();
  }

  async function submitNextPhaseRequest() {
    if (!data.lifecycle.nextPhaseId || !nextPhaseReason.trim() || !canAdvanceCurrentPhase) {
      return;
    }

    phaseChangeReason = nextPhaseReason;
    await requestPhaseChange(data.lifecycle.nextPhaseId, nextPhaseReason);
    closeNextPhaseComposer();
  }

  async function submitRevertRequest() {
    if (!data.lifecycle.revertablePhaseIds.length || !revertReason.trim()) {
      return;
    }

    phaseChangeReason = revertReason;
    await requestPhaseChange(revertTargetPhaseId, revertReason);
    closeRevertComposer();
  }
</script>

{#if currentPhaseVisible && (data.lifecycle.phaseChangeRequests.length > 0 || data.lifecycle.viewerCanRequestPhaseChanges)}
  <div class="phase-change-stack">
    {#if showReturnActions || showNextActions}
      <div class="change-action-row">
        <div class="action-group action-group-left">
          {#if data.lifecycle.viewerCanRequestPhaseChanges && data.lifecycle.revertablePhaseIds.length > 0}
            <button
              class:active-toggle={showRevertComposer}
              class="secondary-button action-button"
              type="button"
              on:click={toggleRevertComposer}
            >
              Return
            </button>
          {/if}
          {#if returnRequests.length > 0}
            <button class="vote-chip notice-chip" type="button" on:click={() => toggleVoteGroup('return')}>
              Vote Active
              <CountBadge count={returnRequests.length} />
            </button>
          {/if}
        </div>

        <div class="action-group action-group-right">
          {#if nextActionRequests.length > 0}
            <button class="vote-chip notice-chip" type="button" on:click={() => toggleVoteGroup(nextVoteKind)}>
              Vote Active
              <CountBadge count={nextActionRequests.length} />
            </button>
          {/if}
          {#if data.lifecycle.viewerCanRequestPhaseChanges && data.lifecycle.nextPhaseId}
            <button
              class:active-toggle={showNextPhaseComposer}
              class="secondary-button action-button"
              type="button"
              on:click={toggleNextPhaseComposer}
            >
              {nextPhaseActionLabel()}
            </button>
          {/if}
        </div>
      </div>
    {/if}

    {#if showRevertComposer && data.lifecycle.revertablePhaseIds.length > 0}
      <div bind:this={revertComposerElement} class="mechanics-card change-action-panel">
        <div class="composer-card">
          <h3>Return</h3>
          <label>
            <span class="field-inline-label">Return to</span>
            <select bind:value={revertTargetPhaseId}>
              {#each data.lifecycle.revertablePhaseIds as phaseId}
                <option value={phaseId}>{revertTargetLabel(phaseId)}</option>
              {/each}
            </select>
          </label>
          <label>
            <span class="field-inline-label">Reason</span>
            <textarea bind:value={revertReason} rows="3" placeholder={revertPhasePlaceholder()}></textarea>
          </label>
          <div class="composer-actions">
            <button class="secondary-button" type="button" on:click={closeRevertComposer}>Cancel</button>
            <button class="primary-button" disabled={!revertReason.trim()} type="button" on:click={submitRevertRequest}>
              Return
            </button>
          </div>
        </div>
      </div>
    {/if}

    {#if showNextPhaseComposer && data.lifecycle.nextPhaseId}
      <div bind:this={nextPhaseComposerElement} class="mechanics-card change-action-panel">
        <div class="composer-card">
          <h3>{nextPhaseActionLabel()}</h3>
          <label>
            <span class="field-inline-label">Reason</span>
            <textarea bind:value={nextPhaseReason} rows="3" placeholder={nextPhasePlaceholder()}></textarea>
          </label>
          {#if !canAdvanceCurrentPhase}
            <div class="inline-note">
              {#if data.lifecycle.currentPhaseId === 'proposal'}
                Proposal advancement is still locked until demand is above the required threshold.
              {:else if data.lifecycle.currentPhaseId === 'event-plan'}
                Planning cannot advance until a plan clears quorum and approval.
              {/if}
            </div>
          {/if}
          <div class="composer-actions">
            <button class="secondary-button" type="button" on:click={closeNextPhaseComposer}>Cancel</button>
            <button
              class="primary-button"
              disabled={!nextPhaseReason.trim() || !canAdvanceCurrentPhase}
              type="button"
              on:click={submitNextPhaseRequest}
            >
              {nextPhaseActionLabel()}
            </button>
          </div>
        </div>
      </div>
    {/if}

    {#if expandedVoteGroup === 'return' && returnRequests.length > 0}
      <div class="surface-stack">
        {#each returnRequests as request (request.id)}
          <article class="surface-card vote-request-card">
            <div class="vote-card-top">
              <div class="vote-card-copy">
                <span class="vote-kicker">{requestKindLabel(request)}</span>
                <strong>{request.targetPhaseLabel}</strong>
              </div>
              <span class="vote-requirement">
                {formatProjectVoteRequirement(request.voteSummary, request.approvalThresholdPercent)}
              </span>
            </div>

            <p>{request.reason}</p>

            <div class="vote-summary-row">
              <span>{formatProjectVoteSummary(request.voteSummary)}</span>
            </div>

            <VoteCardFooter
              authorUsername={request.authorUsername}
              createdAt={request.createdAt}
              activeVote={request.voteSummary.activeVote}
              canVote={data.lifecycle.viewerCanVoteOnPhaseChanges}
              onVote={(vote) => voteOnPhaseChange(request.id, vote)}
            />
          </article>
        {/each}
      </div>
    {/if}

    {#if expandedVoteGroup === nextVoteKind && nextActionRequests.length > 0}
      <div class="surface-stack">
        {#each nextActionRequests as request (request.id)}
          <article class="surface-card vote-request-card">
            <div class="vote-card-top">
              <div class="vote-card-copy">
                <span class="vote-kicker">{requestKindLabel(request)}</span>
                <strong>{request.targetPhaseLabel}</strong>
              </div>
              <span class="vote-requirement">
                {formatProjectVoteRequirement(request.voteSummary, request.approvalThresholdPercent)}
              </span>
            </div>

            <p>{request.reason}</p>

            <div class="vote-summary-row">
              <span>{formatProjectVoteSummary(request.voteSummary)}</span>
            </div>

            <VoteCardFooter
              authorUsername={request.authorUsername}
              createdAt={request.createdAt}
              activeVote={request.voteSummary.activeVote}
              canVote={data.lifecycle.viewerCanVoteOnPhaseChanges}
              onVote={(vote) => voteOnPhaseChange(request.id, vote)}
            />
          </article>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .phase-change-stack,
  .change-action-panel,
  .composer-card,
  .surface-stack,
  .vote-request-card,
  .vote-card-copy {
    display: grid;
    gap: 12px;
  }

  .change-action-row {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: center;
  }

  .action-group,
  .composer-actions,
  .vote-summary-row,
  .vote-card-top {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .vote-card-top {
    justify-content: space-between;
  }

  .action-group-left {
    justify-content: flex-start;
  }

  .action-group-right {
    justify-content: flex-end;
  }

  .action-button {
    width: auto;
  }

  .change-action-panel {
    scroll-margin-top: 92px;
  }

  .mechanics-card,
  .composer-card,
  .surface-card,
  .vote-request-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .vote-request-card {
    border-color: color-mix(in srgb, var(--brand) 16%, var(--panel-border));
    background: color-mix(in srgb, var(--panel) 82%, var(--panel-strong));
  }

  .primary-button,
  .secondary-button,
  .vote-chip {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
  }

  .primary-button {
    background: var(--brand);
    color: var(--page-bg);
  }

  .secondary-button,
  .vote-chip {
    border: 1px solid var(--panel-border);
    background: var(--panel-strong);
    color: var(--text-soft);
  }

  .secondary-button.active-toggle {
    border-color: color-mix(in srgb, var(--brand-strong) 62%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 46%, var(--panel-strong));
    color: var(--brand-strong);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 24%, transparent);
  }

  .notice-chip {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    border-color: color-mix(in srgb, var(--brand) 45%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 72%, var(--panel));
    color: var(--text-main);
  }

  strong,
  h3,
  .field-inline-label,
  .vote-requirement {
    color: var(--text-main);
  }

  p,
  span,
  .vote-kicker,
  .inline-note {
    color: var(--text-soft);
  }

  .vote-kicker {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .vote-requirement {
    font-size: 12px;
    font-weight: 700;
  }

  select,
  textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-main);
  }

  textarea {
    min-height: 110px;
    resize: vertical;
  }

  .field-inline-label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 700;
  }

  h3,
  p {
    margin: 0;
  }

  @media (max-width: 760px) {
    .change-action-row {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>