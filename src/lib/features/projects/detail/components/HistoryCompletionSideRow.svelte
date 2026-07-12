<script lang="ts">
  import type { ProjectServiceHistoryCompletionChoice } from '$lib/types/detail';

  export let label: string;
  export let viewerCanSet = false;
  export let viewerSelection: ProjectServiceHistoryCompletionChoice | null = null;
  export let onSelect: (choice: ProjectServiceHistoryCompletionChoice) => void = () => {};

  function isActive(choice: ProjectServiceHistoryCompletionChoice) {
    return viewerSelection === choice;
  }

  function handleSelect(choice: ProjectServiceHistoryCompletionChoice) {
    if (isActive(choice)) {
      return;
    }

    onSelect(choice);
  }
</script>

{#if viewerCanSet}
  <div class="completion-side-row">
    <span class="completion-side-label">{label}</span>
    <div class="completion-actions">
      <button
        class:selected={isActive('completed')}
        class="vote-chip"
        type="button"
        on:click={() => handleSelect('completed')}
      >
        Completed
      </button>
      <button
        class:selected={isActive('uncompleted')}
        class="vote-chip negative"
        type="button"
        on:click={() => handleSelect('uncompleted')}
      >
        Uncompleted
      </button>
    </div>
  </div>
{/if}

<style>
  .completion-side-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .completion-side-label {
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
  }

  .completion-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .vote-chip {
    padding: 7px 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .vote-chip.selected {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .vote-chip.negative.selected {
    border-color: color-mix(in srgb, var(--status-red, #c44) 50%, var(--panel-border));
    background: color-mix(in srgb, var(--status-red, #c44) 12%, var(--panel));
    color: var(--status-red, #c44);
  }
</style>
