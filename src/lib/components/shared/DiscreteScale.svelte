<script lang="ts">
  type ScaleOption = {
    value: number;
    label: string;
  };

  export let options: ScaleOption[] = [];
  export let selectedValue = 0;
  export let averageValue = 0;
  export let disabled = false;
  export let leftLabel = '';
  export let rightLabel = '';
  export let onSelect: (value: number) => void = () => {};

  $: hasUserVote = selectedValue > 0;
  $: roundedAverage = averageValue > 0 ? Math.round(averageValue) : 0;
</script>

<div class="scale">
  <div
    aria-label={`${leftLabel} to ${rightLabel}. Tap a number from 1 to 10.`}
    class="track"
    role="group"
  >
    {#each options as option}
      <button
        aria-label={option.label}
        aria-pressed={hasUserVote && selectedValue === option.value}
        class:average={roundedAverage === option.value && selectedValue !== option.value}
        class:filled={roundedAverage > 0 && roundedAverage >= option.value && selectedValue !== option.value}
        class:selected={hasUserVote && selectedValue === option.value}
        class="notch"
        disabled={disabled}
        title={option.label}
        type="button"
        on:click={() => onSelect(option.value)}
      >
        {option.value}
      </button>
    {/each}
  </div>

  <div class="labels">
    <span>{leftLabel}</span>
    <span>{rightLabel}</span>
  </div>
</div>

<style>
  .scale {
    display: grid;
    gap: 6px;
  }

  .track {
    display: grid;
    grid-template-columns: repeat(10, minmax(0, 1fr));
    gap: 2px;
    padding: 2px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel);
    overflow: hidden;
  }

  .notch {
    min-height: 32px;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
  }

  .notch:hover:not(:disabled) {
    background: color-mix(in srgb, var(--brand-soft) 55%, transparent);
    color: var(--text-main);
  }

  .notch.filled {
    background: color-mix(in srgb, var(--brand-soft) 82%, var(--panel));
    color: var(--text-main);
  }

  .notch.average {
    background: color-mix(in srgb, var(--text-soft) 28%, var(--panel));
  }

  .notch.selected {
    background: var(--brand);
    color: var(--page-bg);
  }

  .labels {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    color: var(--text-soft);
    font-size: 11px;
    line-height: 1.3;
  }
</style>
