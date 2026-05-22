<script lang="ts">
  import AssetOverviewCard from '$lib/features/assets/components/AssetOverviewCard.svelte';
  import LandAssetInventoryTab from '$lib/features/assets/components/LandAssetInventoryTab.svelte';
  import LandAssetProjectsTab from '$lib/features/assets/components/LandAssetProjectsTab.svelte';
  import AssetProvenanceTimelineSection from '$lib/features/assets/components/AssetProvenanceTimelineSection.svelte';
  import type { LandAssetRecord } from '$lib/types/assets';
  import type { ScopePageData } from '$lib/types/scope';

  export let scope: ScopePageData;
  export let asset: LandAssetRecord;

  let activeTab: 'overview' | 'projects' | 'inventory' | 'history' = 'overview';
</script>

<section class="asset-detail-page">
  <a class="back-link" href="/platform/assets">Back to {scope.title} assets</a>

  <div class="top-tab-row" role="tablist" aria-label="Land asset tabs">
    <button class:active-tab={activeTab === 'overview'} class="top-tab" role="tab" type="button" on:click={() => (activeTab = 'overview')}>
      Overview
    </button>
    <button class:active-tab={activeTab === 'projects'} class="top-tab" role="tab" type="button" on:click={() => (activeTab = 'projects')}>
      Projects
    </button>
    <button class:active-tab={activeTab === 'inventory'} class="top-tab" role="tab" type="button" on:click={() => (activeTab = 'inventory')}>
      Inventory
    </button>
    <button class:active-tab={activeTab === 'history'} class="top-tab" role="tab" type="button" on:click={() => (activeTab = 'history')}>
      History
    </button>
  </div>

  {#if activeTab === 'overview'}
    <AssetOverviewCard {asset} />
  {:else if activeTab === 'projects'}
    <LandAssetProjectsTab {asset} />
  {:else if activeTab === 'inventory'}
    <LandAssetInventoryTab {asset} />
  {:else}
    <AssetProvenanceTimelineSection entries={asset.governance.provenanceTimeline} />
  {/if}
</section>

<style>
  .asset-detail-page {
    display: grid;
    gap: 14px;
  }

  .back-link {
    font-size: 12px;
    font-weight: 700;
    color: var(--brand-strong);
  }

  .top-tab-row {
    display: inline-flex;
    gap: 8px;
    width: fit-content;
    padding: 2px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .top-tab {
    min-width: 108px;
    padding: 9px 14px;
    border: 1px solid transparent;
    border-radius: calc(var(--radius-sm) - 2px);
    background: transparent;
    color: var(--text-soft);
    font-size: 13px;
    font-weight: 700;
  }

  .top-tab.active-tab {
    background: color-mix(in srgb, var(--brand-soft) 75%, var(--panel));
    color: var(--brand-strong);
    border-color: color-mix(in srgb, var(--brand) 40%, var(--panel-border));
  }
</style>