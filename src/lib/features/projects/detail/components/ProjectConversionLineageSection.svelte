<script lang="ts">
  import type { ProjectConversionLineageFrame } from '$lib/types/detail';

  export let lineage: ProjectConversionLineageFrame | null = null;

  const fallback: ProjectConversionLineageFrame = {
    title: 'Conversion lineage',
    statusLabel: 'Frame only',
    summary:
      'This frame is reserved for the permanent predecessor and successor link that appears when a project converts into a new project type.',
    permanenceNote:
      'When conversion is shown here, the predecessor/successor relationship will stay visible permanently instead of being handled through manual links.',
    inventoryNote:
      'The successor project will inherit the predecessor inventory framing once the governed conversion path is fully wired.',
    predecessor: null,
    successor: null
  };

  $: frame = lineage ?? fallback;
</script>

<section class="conversion-section">
  <div class="section-heading">
    <h2>{frame.title}</h2>
    {#if frame.statusLabel}
      <span class="status-pill">{frame.statusLabel}</span>
    {/if}
  </div>
  <p>{frame.summary}</p>

  {#if frame.predecessor || frame.successor}
    <div class="lineage-grid">
      {#if frame.predecessor}
        <article class="lineage-card">
          <div class="lineage-head">
            <strong>{frame.predecessor.title}</strong>
            <span class="relationship-pill">{frame.predecessor.relationshipLabel}</span>
          </div>
          <p>{frame.predecessor.summary}</p>
          {#if frame.predecessor.href}
            <a class="open-link" href={frame.predecessor.href}>Open predecessor record</a>
          {/if}
        </article>
      {/if}

      {#if frame.successor}
        <article class="lineage-card">
          <div class="lineage-head">
            <strong>{frame.successor.title}</strong>
            <span class="relationship-pill">{frame.successor.relationshipLabel}</span>
          </div>
          <p>{frame.successor.summary}</p>
          {#if frame.successor.href}
            <a class="open-link" href={frame.successor.href}>Open successor record</a>
          {:else}
            <span class="open-link muted-link">Successor route not available yet</span>
          {/if}
        </article>
      {/if}
    </div>
  {/if}

  <p class="note-card">{frame.inventoryNote}</p>
  <p class="note-card">{frame.permanenceNote}</p>
</section>

<style>
  .conversion-section,
  .lineage-grid,
  .lineage-card {
    display: grid;
    gap: 10px;
  }

  .lineage-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .lineage-card,
  .note-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
  }

  .conversion-section,
  .lineage-card {
    background: var(--panel-strong);
  }

  .section-heading {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .lineage-head {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  h2,
  strong {
    margin: 0;
    color: var(--text-main);
  }

  h2 {
    font-size: 16px;
  }

  p {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.6;
  }

  .status-pill,
  .relationship-pill {
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel);
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
  }

  .status-pill {
    background: color-mix(in srgb, var(--accent-warm) 14%, var(--panel));
    color: var(--accent-warm-strong);
  }

  .note-card {
    background: var(--panel);
  }

  .open-link {
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
  }

  .muted-link {
    color: var(--text-soft);
  }
</style>