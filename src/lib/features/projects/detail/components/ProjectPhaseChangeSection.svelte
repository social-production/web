<script lang="ts">
  import CountBadge from '$lib/components/shared/CountBadge.svelte';
  import VoteCardFooter from '$lib/components/shared/VoteCardFooter.svelte';
  import {
    isCollectiveServiceProject,
    isPersonalServiceProject
  } from '$lib/features/projects/projectMode';
  import {
    formatProjectVoteRequirement,
    formatProjectVoteSummary
  } from '$lib/utils/projectVotes';
  import type {
    ProjectApprovalVote,
    ProjectLifecyclePhaseChangeRequest,
    ProjectLifecyclePhaseId,
    ProjectPageData
  } from '$lib/types/detail';

  export let data: ProjectPageData;
  export let activePhaseId: ProjectLifecyclePhaseId;
  export let requestPhaseChange: (
    targetPhaseId: ProjectLifecyclePhaseId,
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
  let revertTargetPhaseId: Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'> = 'phase-2';
  let expandedVoteGroup: 'return' | 'advance' | 'close' | null = null;

  $: currentPhaseVisible = activePhaseId === data.lifecycle.currentPhaseId;
  $: returnRequests = data.lifecycle.phaseChangeRequests.filter((request) => request.kind === 'return');
  $: nextVoteKind = (isClosingTransition() ? 'close' : 'advance') as 'close' | 'advance';
  $: nextActionRequests = data.lifecycle.phaseChangeRequests.filter(
    (request) => request.kind === nextVoteKind
  );
  $: showReturnActions = data.lifecycle.revertablePhaseIds.length > 0 || returnRequests.length > 0;
  $: showNextActions = !!data.lifecycle.nextPhaseId || nextActionRequests.length > 0;

  $: if (!data.lifecycle.revertablePhaseIds.includes(revertTargetPhaseId)) {
    revertTargetPhaseId = data.lifecycle.revertablePhaseIds[0] ?? 'phase-2';
  }

  $: if (!currentPhaseVisible) {
    showNextPhaseComposer = false;
    showRevertComposer = false;
    expandedVoteGroup = null;
  }

  function closePhaseId() {
    return isPersonalServiceProject(data.projectMode) ? 'phase-2' : 'phase-6';
  }

  function isClosingTransition() {
    return data.lifecycle.nextPhaseId === closePhaseId();
  }

  function revertTargetLabel(phaseId: Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>) {
    if (phaseId === 'phase-2') {
      return isCollectiveServiceProject(data.projectMode)
        ? 'Phase 2 / Operations Plan'
        : 'Phase 2 / Production Plan';
    }

    return isCollectiveServiceProject(data.projectMode)
      ? 'Phase 3 / Access Plan'
      : 'Phase 3 / Distribution Plan';
  }

  function nextPhaseActionLabel() {
    if (!data.lifecycle.nextPhaseId || !data.lifecycle.nextPhaseLabel) {
      return null;
    }

    if (isClosingTransition()) {
      return 'Request close';
    }

    return 'Request advance';
  }

  function nextPhasePlaceholder() {
    return isClosingTransition()
      ? 'State why the project should close or where the work continues next.'
      : 'State why this phase change should happen now.';
  }

  function requestKindLabel(request: ProjectLifecyclePhaseChangeRequest) {
    switch (request.kind) {
      case 'close':
        return 'Close request';
      case 'return':
        return 'Return request';
      default:
        return 'Advance request';
    }
  }

  async function submitNextPhaseRequest() {
    if (!data.lifecycle.nextPhaseId || !nextPhaseReason.trim()) {
      return;
    }

    await requestPhaseChange(data.lifecycle.nextPhaseId, nextPhaseReason);
    nextPhaseReason = '';
    showNextPhaseComposer = false;
  }

  async function submitRevertRequest() {
    if (!revertReason.trim()) {
      return;
    }

    await requestPhaseChange(revertTargetPhaseId, revertReason);
    revertReason = '';
    showRevertComposer = false;
  }

  function toggleNextPhaseComposer() {
    showNextPhaseComposer = !showNextPhaseComposer;
    expandedVoteGroup = null;

    if (showNextPhaseComposer) {
      showRevertComposer = false;
    }
  }

  function toggleRevertComposer() {
    showRevertComposer = !showRevertComposer;
    expandedVoteGroup = null;

    if (showRevertComposer) {
      showNextPhaseComposer = false;
    }
  }

  function toggleVoteGroup(kind: 'return' | 'advance' | 'close') {
    expandedVoteGroup = expandedVoteGroup === kind ? null : kind;
    showNextPhaseComposer = false;
    showRevertComposer = false;
  }
</script>

{#if currentPhaseVisible && (data.lifecycle.phaseChangeRequests.length > 0 || data.lifecycle.viewerCanRequestPhaseChanges)}
  <div class="phase-change-stack">
    {#if showReturnActions || showNextActions}
      <div class="change-action-row">
        <div class="action-group action-group-left">
          {#if data.lifecycle.viewerCanRequestPhaseChanges && data.lifecycle.revertablePhaseIds.length > 0}
            <button class="secondary-button action-button" type="button" on:click={toggleRevertComposer}>
              Request return
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
            <button class="secondary-button action-button" type="button" on:click={toggleNextPhaseComposer}>
              {nextPhaseActionLabel()}
            </button>
          {/if}
        </div>
      </div>
    {/if}

    {#if showRevertComposer && data.lifecycle.viewerCanRequestPhaseChanges && data.lifecycle.revertablePhaseIds.length > 0}
      <div class="mechanics-card change-action-panel">
        <div class="composer-card">
          <h3>Request return</h3>
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
            <textarea bind:value={revertReason} rows="3" placeholder="State clearly why the project should return to an earlier planning phase."></textarea>
          </label>
          <div class="composer-actions">
            <button class="primary-button" type="button" on:click={submitRevertRequest}>Submit request</button>
          </div>
        </div>
      </div>
    {/if}

    {#if showNextPhaseComposer && data.lifecycle.nextPhaseId}
      <div class="mechanics-card change-action-panel">
        <div class="composer-card">
          <h3>{isClosingTransition() ? 'Request close' : 'Request advance'}</h3>
          <label>
            <span class="field-inline-label">Reason</span>
            <textarea bind:value={nextPhaseReason} rows="3" placeholder={nextPhasePlaceholder()}></textarea>
          </label>
          <div class="composer-actions">
            <button class="primary-button" type="button" on:click={submitNextPhaseRequest}>
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

  .action-group,
  .vote-card-top {
    justify-content: space-between;
  }

  .action-group-right {
    justify-content: flex-end;
  }

  .action-button {
    width: auto;
  }

  .mechanics-card,
  .composer-card,
  .surface-card {
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
  .vote-kicker {
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

  textarea,
  select {
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

  @media (max-width: 760px) {
    .change-action-row {
      grid-template-columns: 1fr;
    }

    .action-group-right {
      justify-content: flex-start;
    }
  }
</style>