<script lang="ts">
  import ProjectValueCard from '$lib/components/cards/project-detail/ProjectValueCard.svelte';
  import AddValueSheet from '$lib/components/shared/AddValueSheet.svelte';
  import PhaseWorkToolbar from '$lib/components/shared/PhaseWorkToolbar.svelte';
  import RoundPlusButton from '$lib/components/shared/RoundPlusButton.svelte';
  import { sortValuesForRating } from '$lib/utils/sortDetailValues';
  import type {
    EventPageData,
    ProjectImportanceVoteValue
  } from '$lib/types/detail';

  export let data: EventPageData;
  export let importanceOptions: Array<{ value: ProjectImportanceVoteValue; label: string }> = [];
  export let draftValue = '';
  export let showValueComposer = false;
  export let submitValue: () => void | Promise<void> = () => {};
  export let voteOnValue: (
    valueId: string,
    vote: ProjectImportanceVoteValue
  ) => void | Promise<void> = () => {};

  $: rankedValues = sortValuesForRating(data.lifecycle.phaseOne.values);
  $: inValuePhase = data.lifecycle.currentPhaseId === 'proposal';
  $: canAddValue = inValuePhase && data.lifecycle.phaseOne.viewerCanAddValue;
  $: canVoteValues = inValuePhase && data.lifecycle.phaseOne.viewerCanVoteOnValues;
</script>

<section class="phase-surface">
  {#if data.governance !== 'organizer_controlled'}
    <div id="participation-values" class="surface-stack compact-stack">
      {#each rankedValues as value (value.id)}
        <ProjectValueCard
          canVote={canVoteValues}
          options={importanceOptions}
          {value}
          vote={voteOnValue}
        />
      {/each}
    </div>

    {#if canAddValue || inValuePhase}
      <PhaseWorkToolbar>
        {#if canAddValue}
          <RoundPlusButton
            standout
            active={showValueComposer}
            label="Add value"
            ariaLabel="Add event value"
            participationAction="add-value"
            action={() => (showValueComposer = true)}
          />
        {/if}
      </PhaseWorkToolbar>
    {/if}

    {#if canAddValue}
      <AddValueSheet
        bind:open={showValueComposer}
        bind:value={draftValue}
        placeholder="Add a value, for example: should welcome first-time neighbors clearly"
        onSubmit={submitValue}
      />
    {/if}
  {/if}
</section>

<style>
  .phase-surface,
  .surface-stack {
    display: grid;
    gap: 12px;
  }

  .compact-stack {
    gap: 0;
  }
</style>
