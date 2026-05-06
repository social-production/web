<script lang="ts">
  type ScaleOption = {
    value: number;
    label: string;
  };

  export let options: ScaleOption[] = [];
  export let selectedValue = 0;
  export let disabled = false;
  export let leftLabel = '';
  export let rightLabel = '';
  export let onSelect: (value: number) => void = () => {};
</script>

<div class="scale">
  <div aria-label={`${leftLabel} to ${rightLabel}`} class="track" role="group">
    {#each options as option}
      <button
        aria-label={option.label}
        class:filled={selectedValue >= option.value}
        class:selected={selectedValue === option.value}
        class="notch"
        disabled={disabled}
        title={option.label}
        type="button"
        on:click={() => onSelect(option.value)}
      ></button>
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
    gap: 8px;
  }

  .track {
    display: grid;
    grid-template-columns: repeat(10, minmax(0, 1fr));
    gap: 6px;
  }

  .notch {
    min-height: 16px;
    padding: 0;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel);
  }

  .notch:hover:not(:disabled),
  .notch.filled {
    border-color: color-mix(in srgb, var(--brand) 34%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 74%, var(--panel));
  }

  .notch.selected {
    border-color: var(--brand);
    background: var(--brand);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 28%, transparent);
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