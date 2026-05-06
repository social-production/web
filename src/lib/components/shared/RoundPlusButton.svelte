<script lang="ts">
  export let active = false;
  export let ariaLabel = 'Add item';
  export let action: () => void = () => {};
</script>

<button
  aria-label={ariaLabel}
  aria-pressed={active}
  class:active
  class="round-plus-button"
  type="button"
  on:click={action}
>
  +
</button>

<style>
  .round-plus-button {
    width: 40px;
    height: 40px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
    color: var(--text-main);
    font-size: 24px;
    line-height: 1;
    display: grid;
    place-items: center;
    transition: border-color 0.12s ease, background 0.12s ease, box-shadow 0.12s ease;
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