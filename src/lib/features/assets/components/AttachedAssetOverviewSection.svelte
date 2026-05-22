<script lang="ts">
  import type { AssetAttachedRecord } from '$lib/types/assets';

  export let asset: AssetAttachedRecord;

  function unitTone(label: string) {
    const normalized = label.toLowerCase();

    if (normalized.includes('available')) {
      return 'available';
    }

    if (normalized.includes('borrowed') || normalized.includes('reserved')) {
      return 'in-use';
    }

    return 'maintenance';
  }
</script>

<div class="overview-stack">
  <section class="overview-card">
    <h1>{asset.title}{asset.quantityLabel ? ` ${asset.quantityLabel}` : ''}</h1>
    <p>{asset.summary}</p>
    <div class="meta-stack">
      <div class="meta-row">
        <strong>Location</strong>
        {#if asset.currentLocationHref}
          <a class="detail-link" href={asset.currentLocationHref}>{asset.currentLocationLabel ?? asset.locationLabel}</a>
        {:else}
          <span>{asset.currentLocationLabel ?? asset.locationLabel}</span>
        {/if}
      </div>

      {#if asset.currentBorrowerLabel}
        <div class="meta-row">
          <strong>Borrowed by</strong>
          <a class="detail-link" href={`/profile/${asset.currentBorrowerLabel}`}>{asset.currentBorrowerLabel}</a>
        </div>
      {/if}
    </div>

    {#if asset.containedUnits && asset.containedUnits.length > 0}
      <section class="unit-section">
        <div class="unit-heading">
          <h2>Contained units</h2>
          <p>{asset.availableQuantity ?? asset.containedUnits.length} of {asset.totalQuantity ?? asset.containedUnits.length} available</p>
        </div>

        <ul class="unit-list">
          {#each asset.containedUnits as unit}
            <li class="unit-row">
              <div class="unit-copy">
                <strong>{unit.label}</strong>
                <span>{unit.locationLabel}</span>
                <span>{unit.summary}</span>
                {#if unit.currentBorrowerLabel}
                  <a class="detail-link" href={`/profile/${unit.currentBorrowerLabel}`}>Borrowed by {unit.currentBorrowerLabel}</a>
                {/if}
              </div>
              <span class={`unit-status ${unitTone(unit.statusLabel)}`}>{unit.statusLabel}</span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  </section>
</div>

<style>
  .overview-stack,
  .overview-card,
  .meta-stack,
  .unit-section,
  .unit-list,
  .unit-copy {
    display: grid;
    gap: 14px;
  }

  .overview-card {
    padding: 18px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .meta-row,
  .unit-heading,
  .unit-row {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .unit-heading,
  .unit-row {
    justify-content: space-between;
  }

  .unit-list {
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .unit-row {
    align-items: flex-start;
    padding: 12px 0;
    border-top: 1px solid var(--panel-border);
  }

  .unit-row:first-child {
    padding-top: 0;
    border-top: 0;
  }

  .unit-status {
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
  }

  .unit-status.available {
    color: var(--brand-strong);
    border-color: color-mix(in srgb, var(--brand) 40%, var(--panel-border));
  }

  .unit-status.in-use {
    color: var(--accent-warm-strong);
    border-color: color-mix(in srgb, var(--accent-warm) 45%, var(--panel-border));
  }

  h1,
  h2,
  strong,
  p,
  span {
    margin: 0;
  }

  h1,
  h2,
  strong {
    color: var(--text-main);
  }

  p,
  span {
    color: var(--text-soft);
    line-height: 1.55;
  }

  .detail-link {
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
  }
</style>