<script lang="ts">
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
    <div class="chip-row wrap-row">
      {#each selectedItems as item}
        <button class="toggle-chip active" type="button" on:click={() => onRemove(item.key)}>
          {item.label} x
        </button>
      {/each}
    </div>
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
    {#if suggestionItems.length > 0}
      <div class="suggestion-row">
        {#each suggestionItems as item}
          <button class="suggestion-chip" type="button" on:click={() => onAdd(item.key)}>
            {item.label}
          </button>
        {/each}
      </div>
    {/if}
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

  .chip-row {
    display: flex;
    gap: 8px;
  }

  .wrap-row {
    flex-wrap: wrap;
  }

  .token-input-stack,
  .suggestion-row {
    display: grid;
    gap: 8px;
  }

  .suggestion-row {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .suggestion-chip {
    padding: 8px 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    text-align: left;
  }

  .helper-text {
    margin: 8px 0 0;
    color: var(--text-soft);
    line-height: 1.45;
  }
</style>
