<script lang="ts">
  import type { ProjectInventoryFrameData } from '$lib/types/detail';

  export let frame: ProjectInventoryFrameData;

  export let requestedAssetQuantities: Record<string, number> = {};
  export let setRequestedQuantity: (assetId: string, quantity: number) => void = () => {};

  function requestedQuantity(assetId: string) {
    return requestedAssetQuantities[assetId] ?? 0;
  }

  function maxRequestableQuantity(asset: ProjectInventoryFrameData['assetGroups'][number]['assets'][number]) {
    return Math.max(asset.availableQuantity ?? asset.quantity ?? 1, 0);
  }

  function quantitySummary(asset: ProjectInventoryFrameData['assetGroups'][number]['assets'][number]) {
    if (!asset.quantity || asset.quantity <= 1) {
      return asset.availabilityLabel ?? asset.statusLabel;
    }

    return `${asset.availableQuantity ?? asset.quantity} of ${asset.quantity} available`;
  }
</script>

<section class="inventory-list">
  {#each frame.assetGroups as group}
    <section class="group-block">
      <h2>{group.title}</h2>

      {#if group.assets.length === 0}
        <p class="group-empty">No {group.kind === 'land-asset' ? 'land asset' : 'asset'} records are available yet.</p>
      {:else}
        <ul class="asset-items">
          {#each group.assets as asset}
            <li class={`asset-item ${group.kind}`}>
              <div class="asset-copy">
                {#if asset.href}
                  <a class="asset-link" href={asset.href}>{asset.title}</a>
                {:else}
                  <span class="asset-link muted">{asset.title}</span>
                {/if}

                {#if group.kind === 'land-asset'}
                  <span class="asset-meta">{asset.summary}</span>
                {:else if asset.locationLabel}
                  <span class="asset-meta">Current location: {asset.locationLabel}</span>
                {:else}
                  <span class="asset-meta">{asset.summary}</span>
                {/if}

                {#if group.kind === 'asset'}
                  <span class="asset-meta">{quantitySummary(asset)}</span>
                {/if}
              </div>

              {#if frame.canRequestAssets}
                <div class="asset-control">
                  {#if asset.quantity && asset.quantity > 1}
                    <button
                      aria-label={`Decrease requested quantity for ${asset.title}`}
                      class="quantity-button"
                      disabled={requestedQuantity(asset.id) === 0}
                      type="button"
                      on:click={() => setRequestedQuantity(asset.id, requestedQuantity(asset.id) - 1)}
                    >
                      -
                    </button>
                    <span class="quantity-value">{requestedQuantity(asset.id)}</span>
                    <button
                      aria-label={`Increase requested quantity for ${asset.title}`}
                      class="quantity-button"
                      disabled={requestedQuantity(asset.id) >= maxRequestableQuantity(asset)}
                      type="button"
                      on:click={() => setRequestedQuantity(asset.id, requestedQuantity(asset.id) + 1)}
                    >
                      +
                    </button>
                  {:else}
                    <input
                      aria-label={`Select ${asset.title}`}
                      checked={requestedQuantity(asset.id) > 0}
                      class="asset-checkbox"
                      type="checkbox"
                      on:change={() => setRequestedQuantity(asset.id, requestedQuantity(asset.id) > 0 ? 0 : 1)}
                    />
                  {/if}
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/each}
</section>

<style>
  .inventory-list,
  .group-block,
  .asset-copy,
  .asset-items {
    display: grid;
    gap: 12px;
  }

  .group-block {
    gap: 10px;
  }

  .asset-items {
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .asset-item {
    display: grid;
    gap: 12px;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    padding: 10px 0;
    border-top: 1px solid var(--panel-border);
  }

  .asset-item:first-child {
    border-top: 0;
  }

  .asset-item.land-asset {
    align-items: flex-start;
  }

  .asset-control {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    justify-content: flex-end;
    min-width: 84px;
  }

  h2,
  .asset-link {
    margin: 0;
    color: var(--text-main);
  }

  h2 {
    font-size: 14px;
    font-weight: 700;
  }

  .group-empty,
  .asset-meta {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.5;
  }

  .asset-link,
  .asset-link.muted {
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
  }

  .asset-link {
    color: var(--brand-strong);
  }

  .asset-link.muted,
  .asset-meta {
    color: var(--text-soft);
  }

  .quantity-button {
    width: 28px;
    height: 28px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
    color: var(--text-main);
    font-size: 16px;
    font-weight: 700;
    line-height: 1;
    display: grid;
    place-items: center;
  }

  .quantity-button:disabled {
    opacity: 0.45;
  }

  .quantity-value {
    min-width: 16px;
    text-align: center;
    color: var(--text-main);
    font-size: 13px;
    font-weight: 700;
  }

  @media (max-width: 760px) {
    .asset-item {
      align-items: flex-start;
    }
  }
</style>