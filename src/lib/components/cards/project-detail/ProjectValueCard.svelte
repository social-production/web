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
  $: needsVote = canVote && !hasUserVote;
  $: averageLabel =
    value.voteCount === 0
      ? 'No community rating yet'
      : `Community average: ${value.importanceScore.toFixed(1).replace(/\.0$/, '')}/10`;
  $: userVoteLabel = hasUserVote
    ? `Your vote: ${localVote}/10`
    : 'Vote to rate this value';
  $: voteLabel = `${value.voteCount} vote${value.voteCount === 1 ? '' : 's'}`;
</script>

<article
  class="value-card"
  class:needs-vote={needsVote}
  data-participation-action={needsVote ? 'rate-value' : undefined}
>
  <strong class="value-title">{value.label}</strong>

  {#if needsVote}
    <p class="value-prompt">Tap 1 if this does not matter, 10 if it is required.</p>
  {/if}

  <DiscreteScale
    averageValue={value.voteCount > 0 ? value.importanceScore : 0}
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
    <span class="value-footer-start">
      <span>{userVoteLabel}</span>
      {#if value.voteCount > 0}
        <span>{averageLabel}</span>
      {/if}
    </span>
    <span class="value-footer-end">
      <span>{voteLabel}</span>
      <span>{value.authorUsername}</span>
    </span>
  </div>
</article>

<style>
  .value-card {
    padding: 10px 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    display: grid;
    gap: 8px;
    box-shadow: inset 0 -1px 0 var(--panel-border);
    text-align: center;
    justify-items: stretch;
  }

  .value-card:last-child {
    box-shadow: none;
  }

  .value-card.needs-vote {
    padding: 12px 10px;
    border: 1px solid color-mix(in srgb, var(--brand) 42%, var(--panel-border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--brand-soft) 58%, var(--panel-strong));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 16%, transparent);
  }

  .value-title {
    color: var(--text-main);
    line-height: 1.45;
    font-size: 14px;
  }

  .value-card.needs-vote .value-title {
    font-size: 15px;
  }

  .value-prompt {
    margin: 0;
    color: var(--text-main);
    font-size: 12px;
    line-height: 1.4;
    font-weight: 600;
  }

  .value-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    color: var(--text-soft);
    font-size: 11px;
    opacity: 0.9;
    text-align: left;
  }

  .value-footer-start,
  .value-footer-end {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .value-footer-end {
    text-align: right;
    flex: 0 0 auto;
  }
</style>
