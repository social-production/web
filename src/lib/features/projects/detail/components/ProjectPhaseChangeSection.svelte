<script lang="ts">
  import { tick } from 'svelte';
  import CountBadge from '$lib/components/shared/CountBadge.svelte';
  import VoteCardFooter from '$lib/components/shared/VoteCardFooter.svelte';
  import {
    isProductiveProject,
    isCollectiveServiceProject,
    isPersonalServiceProject,
    projectSubjectLabel,
    projectSubtypeLabel
  } from '$lib/features/projects/projectMode';
  import {
    formatProjectVoteRequirement,
    formatProjectVoteSummary
  } from '$lib/utils/projectVotes';
  import type {
    ProjectApprovalVote,
    ProjectLifecyclePhaseChangeRequest,
    ProjectLifecyclePhaseId,
    ProjectPhaseChangeRequestOptions,
    ProjectPageData
  } from '$lib/types/detail';

  export let data: ProjectPageData;
  export let activePhaseId: ProjectLifecyclePhaseId;
  export let advancePhase: (closeNote?: string) => void | Promise<void> = () => {};
  export let revertPhase: (
    targetPhaseId: Extract<ProjectLifecyclePhaseId, 'phase-1' | 'phase-2' | 'phase-3'>,
    reason: string
  ) => void | Promise<void> = () => {};
  export let requestPhaseChange: (
    targetPhaseId: ProjectLifecyclePhaseId,
    reason: string,
    options?: ProjectPhaseChangeRequestOptions
  ) => void | Promise<void> = () => {};
  export let voteOnPhaseChange: (
    requestId: string,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};

  let showNextPhaseComposer = false;
  let showRevertComposer = false;
  let nextPhaseReason = '';
  let nextPhaseCloseOutcome: 'close' | 'convert' = 'close';
  let revertReason = '';
  let nextPhaseMessage = '';
  let revertMessage = '';
  let revertTargetPhaseId: Extract<ProjectLifecyclePhaseId, 'phase-1' | 'phase-2' | 'phase-3'> = 'phase-2';
  let expandedVoteGroup: 'return' | 'advance' | 'close' | null = null;

  export let autoExpandVoteGroup: 'return' | 'advance' | 'close' | null = null;

  $: if (autoExpandVoteGroup && autoExpandVoteGroup !== expandedVoteGroup) {
    expandedVoteGroup = autoExpandVoteGroup;
  }
  let nextPhaseComposerElement: HTMLDivElement | null = null;
  let revertComposerElement: HTMLDivElement | null = null;

  $: currentPhaseVisible = activePhaseId === data.lifecycle.currentPhaseId;
  $: personalDirectPhaseChange = isPersonalServiceProject(data.projectMode);
  $: returnRequests = data.lifecycle.phaseChangeRequests.filter((request) => request.kind === 'return');
  $: nextVoteKind = (isClosingTransition() ? 'close' : 'advance') as 'close' | 'advance';
  $: nextActionRequests = data.lifecycle.phaseChangeRequests.filter(
    (request) => request.kind === nextVoteKind
  );
  $: canDirectReturn = personalDirectPhaseChange && data.lifecycle.viewerCanRevertPhase;
  $: signalGatePasses = data.lifecycle.currentPhaseId !== 'phase-1' || (data.lifecycle.phaseOne?.signalSummary?.advancementUnlocked ?? false);
  $: planGateMessage =
    data.lifecycle.currentPhaseId === 'phase-2' && !data.lifecycle.phaseTwo.winningPlanId
      ? 'This project needs an approved production or operations plan before it can advance.'
      : data.lifecycle.currentPhaseId === 'phase-3' && !data.lifecycle.phaseThree.winningPlanId
        ? 'This project needs an approved distribution or access plan before it can advance.'
        : '';
  $: phaseGatePasses = signalGatePasses && !planGateMessage;
  $: canDirectAdvance = personalDirectPhaseChange && data.lifecycle.viewerCanAdvancePhase && phaseGatePasses;
  $: showReturnActions = personalDirectPhaseChange
    ? canDirectReturn
    : data.lifecycle.revertablePhaseIds.length > 0 || returnRequests.length > 0;
  $: showNextActions = personalDirectPhaseChange
    ? !!data.lifecycle.nextPhaseId && data.lifecycle.viewerCanAdvancePhase
    : !!data.lifecycle.nextPhaseId || nextActionRequests.length > 0;
  $: canOfferConversionOnClose =
    !personalDirectPhaseChange && isProductiveProject(data.projectMode) && isClosingTransition();
  $: suggestedConversionTarget = canOfferConversionOnClose
    ? {
        projectMode: 'collective-service' as const,
        projectSubtype:
          data.projectSubtype === 'software' ? ('software' as const) : ('standard' as const)
      }
    : null;

  $: if (!data.lifecycle.revertablePhaseIds.includes(revertTargetPhaseId)) {
    revertTargetPhaseId = data.lifecycle.revertablePhaseIds[0] ?? 'phase-1';
  }

  $: if (!currentPhaseVisible) {
    showNextPhaseComposer = false;
    showRevertComposer = false;
    expandedVoteGroup = null;
  }

  function closePhaseId() {
    if (isPersonalServiceProject(data.projectMode)) {
      return 'phase-2';
    }

    return 'phase-7';
  }

  function isClosingTransition() {
    return data.lifecycle.nextPhaseId === closePhaseId();
  }

  function revertTargetLabel(
    phaseId: Extract<ProjectLifecyclePhaseId, 'phase-1' | 'phase-2' | 'phase-3'>
  ) {
    if (phaseId === 'phase-1') {
      return 'Phase 1 / Active service';
    }

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
      if (canOfferConversionOnClose) {
        return 'Close or convert';
      }

      return personalDirectPhaseChange ? 'Close service' : 'Close';
    }

    return personalDirectPhaseChange ? 'Advance project' : 'Advance';
  }

  function nextPhasePlaceholder() {
    if (personalDirectPhaseChange && isClosingTransition()) {
      return 'Add the closure note that should appear in project updates.';
    }

    if (canOfferConversionOnClose) {
      return 'State why the project should close now or reopen as a governed follow-on service.';
    }

    return isClosingTransition()
      ? 'State why the project should close or where the work continues next.'
      : 'State why this phase change should happen now.';
  }

  function requestKindLabel(request: ProjectLifecyclePhaseChangeRequest) {
    switch (request.kind) {
      case 'close':
        return request.closeOutcome === 'convert' ? 'Convert decision' : 'Close decision';
      case 'return':
        return 'Return decision';
      default:
        return 'Advance decision';
    }
  }

  function closeOutcomeLabel() {
    if (!suggestedConversionTarget) {
      return null;
    }

    return `${projectSubjectLabel(suggestedConversionTarget.projectMode)} · ${projectSubtypeLabel(suggestedConversionTarget.projectSubtype)}`;
  }

  async function submitNextPhaseRequest() {
    if (!data.lifecycle.nextPhaseId) {
      nextPhaseMessage = 'There is no next phase available from here.';
      return;
    }

    if (!nextPhaseReason.trim()) {
      nextPhaseMessage = 'Add a reason before submitting this phase change.';
      return;
    }

    if (!phaseGatePasses) {
      nextPhaseMessage = planGateMessage || 'This project has not met the requirements to advance from proposal yet.';
      return;
    }

    nextPhaseMessage = '';
    if (personalDirectPhaseChange) {
      await advancePhase(nextPhaseReason);
    } else {
      const options = isClosingTransition()
        ? nextPhaseCloseOutcome === 'convert' && suggestedConversionTarget
          ? {
              closeOutcome: 'convert' as const,
              conversionTarget: suggestedConversionTarget
            }
          : {
              closeOutcome: 'close' as const
            }
        : undefined;

      await requestPhaseChange(data.lifecycle.nextPhaseId, nextPhaseReason, options);
    }

    closeNextPhaseComposer();
  }

  async function submitRevertRequest() {
    if (!revertReason.trim()) {
      revertMessage = 'Add a reason before submitting this return request.';
      return;
    }

    revertMessage = '';
    if (personalDirectPhaseChange) {
      await revertPhase(revertTargetPhaseId, revertReason);
    } else {
      await requestPhaseChange(revertTargetPhaseId, revertReason);
    }

    closeRevertComposer();
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

  function closeNextPhaseComposer() {
    showNextPhaseComposer = false;
    nextPhaseReason = '';
    nextPhaseMessage = '';
    nextPhaseCloseOutcome = 'close';
  }

  function closeRevertComposer() {
    showRevertComposer = false;
    revertReason = '';
    revertMessage = '';
  }

  async function toggleNextPhaseComposer() {
    const willOpen = !showNextPhaseComposer;

    if (!willOpen) {
      closeNextPhaseComposer();
      expandedVoteGroup = null;
      return;
    }

    showNextPhaseComposer = true;
    nextPhaseMessage = '';
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
    revertMessage = '';
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
</script>

{#if currentPhaseVisible && (data.lifecycle.phaseChangeRequests.length > 0 || data.lifecycle.viewerCanRequestPhaseChanges || data.lifecycle.viewerCanAdvancePhase || data.lifecycle.viewerCanRevertPhase)}
  <div class="phase-change-stack">
    {#if showReturnActions || showNextActions}
      <div class="change-action-row">
        <div class="action-group action-group-left">
          {#if (personalDirectPhaseChange ? canDirectReturn : data.lifecycle.viewerCanRequestPhaseChanges) && data.lifecycle.revertablePhaseIds.length > 0}
            <button
              class:active-toggle={showRevertComposer}
              class="secondary-button action-button"
              type="button"
              on:click={toggleRevertComposer}
            >
              {personalDirectPhaseChange ? 'Return to active' : 'Return'}
            </button>
          {/if}
          {#if !personalDirectPhaseChange && returnRequests.length > 0}
            <button class="vote-chip notice-chip" type="button" on:click={() => toggleVoteGroup('return')}>
              Vote Active
              <CountBadge count={returnRequests.length} />
            </button>
          {/if}
        </div>

        <div class="action-group action-group-right">
          {#if !personalDirectPhaseChange && nextActionRequests.length > 0}
            <button class="vote-chip notice-chip" type="button" on:click={() => toggleVoteGroup(nextVoteKind)}>
              Vote Active
              <CountBadge count={nextActionRequests.length} />
            </button>
          {/if}
          {#if (personalDirectPhaseChange ? data.lifecycle.viewerCanAdvancePhase : data.lifecycle.viewerCanRequestPhaseChanges) && data.lifecycle.nextPhaseId}
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

    {#if showRevertComposer && (personalDirectPhaseChange ? canDirectReturn : data.lifecycle.viewerCanRequestPhaseChanges) && data.lifecycle.revertablePhaseIds.length > 0}
      <div bind:this={revertComposerElement} class="change-action-panel">
          <h3>{personalDirectPhaseChange ? 'Return to active' : 'Return'}</h3>
          {#if revertMessage}
            <div class="inline-alert" role="alert">{revertMessage}</div>
          {/if}
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
            <textarea
              bind:value={revertReason}
              rows="3"
              placeholder={personalDirectPhaseChange
                ? 'State clearly why the project should return to active work.'
                : 'State clearly why the project should return to an earlier planning phase.'}
            ></textarea>
          </label>
          <div class="composer-actions">
            <button class="secondary-button" type="button" on:click={closeRevertComposer}>Cancel</button>
            <button class="primary-button" type="button" on:click={submitRevertRequest}>
              {personalDirectPhaseChange ? 'Return to active' : 'Return'}
            </button>
          </div>
      </div>
    {/if}

    {#if showNextPhaseComposer && data.lifecycle.nextPhaseId}
      <div bind:this={nextPhaseComposerElement} class="change-action-panel">
          <h3>{nextPhaseActionLabel()}</h3>
          {#if nextPhaseMessage}
            <div class="inline-alert" role="alert">{nextPhaseMessage}</div>
          {/if}
          {#if !phaseGatePasses}
            <div class="inline-note">
              {planGateMessage || 'Advancement is locked until proposal demand meets the required threshold.'}
            </div>
          {/if}
          {#if canOfferConversionOnClose}
            <label>
              <span class="field-inline-label">Outcome</span>
              <select bind:value={nextPhaseCloseOutcome}>
                <option value="close">Close project</option>
                <option value="convert">Convert into collective service</option>
              </select>
            </label>

            {#if nextPhaseCloseOutcome === 'convert' && suggestedConversionTarget}
              <div class="inline-note conversion-note">
                <span class="field-inline-label">Governed successor</span>
                <strong>{closeOutcomeLabel()}</strong>
                <p>
                  The successor will reopen in Proposal and inherit the current inventory framing once this close vote passes.
                </p>
              </div>
            {/if}
          {/if}

          <label>
            <span class="field-inline-label">Reason</span>
            <textarea bind:value={nextPhaseReason} rows="3" placeholder={nextPhasePlaceholder()}></textarea>
          </label>
          <div class="composer-actions">
            <button class="secondary-button" type="button" on:click={closeNextPhaseComposer}>Cancel</button>
            <button class="primary-button" type="button" on:click={submitNextPhaseRequest}>
              {nextPhaseActionLabel()}
            </button>
          </div>
      </div>
    {/if}

    {#if expandedVoteGroup === 'return' && returnRequests.length > 0}
      <div class="surface-stack">
        {#each returnRequests as request (request.id)}
          <article id={`vote-card-phase_change-${request.id}`} class="surface-card vote-request-card">
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

            {#if request.closeOutcome === 'convert' && request.conversionTarget}
              <div class="detail-grid">
                <div class="detail-card">
                  <span>Successor target</span>
                  <strong>{request.conversionTarget.projectModeLabel} · {request.conversionTarget.projectSubtypeLabel}</strong>
                </div>
                <div class="detail-card">
                  <span>Successor entry phase</span>
                  <strong>{request.conversionTarget.entryPhaseLabel}</strong>
                </div>
              </div>
            {/if}

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
          <article id={`vote-card-phase_change-${request.id}`} class="surface-card vote-request-card">
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
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .surface-card,
  .detail-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .detail-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .vote-request-card {
    border-color: color-mix(in srgb, var(--brand) 16%, var(--panel-border));
    background: color-mix(in srgb, var(--panel) 82%, var(--panel-strong));
  }

  .inline-alert {
    padding: 10px 12px;
    border-left: 3px solid color-mix(in srgb, var(--status-yellow) 70%, var(--panel-border));
    color: var(--text-main);
    font-size: 13px;
    font-weight: 600;
  }

  .inline-note,
  .conversion-note p {
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.45;
  }

  .conversion-note {
    display: grid;
    gap: 6px;
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
  .inline-note,
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