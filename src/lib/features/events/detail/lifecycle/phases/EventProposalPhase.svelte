<script lang="ts">
  import ProjectValueCard from '$lib/components/cards/project-detail/ProjectValueCard.svelte';
  import RoundPlusButton from '$lib/components/shared/RoundPlusButton.svelte';
  import type {
    EventPageData,
    GovernanceSignalSummary,
    ProjectImportanceVoteValue
  } from '$lib/types/detail';

  export let data: EventPageData;
  export let signalSummary: GovernanceSignalSummary | null = null;
  export let importanceOptions: Array<{ value: ProjectImportanceVoteValue; label: string }> = [];
  export let draftValue = '';
  export let showValueComposer = false;
  export let submitValue: () => void | Promise<void> = () => {};
  export let voteOnValue: (
    valueId: string,
    vote: ProjectImportanceVoteValue
  ) => void | Promise<void> = () => {};
</script>

<section class="phase-surface">
  {#if signalSummary}
    <div class="info-card">
      <strong>Proposal threshold</strong>
      <p>
        {#if signalSummary.usesPlatformVoteContext}
          Demand must stay above 66% of active signals and reach {signalSummary.requiredDemandCount} demand signals from {signalSummary.voteContextPopulation} weekly active users.
        {:else}
          Demand must stay above 66% of active proposal signals before planning can open.
        {/if}
      </p>
    </div>
  {/if}

  {#if data.lifecycle.phaseOne.viewerCanAddValue}
    <div class="composer-toggle-row">
      <RoundPlusButton
        active={showValueComposer}
        ariaLabel="Add event value"
        action={() => (showValueComposer = !showValueComposer)}
      />
    </div>

    {#if showValueComposer}
      <div class="composer-card">
        <input bind:value={draftValue} maxlength="160" placeholder="Add a value, for example: should welcome first-time neighbors clearly" />
        <div class="composer-actions">
          <button class="secondary-button" type="button" on:click={() => (showValueComposer = false)}>Cancel</button>
          <button class="primary-button" type="button" on:click={submitValue}>Add value</button>
        </div>
      </div>
    {/if}
  {/if}

    <div id="participation-values" class="surface-stack compact-stack">
    {#if data.lifecycle.phaseOne.values.length === 0}
      <div class="empty-card">No proposal values yet.</div>
    {:else}
      {#each data.lifecycle.phaseOne.values as value}
        <ProjectValueCard
          canVote={data.lifecycle.phaseOne.viewerCanVoteOnValues}
          options={importanceOptions}
          {value}
          vote={voteOnValue}
        />
      {/each}
    {/if}
  </div>
</section>

<style>
  .phase-surface,
  .surface-stack,
  .composer-card,
  .info-card {
    display: grid;
    gap: 12px;
  }

  .info-card,
  .composer-card,
  .empty-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .composer-toggle-row,
  .composer-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
  }

  strong {
    color: var(--text-main);
  }

  p,
  .empty-card {
    margin: 0;
    color: var(--text-soft);
  }

  input {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
  }

  .primary-button,
  .secondary-button {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
  }

  .primary-button {
    border: 1px solid var(--brand);
    background: var(--brand);
    color: var(--page-bg);
  }

  .secondary-button {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    color: var(--text-soft);
  }
</style>