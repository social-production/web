<script lang="ts">
  import DiscreteScale from '$lib/components/shared/DiscreteScale.svelte';
  import type { ProjectImportanceVoteValue, ProjectValueItem } from '$lib/types/detail';

  export let value: ProjectValueItem;
  export let canVote = false;
  export let options: Array<{ value: ProjectImportanceVoteValue; label: string }> = [];
  export let vote: (valueId: string, voteValue: ProjectImportanceVoteValue) => void = () => {};

  $: scoreLabel = value.voteCount === 0 ? 'No rating' : `${value.importanceScore.toFixed(1).replace(/\.0$/, '')}/10`;
  $: voteLabel = `${value.voteCount} vote${value.voteCount === 1 ? '' : 's'}`;
</script>

<article class="value-card">
  <strong class="value-title">{value.label}</strong>

  <DiscreteScale
    disabled={!canVote}
    leftLabel="Unnecessary"
    onSelect={(selectedValue) => vote(value.id, selectedValue as ProjectImportanceVoteValue)}
    options={options}
    rightLabel="Required"
    selectedValue={value.activeImportanceVote}
  />

  <div class="value-footer">
    <span>{scoreLabel} · {voteLabel}</span>
    <span>{value.authorUsername}</span>
  </div>
</article>

<style>
  .value-card {
    padding: 12px 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-md);
    background: var(--panel-strong);
    display: grid;
    gap: 10px;
  }

  .value-title {
    color: var(--text-main);
    line-height: 1.45;
    font-size: 14px;
  }

  .value-footer {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    color: var(--text-soft);
    font-size: 11px;
    opacity: 0.8;
  }
</style>