<script lang="ts">
  import DiscreteScale from '$lib/components/shared/DiscreteScale.svelte';
  import type { ProjectImportanceVoteValue, ProjectValueItem } from '$lib/types/detail';

  export let value: ProjectValueItem;
  export let canVote = false;
  export let options: Array<{ value: ProjectImportanceVoteValue; label: string }> = [];
  export let vote: (valueId: string, voteValue: ProjectImportanceVoteValue) => void = () => {};

  let localVote = value.activeImportanceVote;
  let heldVote: ProjectImportanceVoteValue | 0 | null = null;

  $: if (heldVote == null || value.activeImportanceVote === heldVote) {
    localVote = value.activeImportanceVote;
    heldVote = null;
  }

  $: hasUserVote = localVote > 0;
  $: averageLabel =
    value.voteCount === 0
      ? 'No community rating yet'
      : `Community average: ${value.importanceScore.toFixed(1).replace(/\.0$/, '')}/10`;
  $: userVoteLabel = hasUserVote
    ? `Your vote: ${localVote}/10`
    : 'Vote to rate this value';
  $: voteLabel = `${value.voteCount} vote${value.voteCount === 1 ? '' : 's'}`;
</script>

<article class="value-card" data-participation-action={canVote && !hasUserVote ? 'rate-value' : undefined}>
  <strong class="value-title">{value.label}</strong>

  <DiscreteScale
    averageValue={hasUserVote ? value.importanceScore : 0}
    disabled={!canVote}
    leftLabel="Unnecessary"
    onSelect={(selectedValue) => {
      const next = selectedValue as ProjectImportanceVoteValue;
      localVote = next;
      heldVote = next;
      vote(value.id, next);
    }}
    options={options}
    rightLabel="Required"
    selectedValue={localVote}
  />

  <div class="value-footer">
    <span>{userVoteLabel}{#if hasUserVote && value.voteCount > 0} · {averageLabel}{/if}</span>
    <span>{voteLabel} · {value.authorUsername}</span>
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
