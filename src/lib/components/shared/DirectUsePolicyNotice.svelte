<script lang="ts">
  import {
    directUsePolicyCore,
    directUsePolicyEventCreate,
    directUsePolicyText,
    type DirectUsePolicyVariant
  } from '$lib/copy/directUsePolicy';

  export let variant: DirectUsePolicyVariant = 'create';
  export let context: 'project' | 'event' | 'help' | 'service' = 'project';
</script>

<aside class="policy-notice" aria-label="Direct-use policy">
  <strong>Direct use only — no commercial activity</strong>
  <p>
    {#if context === 'event'}
      {directUsePolicyEventCreate}
    {:else}
      {directUsePolicyText(variant)}
    {/if}
  </p>
  <p class="policy-core">{directUsePolicyCore}</p>
</aside>

<style>
  .policy-notice {
    display: grid;
    gap: 6px;
    padding: 12px 14px;
    border: 1px solid color-mix(in srgb, var(--brand) 28%, var(--panel-border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--brand-soft) 45%, var(--panel));
  }

  .policy-notice strong {
    color: var(--text-main);
    font-size: 13px;
    font-weight: 700;
  }

  .policy-notice p {
    margin: 0;
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.45;
  }

  .policy-core {
    font-size: 11px;
  }
</style>
