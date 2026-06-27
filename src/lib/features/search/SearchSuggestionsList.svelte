<script lang="ts">
  import { searchKindLabels } from '$lib/features/search/searchKinds';
  import type { SearchResultItem } from '$lib/types/search';

  export let results: SearchResultItem[] = [];
  export let loading = false;
  export let emptyMessage = 'No matches yet. Try a channel, project, or username.';
  export let onSelect: ((href: string) => void) | undefined = undefined;
  export let overlay = false;
</script>

{#if loading}
  <div class="suggestions-panel" class:overlay role="status">
    <p>Searching…</p>
  </div>
{:else if results.length > 0}
  <div class="suggestions-panel" class:overlay role="listbox">
    {#each results as result (result.id)}
      {#if onSelect}
        <button class="suggestion-row" type="button" on:click={() => onSelect(result.href)}>
          <span class="kind-chip">{searchKindLabels[result.kind]}</span>
          <span class="suggestion-copy">
            <strong>{result.title}</strong>
            <span>{result.meta}</span>
          </span>
        </button>
      {:else}
        <a class="suggestion-row" href={result.href}>
          <span class="kind-chip">{searchKindLabels[result.kind]}</span>
          <span class="suggestion-copy">
            <strong>{result.title}</strong>
            <span>{result.meta}</span>
          </span>
        </a>
      {/if}
    {/each}
  </div>
{:else}
  <div class="suggestions-panel muted" class:overlay role="status">
    <p>{emptyMessage}</p>
  </div>
{/if}

<style>
  .suggestions-panel {
    display: grid;
    gap: 0;
    margin-top: 6px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    overflow: hidden;
    box-shadow: 0 10px 28px color-mix(in srgb, var(--text-main) 12%, transparent);
  }

  .suggestions-panel.overlay {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 120;
    margin-top: 0;
    max-height: min(60vh, 420px);
    overflow-y: auto;
  }

  .suggestions-panel.muted p,
  .suggestions-panel[role='status'] p {
    margin: 0;
    padding: 12px 14px;
    color: var(--text-soft);
    font-size: 13px;
  }

  .suggestion-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    width: 100%;
    padding: 10px 12px;
    border: 0;
    border-bottom: 1px solid var(--panel-border);
    background: transparent;
    color: inherit;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }

  .suggestion-row:last-child {
    border-bottom: 0;
  }

  .suggestion-row:hover,
  .suggestion-row:focus-visible {
    background: var(--panel-soft);
  }

  .kind-chip {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: 999px;
    background: var(--brand-soft);
    color: var(--brand-strong);
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
  }

  .suggestion-copy {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .suggestion-copy strong {
    font-size: 14px;
    color: var(--text-main);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .suggestion-copy span {
    font-size: 12px;
    color: var(--text-soft);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
