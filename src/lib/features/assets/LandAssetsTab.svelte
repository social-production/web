<script lang="ts">
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import type { LandAssetRecord } from '$lib/types/assets';

  export let landAssets: LandAssetRecord[];
  export let featureOpen = false;
</script>

<section class="asset-stack">
  <div class="panel-copy intro-card">
    <h2>Land assets</h2>
    <p>Every land asset is a record in the platform commons. Open a land card to inspect the stewardship service, storage services, and projects attached to that site.</p>
  </div>

  <div class="asset-grid">
    {#each landAssets as asset}
      <FeedSurface href={`/platform/assets/${asset.slug}`} tone="public">
        <div class="asset-card-shell">
          <div class="asset-card-main">
            <div class="detail-header">
              <div>
                <div class="card-badge-row">
                  <span class={`status-badge ${featureOpen ? 'open' : 'closed'}`}>
                    {featureOpen ? 'Active registry' : 'Closed preview'}
                  </span>
                  <span class="acreage-badge">{asset.acreageLabel}</span>
                </div>
                <h3>{asset.title}</h3>
                <p>{asset.locationLabel}</p>
              </div>
            </div>

            <p class="stewardship-note">{asset.stewardshipNote}</p>

            <span class="open-copy">Open land record</span>
          </div>

          <div class="stat-grid">
            <div class="stat-card">
              <strong>{asset.managementProjects.length}</strong>
              <span>Land management services</span>
            </div>
            <div class="stat-card">
              <strong>{asset.storageProjects.length}</strong>
              <span>Storage services</span>
            </div>
            <div class="stat-card">
              <strong>{asset.linkedProjects.length}</strong>
              <span>Linked projects</span>
            </div>
          </div>
        </div>
      </FeedSurface>
    {/each}
  </div>
</section>

<style>
  .asset-stack,
  .asset-grid,
  .asset-card-shell,
  .asset-card-main,
  .panel-copy,
  .stat-grid {
    display: grid;
    gap: 12px;
  }

  .asset-grid {
    grid-template-columns: 1fr;
  }

  .intro-card,
  .stat-card {
    padding: 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .asset-card-shell {
    min-height: 100%;
    grid-template-columns: minmax(0, 1.4fr) minmax(240px, 0.9fr);
    align-items: start;
  }

  h2,
  h3,
  strong {
    color: var(--text-main);
  }

  p,
  span {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.55;
  }

  .detail-header,
  .card-badge-row {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .detail-header {
    justify-content: space-between;
  }

  .status-badge,
  .acreage-badge {
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid var(--panel-border);
    font-size: 11px;
    font-weight: 700;
  }

  .acreage-badge {
    background: var(--panel-strong);
  }

  .status-badge.closed {
    background: color-mix(in srgb, var(--accent-warm) 18%, var(--panel));
    color: var(--accent-warm-strong);
  }

  .status-badge.open {
    background: color-mix(in srgb, var(--brand-soft) 70%, var(--panel));
    color: var(--brand-strong);
  }

  .stewardship-note {
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .stat-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .stat-card {
    gap: 6px;
    background: var(--panel-strong);
  }

  .open-copy {
    font-size: 12px;
    font-weight: 700;
    color: var(--brand-strong);
  }

  @media (max-width: 900px) {
    .asset-card-shell,
    .stat-grid {
      grid-template-columns: 1fr;
    }
  }
</style>