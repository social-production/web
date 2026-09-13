<script lang="ts">
  export let label = '';
  export let glyph = '';
  export let active = false;
  export let standout = false;
  export let participationAction: string | undefined = undefined;
  export let onPress: () => void = () => {};
</script>

<button
  class="phase-shift-button"
  class:active
  class:standout
  data-participation-action={participationAction}
  type="button"
  on:click={onPress}
>
  <span aria-hidden="true" class="glyph">{glyph}</span>
  <span class="label">{label}</span>
</button>

<style>
  .phase-shift-button {
    height: 40px;
    min-width: 40px;
    padding: 0 14px 0 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
    color: var(--text-main);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: border-color 0.12s ease, background 0.12s ease, box-shadow 0.12s ease, color 0.12s ease;
  }

  .glyph {
    font-size: 22px;
    line-height: 1;
    font-weight: 700;
  }

  .label {
    white-space: nowrap;
  }

  .phase-shift-button:hover,
  .phase-shift-button:focus-visible,
  .phase-shift-button.active {
    border-color: color-mix(in srgb, var(--brand) 45%, var(--panel-border));
    background: var(--brand-soft);
    color: var(--brand-strong);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 20%, transparent);
  }

  .phase-shift-button.standout {
    border-color: var(--brand);
    background: var(--brand);
    color: var(--page-bg);
  }

  .phase-shift-button.standout:hover,
  .phase-shift-button.standout:focus-visible,
  .phase-shift-button.standout.active {
    border-color: var(--brand);
    background: var(--brand);
    color: var(--page-bg);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand) 18%, transparent);
  }
</style>
