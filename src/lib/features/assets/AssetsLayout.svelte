<script lang="ts">
  import FundsTab from '$lib/features/assets/FundsTab.svelte';
  import LandAssetsTab from '$lib/features/assets/LandAssetsTab.svelte';
  import type { PlatformAssetsPageData } from '$lib/types/assets';
  import type { ScopePageData } from '$lib/types/scope';

  export let scope: ScopePageData;
  export let assets: PlatformAssetsPageData;

  let activeTab: 'land' | 'funds' = 'land';
</script>

<section class="assets-page">
  <div class="header-card">
    <div class="badge-row">
      <span class="badge">Platform feature</span>
      <span class={`badge ${assets.featureOpen ? 'open' : 'closed'}`}>
        {assets.featureOpen ? 'Open' : 'Closed preview'}
      </span>
    </div>

    <div class="header-copy">
      <h1>{scope.title} Assets</h1>
      <p>{assets.intro}</p>
      {#if !assets.featureOpen}
        <p class="note">
          Acquisition and conversion are still locked in the current beta. This page shows the intended structure now so land, storage, and fund flows can be designed before the live asset registry opens.
        </p>
      {/if}
    </div>
  </div>

  <div class="tab-row">
    <button class:active={activeTab === 'land'} class="tab-chip" type="button" on:click={() => (activeTab = 'land')}>
      Land Assets
    </button>
    <button class:active={activeTab === 'funds'} class="tab-chip" type="button" on:click={() => (activeTab = 'funds')}>
      Funds
    </button>
  </div>

  {#if activeTab === 'land'}
    <LandAssetsTab landAssets={assets.landAssets} featureOpen={assets.featureOpen} />
  {:else}
    <FundsTab funds={assets.funds} featureOpen={assets.featureOpen} />
  {/if}
</section>

<style>
  .assets-page,
  .header-card,
  .header-copy {
    display: grid;
    gap: 14px;
  }

  .header-card {
    padding: 18px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background:
      radial-gradient(circle at top right, color-mix(in srgb, var(--brand-soft) 60%, transparent), transparent 48%),
      var(--panel);
  }

  .badge-row,
  .tab-row {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .badge,
  .tab-chip {
    padding: 7px 11px;
    border-radius: 999px;
    border: 1px solid var(--panel-border);
    font-size: 12px;
    font-weight: 700;
  }

  .badge {
    background: var(--panel-strong);
    color: var(--text-soft);
  }

  .badge.open,
  .tab-chip.active {
    background: color-mix(in srgb, var(--brand-soft) 75%, var(--panel));
    color: var(--brand-strong);
    border-color: color-mix(in srgb, var(--brand) 40%, var(--panel-border));
  }

  .badge.closed {
    background: color-mix(in srgb, var(--accent-warm) 18%, var(--panel));
    color: var(--accent-warm-strong);
    border-color: color-mix(in srgb, var(--accent-warm) 36%, var(--panel-border));
  }

  .tab-chip {
    background: var(--panel);
    color: var(--text-soft);
  }

  h1 {
    margin: 0;
    color: var(--text-main);
    font-size: 20px;
  }

  p {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.6;
  }

  .note {
    padding: 12px 14px;
    border: 1px solid color-mix(in srgb, var(--accent-warm) 34%, var(--panel-border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--accent-warm) 10%, var(--panel));
  }
</style>