<script lang="ts">
  import type { AssetProvenanceEntry } from '$lib/types/assets';

  export let title = 'History';
  export let summary = 'Chronological custody and location records.';
  export let entries: AssetProvenanceEntry[] = [];
  export let emptyMessage = 'No provenance history is seeded for this asset yet.';
</script>

<section class="timeline-stack">
  <div class="section-copy">
    <div class="section-title-row">
      <h2>{title}</h2>
    </div>
    <p class="section-subtitle">{summary}</p>
  </div>

  {#if entries.length === 0}
    <div class="empty-card">{emptyMessage}</div>
  {:else}
    <div class="timeline-list">
      {#each entries as entry}
        <article class="timeline-row">
          <strong>{entry.happenedAtLabel} - {entry.title}</strong>
          <p>{entry.summary}</p>
          <div class="meta-line">
            {#if entry.locationHref}
              <a class="inline-link" href={entry.locationHref}>{entry.locationLabel}</a>
            {:else}
              <span>{entry.locationLabel}</span>
            {/if}
            <span>· {entry.custodyLabel}</span>
            {#if entry.referenceLabel}
              <span>· </span>
              {#if entry.referenceHref}
                <a class="inline-link" href={entry.referenceHref}>{entry.referenceLabel}</a>
              {:else}
                <span>{entry.referenceLabel}</span>
              {/if}
            {/if}
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>

<style>
  .timeline-stack,
  .section-copy,
  .timeline-list,
  .timeline-row {
    display: grid;
    gap: 8px;
  }

  .empty-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .section-title-row,
  .meta-line {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  .timeline-list {
    gap: 0;
  }

  .timeline-row {
    padding: 14px 0;
    border-top: 1px solid var(--panel-border);
  }

  .timeline-row:first-child {
    padding-top: 0;
    border-top: 0;
  }

  h2,
  strong {
    margin: 0;
    color: var(--text-main);
  }

  p,
  span,
  .empty-card {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.6;
  }

  .section-subtitle {
    font-size: 13px;
  }

  .inline-link {
    color: var(--brand-strong);
    text-decoration: none;
  }
</style>