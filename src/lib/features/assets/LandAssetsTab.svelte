<script lang="ts">
  import type { LandAssetRecord } from '$lib/types/assets';

  export let landAssets: LandAssetRecord[];
  export let featureOpen = false;
</script>

<section class="asset-stack">
  <div class="intro-row">
    <h2>Land assets</h2>
    <span class={`status-pill ${featureOpen ? 'open' : 'closed'}`}>
      {featureOpen ? 'Open' : 'Closed preview'}
    </span>
  </div>

  <ul class="asset-list">
    {#each landAssets as asset}
      <li>
        <a class="asset-card" href={`/platform/assets/${asset.slug}`}>
          <div class="asset-card-top">
            <div class="asset-copy">
              <span class="asset-title">{asset.title}</span>
              <span class="asset-summary">{asset.stewardshipNote}</span>
            </div>

            <span class="open-copy">Open land asset</span>
          </div>

          <div class="asset-metrics">
            <span class="asset-chip">{asset.sizeLabel}</span>
            <span class="asset-chip">{asset.locationLabel}</span>
            <span class="asset-chip">{asset.attachedAssets.length} attached assets</span>
            <span class="asset-chip">{asset.managementProjects.length} management project{asset.managementProjects.length === 1 ? '' : 's'}</span>
          </div>
        </a>
      </li>
    {/each}
  </ul>
</section>

<style>
  .asset-stack,
  .asset-list {
    display: grid;
    gap: 12px;
  }

  .intro-row {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .asset-list {
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .asset-card,
  .asset-card-top,
  .asset-copy,
  .asset-metrics {
    display: grid;
    gap: 10px;
  }

  .asset-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background:
      radial-gradient(circle at top right, color-mix(in srgb, var(--brand-soft) 58%, transparent), transparent 42%),
      var(--panel);
    text-decoration: none;
    transition:
      transform 140ms ease,
      border-color 140ms ease,
      box-shadow 140ms ease;
  }

  .asset-card:hover,
  .asset-card:focus-visible {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--brand) 40%, var(--panel-border));
    box-shadow: 0 16px 30px color-mix(in srgb, var(--brand) 12%, transparent);
  }

  .asset-card-top {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }

  .asset-metrics {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  h2,
  .asset-title {
    color: var(--text-main);
  }

  .asset-title {
    font-size: 16px;
    font-weight: 700;
  }

  .asset-summary {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.55;
  }

  .asset-chip {
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid var(--panel-border);
    background: color-mix(in srgb, white 70%, var(--panel));
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
  }

  .open-copy {
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
  }

  .status-pill {
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid var(--panel-border);
    font-size: 11px;
    font-weight: 700;
  }

  .status-pill.closed {
    background: color-mix(in srgb, var(--accent-warm) 18%, var(--panel));
    color: var(--accent-warm-strong);
  }

  .status-pill.open {
    background: color-mix(in srgb, var(--brand-soft) 70%, var(--panel));
    color: var(--brand-strong);
  }

  @media (max-width: 760px) {
    .asset-card-top {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>