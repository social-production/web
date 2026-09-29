<script lang="ts">
  import {
    softwareLicenseGuidanceBody,
    softwareLicenseGuidanceTitle,
    softwareLicenseGuidanceWhy,
    SOFTWARE_LICENSE_DEFAULT_LABEL
  } from '$lib/copy/softwareLicensePolicy';

  export let compact = false;
</script>

<aside class="license-notice" aria-label="Software license guidance">
  <strong>License: {SOFTWARE_LICENSE_DEFAULT_LABEL}</strong>
  {#if !compact}
    <p>{softwareLicenseGuidanceTitle}</p>
  {/if}
  <p>{softwareLicenseGuidanceBody}</p>
  <ul>
    {#each softwareLicenseGuidanceWhy as reason}
      <li>{reason}</li>
    {/each}
  </ul>
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

  .license-notice strong {
    color: var(--text-main);
    font-size: 13px;
    font-weight: 700;
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
