<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import type { VoteDirection } from '$lib/types/feed';
  import type { ScopeMemberSummary, ScopePageData } from '$lib/types/scope';
  import PlatformBoardExplainerCard from './PlatformBoardExplainerCard.svelte';
  import PlatformBoardMemberSection from './PlatformBoardMemberSection.svelte';
  import PlatformExecutionFramesPanel from './PlatformExecutionFramesPanel.svelte';
  import { volunteerForBoard, removeVolunteer } from '$lib/services/queries/scopes';

  export let pageData: ScopePageData;
  export let boardStatusLabel: (member: ScopeMemberSummary) => string = () => 'Recorded board seat';
  export let meetsConfidenceThreshold: (member: ScopeMemberSummary) => boolean = () => false;
  export let onVote: (member: ScopeMemberSummary, vote: VoteDirection) => void | Promise<void> = () => {};

  let volunteering = false;
  let volunteerMessage = '';
  let showWithdrawConfirm = false;
  let showStepDownConfirm = false;

  async function handleVolunteer() {
    volunteering = true;
    volunteerMessage = '';
    const ok = await volunteerForBoard();
    if (ok) {
      volunteerMessage = 'You are now seeking a moderator role.';
      await invalidateAll();
    } else {
      volunteerMessage = 'Could not submit volunteer request. You may already be a candidate.';
    }
    volunteering = false;
  }

  async function handleWithdrawCandidacy() {
    if (!showWithdrawConfirm) {
      showWithdrawConfirm = true;
      showStepDownConfirm = false;
      return;
    }

    volunteering = true;
    showWithdrawConfirm = false;
    volunteerMessage = '';
    const ok = await removeVolunteer();
    if (ok) {
      volunteerMessage = 'Your candidacy has been withdrawn.';
      await invalidateAll();
    } else {
      volunteerMessage = 'Could not withdraw candidacy.';
    }
    volunteering = false;
  }

  async function handleStepDown() {
    if (!showStepDownConfirm) {
      showStepDownConfirm = true;
      showWithdrawConfirm = false;
      return;
    }

    volunteering = true;
    showStepDownConfirm = false;
    volunteerMessage = '';
    const ok = await removeVolunteer();
    if (ok) {
      volunteerMessage = 'You have stepped down as moderator.';
      await invalidateAll();
    } else {
      volunteerMessage = 'Could not step down.';
    }
    volunteering = false;
  }

  function cancelConfirm() {
    showWithdrawConfirm = false;
    showStepDownConfirm = false;
  }

  $: canVolunteer = pageData.moderatorCandidacyOptions?.canVolunteer ?? false;
  $: viewerState = pageData.moderatorCandidacyOptions?.viewerState ?? null;
</script>

<section class="moderators-panel">
  <div class="panel-head">
    <span class="panel-label">Moderators</span>
    {#if pageData.moderatorNote}
      <p class="panel-copy">{pageData.moderatorNote}</p>
    {/if}
  </div>

  <PlatformBoardExplainerCard />

  <div class="people-stack">
    {#if (!pageData.moderators || pageData.moderators.length === 0) && (!pageData.moderatorCandidates || pageData.moderatorCandidates.length === 0)}
      <p class="empty-row">No moderators listed yet.</p>
    {:else}
      <PlatformBoardMemberSection
        title="Active moderators"
        members={pageData.moderators ?? []}
        mode="active"
        sectionIndex={0}
        {boardStatusLabel}
        {meetsConfidenceThreshold}
        {onVote}
      />

      <PlatformBoardMemberSection
        title="Seeking position"
        members={pageData.moderatorCandidates ?? []}
        mode="candidate"
        sectionIndex={1}
        {boardStatusLabel}
        {meetsConfidenceThreshold}
        {onVote}
      />
    {/if}
  </div>

  {#if viewerState === 'member'}
    <div class="volunteer-row">
      <button class="secondary-button" type="button" disabled={volunteering} on:click={handleStepDown}>
        {volunteering ? 'Working…' : showStepDownConfirm ? 'Confirm step down' : 'Step down as moderator'}
      </button>
      {#if showStepDownConfirm && !volunteering}
        <button class="text-button" type="button" on:click={cancelConfirm}>Cancel</button>
      {/if}
      {#if volunteerMessage}
        <p class="volunteer-feedback">{volunteerMessage}</p>
      {/if}
    </div>
  {:else if viewerState === 'candidate'}
    <div class="volunteer-row">
      <button class="secondary-button" type="button" disabled={volunteering} on:click={handleWithdrawCandidacy}>
        {volunteering ? 'Working…' : showWithdrawConfirm ? 'Confirm withdraw' : 'Withdraw candidacy'}
      </button>
      {#if showWithdrawConfirm && !volunteering}
        <button class="text-button" type="button" on:click={cancelConfirm}>Cancel</button>
      {/if}
      {#if volunteerMessage}
        <p class="volunteer-feedback">{volunteerMessage}</p>
      {/if}
    </div>
  {:else if canVolunteer}
    <div class="volunteer-row">
      <button class="primary-button" type="button" disabled={volunteering} on:click={handleVolunteer}>
        {volunteering ? 'Submitting…' : 'Volunteer as moderator'}
      </button>
      {#if volunteerMessage}
        <p class="volunteer-feedback">{volunteerMessage}</p>
      {/if}
    </div>
  {/if}

  <PlatformExecutionFramesPanel sections={pageData.moderatorFeatureFrames ?? []} />
</section>

<style>
  .moderators-panel,
  .people-stack {
    display: grid;
    gap: 10px;
  }

  .moderators-panel {
    padding: 10px 0 12px;
    border: none;
    border-bottom: 1px solid var(--panel-border);
    background: transparent;
    min-width: 0;
  }

  .panel-head {
    display: grid;
    gap: 4px;
  }

  .panel-label {
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .panel-copy {
    margin: 0;
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.45;
  }

  .empty-row {
    margin: 0;
    padding: 8px 0;
    color: var(--text-soft);
    font-size: 12px;
  }

  .volunteer-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
    padding-top: 4px;
  }

  .primary-button,
  .secondary-button,
  .text-button {
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
  }

  .primary-button {
    border: 0;
    background: var(--brand);
    color: var(--page-bg);
  }

  .secondary-button {
    border: 1px solid var(--panel-border);
    background: transparent;
    color: var(--text-main);
  }

  .text-button {
    border: 0;
    background: transparent;
    color: var(--text-soft);
  }

  .volunteer-feedback {
    width: 100%;
    margin: 0;
    color: var(--text-soft);
    font-size: 12px;
  }
</style>
