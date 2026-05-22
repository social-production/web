<script lang="ts">
  import type { AssetAttachedRecord } from '$lib/types/assets';

  export let assets: AssetAttachedRecord[] = [];
</script>

{#if assets.length > 0}
  <section class="asset-stack">
    <div class="section-heading">
      <h2>Assets</h2>
    </div>

    <ul class="asset-list">
      {#each assets as asset}
        <li class="asset-item">
          {#if asset.href}
            <a class="asset-link" href={asset.href}>
              <span class="asset-title-row">
                <span class="asset-title">{asset.title}</span>
                {#if asset.quantityLabel}
                  <span class="asset-count">{asset.quantityLabel}</span>
                {/if}
              </span>
              <span class="asset-meta">Current location: {asset.currentLocationLabel ?? asset.locationLabel}</span>
              {#if asset.totalQuantity && asset.totalQuantity > 1}
                <span class="asset-meta">{asset.availableQuantity ?? asset.totalQuantity} of {asset.totalQuantity} available</span>
              {/if}
            </a>
          {:else}
            <span class="asset-link muted-open-copy">
              <span class="asset-title-row">
                <span class="asset-title">{asset.title}</span>
                {#if asset.quantityLabel}
                  <span class="asset-count">{asset.quantityLabel}</span>
                {/if}
              </span>
              <span class="asset-meta">Current location: {asset.currentLocationLabel ?? asset.locationLabel}</span>
              {#if asset.totalQuantity && asset.totalQuantity > 1}
                <span class="asset-meta">{asset.availableQuantity ?? asset.totalQuantity} of {asset.totalQuantity} available</span>
              {/if}
            </span>
          {/if}
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .asset-stack,
  .asset-list {
    display: grid;
    gap: 12px;
  }

  .asset-list {
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .asset-item {
    border-top: 1px solid var(--panel-border);
  }

  .asset-item:first-child {
    border-top: 0;
  }

  .asset-link {
    display: grid;
    gap: 2px;
    padding: 12px 0;
    text-decoration: none;
    transition: color 120ms ease;
  }

  .asset-title-row {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  .asset-link:hover .asset-title,
  .asset-link:focus-visible .asset-title {
    color: var(--brand-strong);
  }

  .asset-count {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  h2,
  .asset-title {
    margin: 0;
    color: var(--text-main);
  }

  .asset-meta,
  .asset-link {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.6;
  }

  .muted-open-copy {
    color: var(--text-soft);
  }
</style>
