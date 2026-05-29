<script lang="ts">
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import type { CollectiveFundRecord } from '$lib/types/assets';

  export let funds: CollectiveFundRecord[];
  export let featureOpen = false;
</script>

<section class="fund-stack">
  <div class="intro-card">
    <h2>Collective funds</h2>
    <p>
      Funds track pooled contribution rounds before board members execute the actual purchase through real nonprofit accounts and convert the result into common assets on the platform.
    </p>
    {#if !featureOpen}
      <p class="note">The fund registry is still closed in beta, but the purchase and conversion flow is shown here so the handoff to real-world asset execution stays visible.</p>
    {/if}
  </div>

  <div class="fund-grid">
    {#each funds as fund}
      <FeedSurface href={fund.projectHref ?? null} tone="public">
        <div class="fund-card">
          <div class="fund-main">
            <div class="fund-header">
              <div>
                <h3>{fund.title}</h3>
                <p>{fund.summary}</p>
              </div>
              <span class={`status-badge ${fund.status}`}>{fund.status}</span>
            </div>

            <div class="progress-copy">
              <span>{fund.raisedLabel} raised</span>
              <span>Target {fund.targetLabel}</span>
              <strong>{fund.progressPercent}%</strong>
            </div>

            <div class="progress-rail">
              <div class="progress-fill" style={`width: ${fund.progressPercent}%`}></div>
            </div>

            <span class:disabled-link={!fund.projectHref} class="open-copy">
              {fund.projectHref ? 'Open acquisition project' : 'Related project not available yet'}
            </span>
          </div>

          <div class="fund-meta">
            <div class="linked-assets">
              <strong>Linked assets</strong>
              <p>{fund.linkedAssetTitles.join(' · ')}</p>
            </div>

            <p class="execution-note">{fund.executionNote}</p>
          </div>
        </div>
      </FeedSurface>
    {/each}
  </div>
</section>

<style>
  .fund-stack,
  .fund-grid,
  .intro-card,
  .fund-card,
  .fund-main,
  .fund-meta,
  .linked-assets {
    display: grid;
    gap: 14px;
  }

  .fund-grid {
    grid-template-columns: 1fr;
  }

  .intro-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .fund-header,
  .progress-copy {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .fund-card {
    grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.9fr);
    align-items: start;
  }

  .status-badge {
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid var(--panel-border);
    font-size: 11px;
    font-weight: 700;
    text-transform: capitalize;
  }

  .status-badge.active {
    background: color-mix(in srgb, var(--brand-soft) 70%, var(--panel));
    color: var(--brand-strong);
  }

  .status-badge.completed {
    background: color-mix(in srgb, var(--accent-warm) 18%, var(--panel));
    color: var(--accent-warm-strong);
  }

  h2,
  h3,
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

  .note,
  .execution-note {
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .progress-rail {
    width: 100%;
    height: 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--panel-border) 74%, var(--panel));
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--brand) 0%, color-mix(in srgb, var(--brand) 65%, white) 100%);
  }

  .open-copy {
    font-size: 12px;
    font-weight: 700;
    color: var(--brand-strong);
  }

  .disabled-link {
    color: var(--text-soft);
  }

  @media (max-width: 900px) {
    .fund-card {
      grid-template-columns: 1fr;
    }
  }
</style>