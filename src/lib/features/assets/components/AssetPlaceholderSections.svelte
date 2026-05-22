<script lang="ts">
  import type { AssetPlaceholderSection } from '$lib/types/assets';

  export let title = 'Planned asset sections';
  export let sections: AssetPlaceholderSection[] = [];
</script>

{#if sections.length > 0}
  <section class="frame-stack">
    <div class="section-heading">
      <h2>{title}</h2>
    </div>

    <div class="frame-grid">
      {#each sections as section}
        <article class="frame-card">
          <div class="frame-head">
            <strong>{section.title}</strong>
            {#if section.statusLabel}
              <span class="status-pill">{section.statusLabel}</span>
            {/if}
          </div>
          <p>{section.body}</p>
        </article>
      {/each}
    </div>
  </section>
{/if}

<style>
  .frame-stack,
  .frame-grid {
    display: grid;
    gap: 12px;
  }

  .frame-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .frame-card {
    display: grid;
    gap: 10px;
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .frame-head {
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

  p {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.6;
  }

  .status-pill {
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent-warm) 14%, var(--panel));
    color: var(--accent-warm-strong);
    font-size: 11px;
    font-weight: 700;
  }
</style>