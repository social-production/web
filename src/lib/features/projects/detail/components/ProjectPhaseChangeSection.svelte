<script lang="ts">
  import { afterUpdate, tick } from 'svelte';
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import PhaseMenu, { type PhaseMenuItem } from '$lib/components/shared/PhaseMenu.svelte';
  import QuorumSentence from '$lib/features/detail/QuorumSentence.svelte';
  import { portal } from '$lib/utils/portal';
  import {
    isProductiveProject,
    isPersonalServiceProject,
    projectSubjectLabel,
    projectSubtypeLabel
  } from '$lib/features/projects/projectMode';
  import { projectPlanGateMessage } from '$lib/utils/participationSteps';
  import {
    phaseChangeDecisionTitle,
    resolveProjectPhaseChangeVoteKind
  } from '$lib/utils/phaseChangeVotes';
  import type {
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

  let showNextPhaseComposer = false;
  let showRevertComposer = false;
  let nextPhaseReason = '';
  let nextPhaseCloseOutcome: 'close' | 'convert' = 'close';
  let revertReason = '';
  let nextPhaseMessage = '';
  let revertMessage = '';
  let revertTargetPhaseId: Extract<ProjectLifecyclePhaseId, 'phase-1' | 'phase-2' | 'phase-3'> = 'phase-2';
  let expandedVoteGroup: 'return' | 'advance' | 'close' | null = null;
  let voteGroupManuallyCollapsed = false;

  export let votesRenderedInHub = false;

  export let autoExpandVoteGroup: 'return' | 'advance' | 'close' | null = null;

  $: if (autoExpandVoteGroup && autoExpandVoteGroup !== expandedVoteGroup) {
    expandedVoteGroup = autoExpandVoteGroup;
    voteGroupManuallyCollapsed = false;
  }

  $: hasOpenPhaseChangeVotes = data.lifecycle.phaseChangeRequests.length > 0;
  $: pendingReturnVotes = returnRequests.filter((request) => !request.voteSummary.activeVote);
  $: pendingNextVotes = nextActionRequests.filter((request) => !request.voteSummary.activeVote);
  $: canProposeReturn =
    !personalDirectPhaseChange &&
    !hasOpenPhaseChangeVotes &&
    data.lifecycle.viewerCanRequestPhaseChanges &&
    data.lifecycle.revertablePhaseIds.length > 0;
  $: canProposeAdvance =
    !personalDirectPhaseChange &&
    !hasOpenPhaseChangeVotes &&
    data.lifecycle.viewerCanRequestPhaseChanges &&
    phaseGatePasses &&
    !!data.lifecycle.nextPhaseId;

  $: if (
    !votesRenderedInHub &&
    currentPhaseVisible &&
    data.lifecycle.viewerCanVoteOnPhaseChanges &&
    !voteGroupManuallyCollapsed &&
    !autoExpandVoteGroup
  ) {
    if (pendingReturnVotes.length > 0) {
      expandedVoteGroup = 'return';
    } else if (pendingNextVotes.length > 0) {
      expandedVoteGroup = nextVoteKind;
    }
  }
  let startHost: HTMLElement | null = null;
  let endHost: HTMLElement | null = null;

  function refreshNavHosts() {
    if (typeof document === 'undefined') {
      return;
    }
    const nextStart = document.getElementById('phase-nav-start');
    const nextEnd = document.getElementById('phase-nav-end');
    if (nextStart !== startHost) {
      startHost = nextStart;
    }
    if (nextEnd !== endHost) {
      endHost = nextEnd;
    }
  }

  afterUpdate(refreshNavHosts);

  $: if (activePhaseId) {
    void tick().then(refreshNavHosts);
  }

  $: embedInToolbar = Boolean(startHost && endHost);

  $: currentPhaseVisible = activePhaseId === data.lifecycle.currentPhaseId;
  $: personalDirectPhaseChange = isPersonalServiceProject(data.projectMode);
  $: returnRequests = data.lifecycle.phaseChangeRequests.filter(
    (request) =>
      resolveProjectPhaseChangeVoteKind(
        request,
        data.projectMode,
        data.lifecycle.currentPhaseId,
        data.lifecycle.phases
      ) === 'return'
  );
  $: nextVoteKind = (isClosingTransition() ? 'close' : 'advance') as 'close' | 'advance';
  $: nextActionRequests = data.lifecycle.phaseChangeRequests.filter(
    (request) =>
      resolveProjectPhaseChangeVoteKind(
        request,
        data.projectMode,
        data.lifecycle.currentPhaseId,
        data.lifecycle.phases
      ) === nextVoteKind
  );
  $: canDirectReturn = personalDirectPhaseChange && data.lifecycle.viewerCanRevertPhase;
  $: signalGatePasses = data.lifecycle.currentPhaseId !== 'phase-1' || (data.lifecycle.phaseOne?.signalSummary?.advancementUnlocked ?? false);
  $: planGateMessage = projectPlanGateMessage(data);
  $: phaseGatePasses = signalGatePasses && !planGateMessage;
  $: if (phaseGatePasses) {
    nextPhaseMessage = '';
  }
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
    return phaseShortLabel(phaseId);
  }

  function phaseShortLabel(phaseId: ProjectLifecyclePhaseId) {
    return data.lifecycle.phases.find((phase) => phase.id === phaseId)?.title ?? phaseId;
  }

  // Re-run when the close/convert choice or the project changes.
  $: nextActionLabel = nextPhaseActionLabel(nextPhaseCloseOutcome, data, canOfferConversionOnClose);

  function nextPhaseActionLabel(..._dependencies: unknown[]) {
    if (!data.lifecycle.nextPhaseId || !data.lifecycle.nextPhaseLabel) {
      return null;
    }

    if (isClosingTransition()) {
        if (canOfferConversionOnClose) {
        return nextPhaseCloseOutcome === 'convert' ? 'Convert into collective service' : 'Close project';
      }

      return personalDirectPhaseChange ? 'Close service' : 'Close project';
    }

    const target = data.lifecycle.nextPhaseLabel;
    return personalDirectPhaseChange ? `Advance to ${target}` : `Advance to ${target}`;
  }

  function revertActionLabel() {
    if (personalDirectPhaseChange) {
      return 'Return to active';
    }

    return 'Return';
  }

  function revertComposerTitle() {
    if (personalDirectPhaseChange) {
      return 'Return to active';
    }

    return phaseChangeDecisionTitle('return', phaseShortLabel(revertTargetPhaseId));
  }

  function openVoteChipLabel(count: number) {
    return `Vote now (${count})`;
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
    return 'Phase';
  }

  function requestDecisionTitle(request: ProjectLifecyclePhaseChangeRequest) {
    return phaseChangeDecisionTitle(
      resolveProjectPhaseChangeVoteKind(
        request,
        data.projectMode,
        data.lifecycle.currentPhaseId,
        data.lifecycle.phases
      ),
      request.targetPhaseLabel,
      request.closeOutcome
    );
  }

  function closeOutcomeLabel() {
    if (!suggestedConversionTarget) {
      return null;
    }

    return `${projectSubjectLabel(suggestedConversionTarget.projectMode)} · ${projectSubtypeLabel(suggestedConversionTarget.projectSubtype)}`;
  }

  let phaseRequestPending = false;

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
    // One request per submit, even on a double tap or Enter plus click.
    if (phaseRequestPending) return;
    phaseRequestPending = true;
    try {
      await sendNextPhaseRequest();
    } finally {
      phaseRequestPending = false;
    }
  }

  async function sendNextPhaseRequest() {
    if (!data.lifecycle.nextPhaseId) return;
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
    await revertPhase(revertTargetPhaseId, revertReason);

    closeRevertComposer();
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

  $: if (!personalDirectPhaseChange && hasOpenPhaseChangeVotes) {
    closeRevertComposer();
    closeNextPhaseComposer();
  }

  function toggleNextPhaseComposer() {
    const willOpen = !showNextPhaseComposer;

    if (!willOpen) {
      closeNextPhaseComposer();
      expandedVoteGroup = null;
      return;
    }

    if (!personalDirectPhaseChange && hasOpenPhaseChangeVotes) {
      return;
    }

    showNextPhaseComposer = true;
    nextPhaseMessage = '';
    closeRevertComposer();
    expandedVoteGroup = null;
  }

  function openNextPhaseComposer(outcome: 'close' | 'convert' = 'close') {
    if (!showNextPhaseComposer) {
      toggleNextPhaseComposer();
    }
    nextPhaseCloseOutcome = outcome;
  }

  function phaseLockReason() {
    if (!personalDirectPhaseChange && hasOpenPhaseChangeVotes) {
      return 'A phase vote is already open. Vote on it in Pending votes first.';
    }
    if (!signalGatePasses) {
      return 'Unlocks after this project gets a Support signal.';
    }
    return planGateMessage || '';
  }

  // The arguments list what the menu depends on, so the reactive statement re-runs when any gate changes.
  $: menuItems = phaseMenuItems(
    data,
    hasOpenPhaseChangeVotes,
    phaseGatePasses,
    canProposeAdvance,
    canProposeReturn,
    canDirectReturn,
    canOfferConversionOnClose
  );

  function phaseMenuItems(..._dependencies: unknown[]): PhaseMenuItem[] {
    const items: PhaseMenuItem[] = [];
    const lifecycle = data.lifecycle;
    const advanceAllowed = Boolean(
      (personalDirectPhaseChange ? lifecycle.viewerCanAdvancePhase && phaseGatePasses : canProposeAdvance) &&
        lifecycle.nextPhaseId
    );
    const advanceVisible =
      Boolean(lifecycle.nextPhaseId) &&
      (personalDirectPhaseChange ? lifecycle.viewerCanAdvancePhase : lifecycle.viewerCanRequestPhaseChanges);
    const locked = advanceAllowed ? '' : phaseLockReason();
    const viaVote = !personalDirectPhaseChange;

    if (advanceVisible && isClosingTransition() && canOfferConversionOnClose) {
      items.push({
        id: 'close',
        glyph: '×',
        label: 'Close project',
        detail: locked || 'Members vote to finish the project. Proposing counts as your Yes.',
        disabled: !advanceAllowed,
        onSelect: () => openNextPhaseComposer('close')
      });
      items.push({
        id: 'convert',
        glyph: '⇄',
        label: 'Convert into collective service',
        detail: locked || 'Members vote to close this and reopen it as an ongoing service.',
        disabled: !advanceAllowed,
        onSelect: () => openNextPhaseComposer('convert')
      });
    } else if (advanceVisible && isClosingTransition()) {
      items.push({
        id: 'close',
        glyph: '×',
        label: personalDirectPhaseChange ? 'Close service' : 'Close project',
        detail:
          locked ||
          (viaVote
            ? 'Members vote to finish the project. Proposing counts as your Yes.'
            : 'Stop offering this service now. You can reopen it later.'),
        disabled: !advanceAllowed,
        onSelect: () => openNextPhaseComposer('close')
      });
    } else if (advanceVisible) {
      items.push({
        id: 'advance',
        glyph: '›',
        label: `Advance to ${lifecycle.nextPhaseLabel ?? 'the next phase'}`,
        detail:
          locked ||
          (viaVote ? 'Members vote to move on. Proposing counts as your Yes.' : 'Takes effect right away.'),
        disabled: !advanceAllowed,
        onSelect: () => openNextPhaseComposer('close')
      });
    }

    const returnAllowed = personalDirectPhaseChange ? canDirectReturn : canProposeReturn;
    const returnVisible = personalDirectPhaseChange
      ? canDirectReturn
      : lifecycle.viewerCanRequestPhaseChanges && lifecycle.revertablePhaseIds.length > 0;
    if (returnVisible) {
      items.push({
        id: 'return',
        glyph: '‹',
        label: personalDirectPhaseChange ? 'Return to active' : 'Return to an earlier phase',
        detail: returnAllowed
          ? viaVote
            ? 'Members vote to go back and rework the plans.'
            : 'Reopen the service right away.'
          : phaseLockReason(),
        disabled: !returnAllowed,
        onSelect: toggleRevertComposer
      });
    }
    return items;
  }

  function toggleRevertComposer() {
    const willOpen = !showRevertComposer;

    if (!willOpen) {
      closeRevertComposer();
      expandedVoteGroup = null;
      return;
    }

    if (!personalDirectPhaseChange && hasOpenPhaseChangeVotes) {
      return;
    }

    showRevertComposer = true;
    revertMessage = '';
    closeNextPhaseComposer();
    expandedVoteGroup = null;
  }

  function scrollToVoteHub() {
    document.getElementById('pending-votes-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function toggleVoteGroup(kind: 'return' | 'advance' | 'close') {
    if (votesRenderedInHub) {
      scrollToVoteHub();
      return;
    }

    if (expandedVoteGroup === kind) {
      expandedVoteGroup = null;
      voteGroupManuallyCollapsed = true;
    } else {
      expandedVoteGroup = kind;
      voteGroupManuallyCollapsed = false;
    }
    closeNextPhaseComposer();
    closeRevertComposer();
  }
</script>

{#if currentPhaseVisible && (data.lifecycle.phaseChangeRequests.length > 0 || data.lifecycle.viewerCanRequestPhaseChanges || data.lifecycle.viewerCanAdvancePhase || data.lifecycle.viewerCanRevertPhase)}
  <div id="participation-phase-change" class="phase-change-stack">
    {#if currentPhaseVisible && data.lifecycle.nextPhaseId && data.lifecycle.viewerCanRequestPhaseChanges && !phaseGatePasses}
      <p class="phase-gate-note">
        {#if !signalGatePasses}
          Advance unlocks after this project gets a Support signal.
        {:else}
          {planGateMessage}
        {/if}
      </p>
    {/if}
    {#if showReturnActions || showNextActions}
      {#if embedInToolbar}
        <div class="phase-nav-side end" use:portal={endHost ?? false}>
          <PhaseMenu items={menuItems} currentPhaseLabel={phaseShortLabel(data.lifecycle.currentPhaseId)} labelledById="project-phase-menu" />
        </div>
      {:else}
        <div class="change-action-row">
          <div class="action-group action-group-right">
            <PhaseMenu items={menuItems} currentPhaseLabel={phaseShortLabel(data.lifecycle.currentPhaseId)} labelledById="project-phase-menu" />
          </div>
        </div>
      {/if}
    {/if}

    {#if personalDirectPhaseChange ? canDirectReturn : canProposeReturn}
      <OverlaySheet
        bind:open={showRevertComposer}
        hideClose
        title={revertComposerTitle()}
        labelledById="project-return-phase-sheet"
        on:close={closeRevertComposer}
      >
        <form id="project-return-phase-form" class="sheet-form" on:submit|preventDefault={submitRevertRequest}>
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
        </form>
        <svelte:fragment slot="footer">
          <div class="sheet-actions">
            <button class="sheet-cancel" type="button" on:click={closeRevertComposer}>Cancel</button>
            <button class="sheet-submit" form="project-return-phase-form" type="submit">
              {revertActionLabel()}
            </button>
          </div>
        </svelte:fragment>
      </OverlaySheet>
    {/if}

    {#if data.lifecycle.nextPhaseId}
      <OverlaySheet
        bind:open={showNextPhaseComposer}
        hideClose
        title={nextActionLabel ?? 'Advance'}
        labelledById="project-advance-phase-sheet"
        on:close={closeNextPhaseComposer}
      >
        <form id="project-advance-phase-form" class="sheet-form" on:submit|preventDefault={submitNextPhaseRequest}>
          {#if nextPhaseMessage}
            <div class="inline-alert" role="alert">{nextPhaseMessage}</div>
          {/if}
          {#if !phaseGatePasses}
            <div class="inline-note">
              <QuorumSentence
                text={planGateMessage || 'Advancement is locked until proposal support meets the required threshold.'}
                votesRequired={data.lifecycle.quorumVotesRequired}
                audienceSize={data.lifecycle.voteContextPopulation}
                audienceLabel={data.lifecycle.voteContextLabel}
                usesPlatform={data.lifecycle.usesPlatformLifecycle}
                entityLabel="project"
              />
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
        </form>
        <svelte:fragment slot="footer">
          <div class="sheet-actions">
            <button class="sheet-cancel" type="button" on:click={closeNextPhaseComposer}>Cancel</button>
            <button class="sheet-submit" form="project-advance-phase-form" type="submit">
              {nextActionLabel}
            </button>
          </div>
        </svelte:fragment>
      </OverlaySheet>
    {/if}
  </div>
{/if}

<style>
  .phase-gate-note {
    margin: 0 0 8px;
    color: var(--text-main);
    font-size: 13px;
  }

  .phase-change-stack,
  .sheet-form {
    display: grid;
    gap: 12px;
  }

  .change-action-row {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: center;
  }

  .phase-nav-side {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .phase-nav-side.end {
    justify-content: flex-end;
  }

  .action-group {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .action-group-right {
    justify-content: flex-end;
  }

  .sheet-form {
    padding: 8px 16px 4px;
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

  strong,
  .field-inline-label {
    color: var(--text-main);
  }

  p,
  span,
  .inline-note {
    color: var(--text-soft);
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
      grid-template-columns: 1fr 1fr;
    }

    .action-group-right {
      justify-content: flex-end;
    }
  }
</style>