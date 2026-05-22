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
    <div class="header-topline">
      <h1>{scope.title} assets</h1>
      <span class={`status-pill ${assets.featureOpen ? 'open' : 'closed'}`}>
        {assets.featureOpen ? 'Open' : 'Closed preview'}
      </span>
    </div>

    <div class="header-copy">
      <p>{assets.intro}</p>
    </div>
  </div>

  <div class="top-tab-row" role="tablist" aria-label="Assets tabs">
    <button class:active-tab={activeTab === 'land'} class="top-tab" role="tab" type="button" on:click={() => (activeTab = 'land')}>
      Land Assets
    </button>
    <button class:active-tab={activeTab === 'funds'} class="top-tab" role="tab" type="button" on:click={() => (activeTab = 'funds')}>
      Collective Funds
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
    background: var(--panel);
  }

  .header-topline,
  .top-tab-row {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .header-topline {
    justify-content: space-between;
  }

  .status-pill,
  .top-tab {
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
  }

  .top-tab-row {
    display: inline-flex;
    width: fit-content;
    padding: 2px;
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .status-pill.open,
  .top-tab.active-tab {
    background: color-mix(in srgb, var(--brand-soft) 75%, var(--panel));
    color: var(--brand-strong);
    border-color: color-mix(in srgb, var(--brand) 40%, var(--panel-border));
  }

  .status-pill.closed {
    background: color-mix(in srgb, var(--accent-warm) 18%, var(--panel));
    color: var(--accent-warm-strong);
    border-color: color-mix(in srgb, var(--accent-warm) 36%, var(--panel-border));
  }

  .top-tab {
    min-width: 136px;
    background: transparent;
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
</style>