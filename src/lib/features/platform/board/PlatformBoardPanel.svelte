<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import type { VoteDirection } from '$lib/types/feed';
  import type { ScopeMemberSummary, ScopePageData } from '$lib/types/scope';
  import PlatformBoardExplainerCard from './PlatformBoardExplainerCard.svelte';
  import PlatformBoardMemberSection from './PlatformBoardMemberSection.svelte';
  import PlatformExecutionFramesPanel from './PlatformExecutionFramesPanel.svelte';
  import { volunteerForBoard, removeVolunteer } from '$lib/services/commands/scopes';

  export let open = false;
  export let pageData: ScopePageData;
  export let boardStatusLabel: (member: ScopeMemberSummary) => string = () => 'Recorded board seat';
  export let meetsConfidenceThreshold: (member: ScopeMemberSummary) => boolean = () => false;
  export let onVote: (member: ScopeMemberSummary, vote: VoteDirection) => void | Promise<void> = () => {};

  const dispatch = createEventDispatcher<{ close: void }>();

  let volunteering = false;
  let volunteerMessage = '';
  let voteMessage = '';
  let showWithdrawConfirm = false;
  let showStepDownConfirm = false;
  let query = '';
  let explainerOpen = false;

  $: if (!open) {
    query = '';
    explainerOpen = false;
  }

  function sortMembers(list: ScopeMemberSummary[]) {
    return [...list].sort((a, b) => a.username.localeCompare(b.username, undefined, { sensitivity: 'base' }));
  }

  $: searchNeedle = query.trim().toLowerCase();
  $: filteredModerators = sortMembers(
    (pageData.moderators ?? []).filter(
      (member) => !searchNeedle || member.username.toLowerCase().includes(searchNeedle)
    )
  );
  $: filteredCandidates = sortMembers(
    (pageData.moderatorCandidates ?? []).filter(
      (member) => !searchNeedle || member.username.toLowerCase().includes(searchNeedle)
    )
  );

  async function handleBoardVote(member: ScopeMemberSummary, vote: VoteDirection) {
    voteMessage = '';
    try {
      await onVote(member, vote);
    } catch {
      voteMessage = 'Could not record that standing vote. Try again.';
    }
  }

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

  function handleClose() {
    open = false;
    dispatch('close');
  }

  $: canVolunteer = pageData.moderatorCandidacyOptions?.canVolunteer ?? false;
  $: viewerState = pageData.moderatorCandidacyOptions?.viewerState ?? null;
</script>

<OverlaySheet {open} title="Moderators" labelledById="platform-board-title" wide on:close={handleClose}>
  <svelte:fragment slot="subtitle">
    {#if pageData.moderatorNote}
      <p class="panel-copy">{pageData.moderatorNote}</p>
    {/if}
  </svelte:fragment>

  <svelte:fragment slot="toolbar">
    <div class="board-toolbar">
      <label class="sr-only" for="board-people-search">Search moderators</label>
      <input
        id="board-people-search"
        bind:value={query}
        placeholder="Search people"
        type="search"
      />
      <button
        class="rules-toggle"
        type="button"
        on:click={() => (explainerOpen = !explainerOpen)}
      >
        {explainerOpen ? 'Hide how moderator roles work' : 'How moderator roles work'}
      </button>
      <PlatformBoardExplainerCard bind:open={explainerOpen} showToggle={false} />
    </div>
  </svelte:fragment>

  <div class="board-body">
    <div class="people-stack">
      {#if filteredModerators.length === 0 && filteredCandidates.length === 0}
        <p class="empty-row">{query.trim() ? 'No matches.' : 'No moderators listed yet.'}</p>
      {:else}
        <PlatformBoardMemberSection
          title="Active moderators"
          members={filteredModerators}
          mode="active"
          sectionIndex={0}
          {boardStatusLabel}
          {meetsConfidenceThreshold}
          onVote={handleBoardVote}
        />

        <PlatformBoardMemberSection
          title="Seeking position"
          members={filteredCandidates}
          mode="candidate"
          sectionIndex={1}
          {boardStatusLabel}
          {meetsConfidenceThreshold}
          onVote={handleBoardVote}
        />
      {/if}
    </div>

    {#if voteMessage}
      <p class="volunteer-feedback">{voteMessage}</p>
    {/if}

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
  </div>
</OverlaySheet>

<style>
  .panel-copy {
    margin: 0;
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.45;
  }

  .board-toolbar {
    display: grid;
    gap: 8px;
    padding: 10px 16px 12px;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 70%, transparent);
  }

  .board-toolbar input {
    width: 100%;
    min-height: 40px;
    padding: 0 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-main);
  }

  .rules-toggle {
    width: fit-content;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    text-align: left;
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }

  .board-body {
    display: grid;
    gap: 12px;
    padding: 4px 0 8px;
  }

  .board-body .empty-row,
  .board-body .volunteer-row,
  .board-body .volunteer-feedback,
  .board-body :global(.frame-stack) {
    padding-left: 16px;
    padding-right: 16px;
  }

  .people-stack {
    display: grid;
    gap: 10px;
  }

  .empty-row {
    margin: 0;
    padding: 16px 0;
    color: var(--text-soft);
    font-size: 13px;
    text-align: center;
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
    color: var(--page-background);
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

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
