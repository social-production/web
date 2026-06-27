<script lang="ts">
  export let forId: string | undefined = undefined;
  export let required = true;
</script>

{#if forId}
  <label class="field-label" for={forId}>
    <slot />
    {#if required}
      <span class="required-marker" aria-hidden="true">*</span>
      <span class="sr-only"> (required)</span>
    {/if}
  </label>
{:else}
  <span class="field-label">
    <slot />
    {#if required}
      <span class="required-marker" aria-hidden="true">*</span>
      <span class="sr-only"> (required)</span>
    {/if}
  </span>
{/if}

<style>
  .field-label {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    font-size: 12px;
    font-weight: 700;
    color: var(--text-soft);
  }

  .required-marker {
    color: var(--accent-warm-strong);
    font-weight: 800;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
