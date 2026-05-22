<script lang="ts">
  import AttachedAssetOverviewSection from '$lib/features/assets/components/AttachedAssetOverviewSection.svelte';
  import AssetProvenanceTimelineSection from '$lib/features/assets/components/AssetProvenanceTimelineSection.svelte';
  import AssetProjectRelationshipsSection from '$lib/features/assets/components/AssetProjectRelationshipsSection.svelte';
  import type { AssetAttachedRecord, LandAssetRecord } from '$lib/types/assets';
  import type { ScopePageData } from '$lib/types/scope';

  export let scope: ScopePageData;
  export let parentAsset: LandAssetRecord;
  export let asset: AssetAttachedRecord;

  let activeTab: 'overview' | 'projects' | 'history' = 'overview';

  const projectSections = [
    {
      title: 'Stewardship projects',
      description: 'These services keep the attached asset placed, maintained, and accountable under its parent land record.',
      projects: asset.managementProjects
    },
    {
      title: 'Storage projects',
      description: 'Storage services can hold this attached asset between active use windows while the home land record stays the root location.',
      projects: asset.storageProjects
    },
    {
      title: 'Projects using this asset',
      description: 'These seeded links show which current projects depend on this attached asset today.',
      projects: asset.linkedProjects
    }
  ].filter((section) => section.projects.length > 0);
</script>

<section class="asset-detail-page">
  <div class="back-links">
    <a class="back-link" href={`/platform/assets/${parentAsset.slug}`}>Back to {parentAsset.title}</a>
    <a class="back-link muted-link" href="/platform/assets">Back to {scope.title} assets</a>
  </div>

  <div class="top-tab-row" role="tablist" aria-label="Asset tabs">
    <button class:active-tab={activeTab === 'overview'} class="top-tab" role="tab" type="button" on:click={() => (activeTab = 'overview')}>
      Overview
    </button>
    <button class:active-tab={activeTab === 'projects'} class="top-tab" role="tab" type="button" on:click={() => (activeTab = 'projects')}>
      Projects
    </button>
    <button class:active-tab={activeTab === 'history'} class="top-tab" role="tab" type="button" on:click={() => (activeTab = 'history')}>
      History
    </button>
  </div>

  {#if activeTab === 'overview'}
    <AttachedAssetOverviewSection {asset} />
  {:else if activeTab === 'projects'}
    {#each projectSections as section}
      <AssetProjectRelationshipsSection
        title={section.title}
        description={section.description}
        projects={section.projects}
      />
    {/each}
  {:else}
    <AssetProvenanceTimelineSection entries={asset.governance.provenanceTimeline} />
  {/if}
</section>

<style>
  .asset-detail-page {
    display: grid;
    gap: 14px;
  }

  .back-links {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
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

  .back-link {
    font-size: 12px;
    font-weight: 700;
    color: var(--brand-strong);
  }

  .muted-link {
    color: var(--text-soft);
  }
</style>
