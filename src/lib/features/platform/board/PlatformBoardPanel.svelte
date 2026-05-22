<script lang="ts">
  import type { VoteDirection } from '$lib/types/feed';
  import type { ScopeMemberSummary, ScopePageData } from '$lib/types/scope';
  import PlatformBoardExplainerCard from './PlatformBoardExplainerCard.svelte';
  import PlatformBoardMemberSection from './PlatformBoardMemberSection.svelte';
  import PlatformExecutionFramesPanel from './PlatformExecutionFramesPanel.svelte';

  export let pageData: ScopePageData;
  export let boardStatusLabel: (member: ScopeMemberSummary) => string = () => 'Recorded board seat';
  export let meetsConfidenceThreshold: (member: ScopeMemberSummary) => boolean = () => false;
  export let onVote: (member: ScopeMemberSummary, vote: VoteDirection) => void | Promise<void> = () => {};
</script>

<section class="people-card">
  <h2>Board members</h2>
  <p class="panel-copy">{pageData.boardNote}</p>

  <PlatformBoardExplainerCard />

  <div class="people-stack">
    {#if (!pageData.boardMembers || pageData.boardMembers.length === 0) && (!pageData.boardCandidates || pageData.boardCandidates.length === 0)}
      <div class="person-row empty-row">
        <strong>No board members listed yet.</strong>
      </div>
    {:else}
      <PlatformBoardMemberSection
        title="Active board members"
        members={pageData.boardMembers ?? []}
        mode="active"
        {boardStatusLabel}
        {meetsConfidenceThreshold}
        {onVote}
      />

      <PlatformBoardMemberSection
        title="Seeking position"
        members={pageData.boardCandidates ?? []}
        mode="candidate"
        {boardStatusLabel}
        {meetsConfidenceThreshold}
        {onVote}
      />
    {/if}
  </div>

  <PlatformExecutionFramesPanel sections={pageData.boardFeatureFrames ?? []} />
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
</style>