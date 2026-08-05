<script lang="ts">
  import {
    softwareLicenseGuidanceBody,
    softwareLicenseGuidanceTitle,
    softwareLicenseGuidanceWhy,
    SOFTWARE_LICENSE_DEFAULT_LABEL
  } from '$lib/copy/softwareLicensePolicy';

  export let compact = false;
  let detailsOpen = false;
</script>

<aside class="license-notice" aria-label="Software license guidance">
  <div class="license-head">
    <strong>License: {SOFTWARE_LICENSE_DEFAULT_LABEL}</strong>
    <button
      class="help-trigger"
      type="button"
      aria-expanded={detailsOpen}
      on:click={() => (detailsOpen = !detailsOpen)}
    >
      {detailsOpen ? 'Hide why' : 'Why this license?'}
    </button>
  </div>
  {#if !compact}
    <p>{softwareLicenseGuidanceTitle}</p>
  {/if}
  {#if detailsOpen || !compact}
    <p>{softwareLicenseGuidanceBody}</p>
    <ul>
      {#each softwareLicenseGuidanceWhy as reason}
        <li>{reason}</li>
      {/each}
    </ul>
  {/if}
</aside>

<style>
  .license-notice {
    display: grid;
    gap: 8px;
    padding: 12px 14px;
    border: 1px solid color-mix(in srgb, var(--brand) 28%, var(--panel-border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--brand-soft) 45%, var(--panel));
  }

  .license-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .license-notice strong {
    color: var(--text-main);
    font-size: 13px;
    font-weight: 700;
  }

  .help-trigger {
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
    color: var(--brand-strong);
    font: inherit;
    font-size: 12px;
    font-weight: 700;
    padding: 4px 10px;
    cursor: pointer;
  }

  .license-notice p,
  .license-notice li {
    margin: 0;
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.45;
  }

  .license-notice ul {
    margin: 0;
    padding-left: 18px;
    display: grid;
    gap: 4px;
  }
</style>
