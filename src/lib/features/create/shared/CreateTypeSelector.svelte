<script lang="ts">
  import type { CreateTypeOption } from './createTypeSelector';

  export let label: string;
  export let selected: string;
  export let options: CreateTypeOption<string>[] = [];
  export let name = 'create-type';
  export let showDetailPanel = true;

  $: selectedOption = options.find((option) => option.value === selected) ?? options[0];
</script>

<div class="type-selector">
  <span class="type-selector-label" id="{name}-label">{label}</span>
  <div class="type-options" role="radiogroup" aria-labelledby="{name}-label">
    {#each options as option (option.value)}
      <button
        type="button"
        class="type-option"
        class:active={selected === option.value}
        role="radio"
        aria-checked={selected === option.value}
        on:click={() => (selected = option.value)}
      >
        <span class="type-option-title">{option.label}</span>
        <span class="type-option-summary">{option.summary}</span>
      </button>
    {/each}
  </div>

  {#if showDetailPanel && selectedOption}
    <div class="type-detail-panel">
      <p class="type-detail-summary">{selectedOption.summary}</p>
      {#if selectedOption.bestFor?.length}
        <div class="type-detail-block">
          <span class="type-detail-heading">Best for</span>
          <ul class="type-detail-list">
            {#each selectedOption.bestFor as item}
              <li>{item}</li>
            {/each}
          </ul>
        </div>
      {/if}
      {#if selectedOption.lifecycleNote}
        <p class="type-detail-lifecycle">{selectedOption.lifecycleNote}</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .type-selector {
    display: grid;
    gap: 12px;
  }

  .type-selector-label {
    display: block;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-main);
  }

  .type-options {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .type-option {
    display: grid;
    gap: 6px;
    min-height: 44px;
    width: 100%;
    padding: 14px;
    text-align: left;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    cursor: pointer;
    transition: border-color 0.12s ease, background 0.12s ease;
  }

  .type-option:hover {
    border-color: color-mix(in srgb, var(--brand) 35%, var(--panel-border));
  }

  .type-option.active {
    border-color: var(--brand);
    background: var(--brand-soft);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 30%, transparent);
  }

  .type-option-title {
    color: var(--brand-strong);
    font-size: 14px;
    font-weight: 800;
  }

  .type-option-summary {
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.45;
  }

  .type-detail-panel {
    display: grid;
    gap: 10px;
    padding: 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .type-detail-summary,
  .type-detail-lifecycle {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.45;
  }

  .type-detail-block {
    display: grid;
    gap: 6px;
  }

  .type-detail-heading {
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .type-detail-list {
    margin: 0;
    padding-left: 18px;
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.45;
  }

  @media (max-width: 980px) {
    .type-options {
      grid-template-columns: 1fr;
    }
  }
</style>
