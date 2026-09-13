<script lang="ts">
  import { afterUpdate, tick } from 'svelte';
  import VoteCardFooter from '$lib/components/shared/VoteCardFooter.svelte';
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import PhaseShiftButton from '$lib/components/shared/PhaseShiftButton.svelte';
  import { portal } from '$lib/utils/portal';
  import {
    formatProjectVoteRequirement,
    formatProjectVoteSummary
  } from '$lib/utils/projectVotes';
  import {
    phaseChangeDecisionTitle,
    resolveEventPhaseChangeVoteKind
  } from '$lib/utils/phaseChangeVotes';
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
  let nextPhaseMessage = '';
  let revertMessage = '';
  let revertTargetPhaseId: EventLifecyclePhaseId = 'event-plan';
  let expandedVoteGroup: 'return' | 'advance' | 'close' | null = null;
  let voteGroupManuallyCollapsed = false;
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
    !hasOpenPhaseChangeVotes &&
    data.lifecycle.viewerCanRequestPhaseChanges &&
    data.lifecycle.revertablePhaseIds.length > 0;
  $: canProposeAdvance =
    !hasOpenPhaseChangeVotes &&
    data.lifecycle.viewerCanRequestPhaseChanges &&
    !!data.lifecycle.nextPhaseId;

  $: if (canAdvanceCurrentPhase) {
    nextPhaseMessage = '';
  }

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

  $: currentPhaseVisible = activePhaseId === data.lifecycle.currentPhaseId;
  $: returnRequests = data.lifecycle.phaseChangeRequests.filter(
    (request) =>
      resolveEventPhaseChangeVoteKind(
        request,
        data.lifecycle.currentPhaseId,
        data.lifecycle.phases
      ) === 'return'
  );
  $: nextVoteKind = (data.lifecycle.nextPhaseId === 'closed' ? 'close' : 'advance') as 'advance' | 'close';
  $: nextActionRequests = data.lifecycle.phaseChangeRequests.filter(
    (request) =>
      resolveEventPhaseChangeVoteKind(
        request,
        data.lifecycle.currentPhaseId,
        data.lifecycle.phases
      ) === nextVoteKind
  );
  $: isOrganizerControlled = data.governance === 'organizer_controlled';
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

  function requestKindLabel(_request: EventLifecyclePhaseChangeRequest) {
    return 'Phase decision';
  }

  function requestDecisionTitle(request: EventLifecyclePhaseChangeRequest) {
    return phaseChangeDecisionTitle(
      resolveEventPhaseChangeVoteKind(
        request,
        data.lifecycle.currentPhaseId,
        data.lifecycle.phases
      ),
      request.targetPhaseLabel
    );
  }

  function phaseShortLabel(phaseId: EventLifecyclePhaseId) {
    return data.lifecycle.phases.find((phase) => phase.id === phaseId)?.title ?? phaseId;
  }

  function nextPhaseActionLabel() {
    if (!data.lifecycle.nextPhaseId) {
      return null;
    }

    if (data.lifecycle.nextPhaseId === 'closed') {
      return isOrganizerControlled ? 'Close event' : 'Close';
    }

    return isOrganizerControlled ? 'Move to next phase' : 'Advance';
  }

  function revertActionLabel() {
    return isOrganizerControlled ? 'Return to earlier phase' : 'Return';
  }

  function revertComposerTitle() {
    return phaseChangeDecisionTitle('return', phaseShortLabel(revertTargetPhaseId));
  }

  function openVoteChipLabel(count: number) {
    return `Vote now (${count})`;
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
    nextPhaseMessage = '';
    phaseChangeReason = '';
  }

  function closeRevertComposer() {
    showRevertComposer = false;
    revertReason = '';
    revertMessage = '';
  }

  $: if (hasOpenPhaseChangeVotes) {
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

    if (hasOpenPhaseChangeVotes) {
      return;
    }

    showNextPhaseComposer = true;
    nextPhaseMessage = '';
    closeRevertComposer();
    expandedVoteGroup = null;
  }

  function toggleRevertComposer() {
    const willOpen = !showRevertComposer;

    if (!willOpen) {
      closeRevertComposer();
      expandedVoteGroup = null;
      return;
    }

    if (hasOpenPhaseChangeVotes) {
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

  async function submitNextPhaseRequest() {
    if (!data.lifecycle.nextPhaseId) {
      nextPhaseMessage = 'There is no next phase available from here.';
      return;
    }
    if (!nextPhaseReason.trim()) {
      nextPhaseMessage = 'Add a reason before submitting this phase change.';
      return;
    }
    if (!canAdvanceCurrentPhase) {
      nextPhaseMessage = data.lifecycle.currentPhaseId === 'event-plan'
        ? 'This event needs an approved plan before it can advance.'
        : 'This event has not met the requirements to advance yet.';
      return;
    }

    nextPhaseMessage = '';
    phaseChangeReason = nextPhaseReason;
    await requestPhaseChange(data.lifecycle.nextPhaseId, nextPhaseReason);
    closeNextPhaseComposer();
  }

  async function submitRevertRequest() {
    if (!data.lifecycle.revertablePhaseIds.length) {
      revertMessage = 'There is no earlier phase available to return to.';
      return;
    }
    if (!revertReason.trim()) {
      revertMessage = 'Add a reason before submitting this return request.';
      return;
    }

    revertMessage = '';
    phaseChangeReason = revertReason;
    await requestPhaseChange(revertTargetPhaseId, revertReason);
    closeRevertComposer();
  }
</script>

{#if currentPhaseVisible && (data.lifecycle.phaseChangeRequests.length > 0 || data.lifecycle.viewerCanRequestPhaseChanges)}
  <div id="participation-phase-change" class="phase-change-stack">
    {#if showReturnActions || showNextActions}
      {#if embedInToolbar}
        {#if showReturnActions}
          <div class="phase-nav-side" use:portal={startHost ?? false}>
            {#if canProposeReturn}
              <PhaseShiftButton
                active={showRevertComposer}
                glyph="‹"
                label={revertActionLabel()}
                onPress={toggleRevertComposer}
              />
            {/if}
          </div>
        {/if}
        {#if showNextActions}
          <div class="phase-nav-side end" use:portal={endHost ?? false}>
            {#if canProposeAdvance && data.lifecycle.nextPhaseId}
              <PhaseShiftButton
                active={showNextPhaseComposer}
                glyph={data.lifecycle.nextPhaseId === 'closed' ? '×' : '›'}
                label={nextPhaseActionLabel() ?? 'Advance'}
                participationAction="propose-advance"
                standout
                onPress={toggleNextPhaseComposer}
              />
            {/if}
          </div>
        {/if}
      {:else}
        <div class="change-action-row">
          <div class="action-group action-group-left">
            {#if canProposeReturn}
              <PhaseShiftButton
                active={showRevertComposer}
                glyph="‹"
                label={revertActionLabel()}
                onPress={toggleRevertComposer}
              />
            {/if}
          </div>

          <div class="action-group action-group-right">
            {#if canProposeAdvance && data.lifecycle.nextPhaseId}
              <PhaseShiftButton
                active={showNextPhaseComposer}
                glyph={data.lifecycle.nextPhaseId === 'closed' ? '×' : '›'}
                label={nextPhaseActionLabel() ?? 'Advance'}
                participationAction="propose-advance"
                standout
                onPress={toggleNextPhaseComposer}
              />
            {/if}
          </div>
        </div>
      {/if}
    {/if}

    {#if canProposeReturn}
      <OverlaySheet
        bind:open={showRevertComposer}
        title={revertComposerTitle()}
        labelledById="event-return-phase-sheet"
        on:close={closeRevertComposer}
      >
        <form class="sheet-form" on:submit|preventDefault={submitRevertRequest}>
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
            <textarea bind:value={revertReason} rows="3" placeholder={revertPhasePlaceholder()}></textarea>
          </label>
          <div class="composer-actions">
            <button class="detail-action-button" type="button" on:click={closeRevertComposer}>Cancel</button>
            <button class="primary-button" type="submit">
              {revertActionLabel()}
            </button>
          </div>
        </form>
      </OverlaySheet>
    {/if}

    {#if data.lifecycle.nextPhaseId}
      <OverlaySheet
        bind:open={showNextPhaseComposer}
        title={nextPhaseActionLabel() ?? 'Advance'}
        labelledById="event-advance-phase-sheet"
        on:close={closeNextPhaseComposer}
      >
        <form class="sheet-form" on:submit|preventDefault={submitNextPhaseRequest}>
          {#if nextPhaseMessage}
            <div class="inline-alert" role="alert">{nextPhaseMessage}</div>
          {/if}
          <label>
            <span class="field-inline-label">Reason</span>
            <textarea bind:value={nextPhaseReason} rows="3" placeholder={nextPhasePlaceholder()}></textarea>
          </label>
          {#if !canAdvanceCurrentPhase}
            <div class="inline-note">
              {#if data.lifecycle.currentPhaseId === 'proposal'}
                Proposal advancement is still locked until support is above the required threshold.
              {:else if data.lifecycle.currentPhaseId === 'event-plan'}
                Planning cannot advance until a plan clears quorum and approval.
              {/if}
            </div>
          {/if}
          <div class="composer-actions">
            <button class="detail-action-button" type="button" on:click={closeNextPhaseComposer}>Cancel</button>
            <button class="primary-button" type="submit">
              {nextPhaseActionLabel()}
            </button>
          </div>
        </form>
      </OverlaySheet>
    {/if}
  </div>
{/if}

<style>
  .phase-change-stack,
  .sheet-form,
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

  .phase-nav-side {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .phase-nav-side.end {
    justify-content: flex-end;
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

  .sheet-form {
    padding: 8px 16px 4px;
  }

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

  .inline-alert {
    padding: 10px 12px;
    border-left: 3px solid color-mix(in srgb, var(--status-yellow) 70%, var(--panel-border));
    color: var(--text-main);
    font-size: 13px;
    font-weight: 600;
  }

  .primary-button,
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
      grid-template-columns: 1fr 1fr;
    }
  }
</style>