<script lang="ts">
  export let active = false;
  export let label = '';
  export let ariaLabel = 'Add item';
  export let participationAction: string | undefined = undefined;
  export let action: (event?: MouseEvent) => unknown = () => {};

  $: resolvedAriaLabel = label || ariaLabel;
</script>

<button
  aria-label={resolvedAriaLabel}
  aria-pressed={active}
  class:active
  class:with-label={Boolean(label)}
  class="round-plus-button"
  data-participation-action={participationAction}
  type="button"
  on:click={(event) => action(event)}
>
  <span aria-hidden="true" class="plus-glyph">+</span>
  {#if label}
    <span class="plus-label">{label}</span>
  {/if}
</button>

<style>
  .round-plus-button {
    height: 40px;
    min-width: 40px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
    color: var(--text-main);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0;
    transition: border-color 0.12s ease, background 0.12s ease, box-shadow 0.12s ease;
  }

  .round-plus-button.with-label {
    padding: 0 14px 0 10px;
  }

  .plus-glyph {
    font-size: 24px;
    line-height: 1;
  }

  .plus-label {
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
  }

  .round-plus-button:hover,
  .round-plus-button:focus-visible,
  .round-plus-button.active {
    border-color: color-mix(in srgb, var(--brand) 45%, var(--panel-border));
    background: var(--brand-soft);
    color: var(--brand-strong);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 20%, transparent);
  }
</style>
