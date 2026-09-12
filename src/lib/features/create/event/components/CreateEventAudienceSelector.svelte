<script lang="ts">
  import SuggestionList from '$lib/components/shared/SuggestionList.svelte';

  type SelectorItem = {
    key: string;
    label: string;
  };

  export let label: string;
  export let placeholder: string;
  export let helperText = '';
  export let query = '';
  export let selectedItems: SelectorItem[] = [];
  export let suggestionItems: SelectorItem[] = [];
  export let onAdd: (value: string) => void = () => {};
  export let onRemove: (value: string) => void = () => {};
  export let onCommitSingleSuggestion: (
    event: KeyboardEvent,
    suggestions: string[],
    handler: (value: string) => void
  ) => void = () => {};
</script>

<div>
  <span class="field-label">{label}</span>
  <div class="token-input-stack">
    {#if selectedItems.length > 0}
      <div class="selected-row" aria-label="Selected audience">
        {#each selectedItems as item}
          <button class="selected-chip" type="button" on:click={() => onRemove(item.key)}>
            <span>{item.label}</span>
            <span class="chip-remove" aria-hidden="true">×</span>
          </button>
        {/each}
      </div>
    {/if}
    <input
      bind:value={query}
      {placeholder}
      on:keydown={(event) =>
        onCommitSingleSuggestion(
          event,
          suggestionItems.map((item) => item.key),
          onAdd
        )}
    />
    <SuggestionList
      items={suggestionItems}
      {query}
      on:select={(event) => onAdd(event.detail.key)}
    />
  </div>
  {#if helperText}
    <p class="helper-text">{helperText}</p>
  {/if}
</div>

<style>
  .field-label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 700;
  }

  .token-input-stack {
    display: grid;
    gap: 8px;
  }

  .token-input-stack input {
    width: 100%;
    min-height: 40px;
    padding: 0 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-main);
  }

  .selected-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .selected-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px 4px 10px;
    border: 1px solid var(--brand);
    border-radius: 999px;
    background: var(--brand-soft);
    color: var(--text-main);
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }

  .chip-remove {
    color: var(--text-soft);
    font-size: 16px;
    line-height: 1;
  }

  .helper-text {
    margin: 8px 0 0;
    color: var(--text-soft);
    line-height: 1.45;
  }
</style>
