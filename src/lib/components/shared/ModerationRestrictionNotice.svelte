<script lang="ts">
  export let active = false;

  let revealed = false;

  $: blurContent = active && !revealed;
</script>

{#if active}
  <div class="restriction-notice">
    <span>Serious harm report — content blurred until you choose to reveal it.</span>
    <button class="reveal-btn" type="button" on:click={() => (revealed = !revealed)}>
      {revealed ? 'Hide again' : 'Reveal'}
    </button>
  </div>
{/if}

<div class:blurred={blurContent} class="restriction-body">
  <slot />
</div>

<style>
  .restriction-notice {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    margin-bottom: 10px;
    padding: 8px 10px;
    border: 1px solid color-mix(in srgb, var(--brand) 45%, var(--panel-border));
    border-radius: var(--radius-sm);
    background: var(--brand-soft);
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
  }

  .reveal-btn {
    padding: 4px 8px;
    border: 1px solid color-mix(in srgb, var(--brand) 45%, var(--panel-border));
    border-radius: 999px;
    background: var(--panel);
    color: var(--brand-strong);
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
  }

  .restriction-body.blurred {
    filter: blur(6px);
    user-select: none;
  }
</style>
