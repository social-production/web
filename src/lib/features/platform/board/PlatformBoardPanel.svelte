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
  let showRemoveConfirm = false;

  async function handleVolunteer() {
    volunteering = true;
    volunteerMessage = '';
    const ok = await volunteerForBoard();
    if (ok) {
      volunteerMessage = 'Your moderator volunteer request has been submitted.';
      await invalidateAll();
    } else {
      volunteerMessage = 'Could not submit volunteer request. You may already be a candidate.';
    }
    volunteering = false;
  }

  async function handleRemoveVolunteer() {
    if (!showRemoveConfirm) {
      showRemoveConfirm = true;
      return;
    }
    volunteering = true;
    showRemoveConfirm = false;
    volunteerMessage = '';
    const ok = await removeVolunteer();
    if (ok) {
      volunteerMessage = 'Your volunteer has been removed.';
      await invalidateAll();
    } else {
      volunteerMessage = 'Could not remove volunteer status.';
    }
    volunteering = false;
  }

  $: canVolunteer = pageData.moderatorCandidacyOptions?.canVolunteer ?? false;
  $: viewerState = pageData.moderatorCandidacyOptions?.viewerState ?? null;
</script>

<section class="people-card">
  <h2>Moderators</h2>
  <p class="panel-copy">{pageData.moderatorNote}</p>

  <PlatformBoardExplainerCard />

  <div class="people-stack">
    {#if (!pageData.moderators || pageData.moderators.length === 0) && (!pageData.moderatorCandidates || pageData.moderatorCandidates.length === 0)}
      <div class="person-row empty-row">
        <strong>No moderators listed yet.</strong>
      </div>
    {:else}
      <PlatformBoardMemberSection
        title="Active moderators"
        members={pageData.moderators ?? []}
        mode="active"
        {boardStatusLabel}
        {meetsConfidenceThreshold}
        {onVote}
      />

      <PlatformBoardMemberSection
        title="Seeking position"
        members={pageData.moderatorCandidates ?? []}
        mode="candidate"
        {boardStatusLabel}
        {meetsConfidenceThreshold}
        {onVote}
      />
    {/if}
  </div>

  {#if viewerState === 'candidate'}
    <div class="volunteer-row">
      <button class="secondary-button" type="button" disabled={volunteering} on:click={handleRemoveVolunteer}>
        {volunteering ? 'Removing...' : (showRemoveConfirm ? 'Confirm removal?' : 'Remove volunteer')}
      </button>
      {#if showRemoveConfirm && !volunteering}
        <button class="text-button" type="button" on:click={() => (showRemoveConfirm = false)}>Cancel</button>
      {/if}
      {#if volunteerMessage}
        <p class="volunteer-feedback">{volunteerMessage}</p>
      {/if}
    </div>
  {:else if canVolunteer}
    <div class="volunteer-row">
      <button class="primary-button" type="button" disabled={volunteering} on:click={handleVolunteer}>
        {volunteering ? 'Submitting...' : 'Volunteer as moderator'}
      </button>
      {#if volunteerMessage}
        <p class="volunteer-feedback">{volunteerMessage}</p>
      {/if}
    </div>
  {/if}

  <PlatformExecutionFramesPanel sections={pageData.moderatorFeatureFrames ?? []} />
</section>

<style>
  .people-card,
  .people-stack {
    display: grid;
    gap: 12px;
  }

  .people-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  h2 {
    margin: 0;
    font-size: 16px;
    color: var(--text-main);
  }

  .panel-copy {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.5;
  }

  .person-row.empty-row {
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
  }

  .empty-row strong {
    color: var(--text-main);
  }
  .volunteer-row {
    padding: 12px 0;
    text-align: center;
  }

  .volunteer-feedback {
    margin-top: 8px;
    color: var(--text-soft);
    font-size: 12px;
  }</style>