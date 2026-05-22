<script lang="ts">
  import type { LandAssetRecord } from '$lib/types/assets';

  export let asset: LandAssetRecord;
  export let featureOpen = false;
</script>

<div class="hero-card">
  <div class="hero-header">
    <div>
      <div class="badge-row">
        <span class="scope-badge">Land asset</span>
        <span class={`status-badge ${featureOpen ? 'open' : 'closed'}`}>
          {featureOpen ? 'Active registry' : asset.statusLabel}
        </span>
      </div>
      <h1>{asset.title}</h1>
      <p>{asset.locationLabel} · {asset.sizeLabel}</p>
    </div>
  </div>

  <div class="detail-grid">
    <div class="detail-card">
      <span>Current custodian</span>
      <strong>{asset.currentCustodianLabel}</strong>
    </div>
    <div class="detail-card">
      <span>Home land asset</span>
      <strong>{asset.homeLandAssetLabel}</strong>
    </div>
  </div>

  <p class="stewardship-note">{asset.stewardshipNote}</p>
  <p class="history-note">{asset.historySummary}</p>
</div>

<style>
  .hero-card {
    display: grid;
    gap: 14px;
    padding: 18px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background:
      radial-gradient(circle at top right, color-mix(in srgb, var(--brand-soft) 60%, transparent), transparent 48%),
      var(--panel);
  }

  .hero-header,
  .badge-row,
  .detail-grid {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .detail-card {
    display: grid;
    gap: 6px;
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .scope-badge,
  .status-badge {
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
  }

  .scope-badge {
    background: var(--panel-strong);
    color: var(--text-soft);
  }

  .status-badge.open {
    background: color-mix(in srgb, var(--brand-soft) 70%, var(--panel));
    color: var(--brand-strong);
  }

  .status-badge.closed {
    background: color-mix(in srgb, var(--accent-warm) 18%, var(--panel));
    color: var(--accent-warm-strong);
  }

  h1,
  strong {
    margin: 0;
    color: var(--text-main);
  }

  p,
  span {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.55;
  }

  .stewardship-note,
  .history-note {
    padding: 14px;
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }
</style>