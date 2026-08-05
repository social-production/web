<script lang="ts">
  import {
    formatProjectVoteRequirement,
    formatProjectVoteSummary
  } from '$lib/utils/projectVotes';
  import type { ProjectConversionWorkflowItem } from '$lib/types/detail';

  export let title = 'Governed conversion workflow';
  export let description =
    'Close requests that choose Convert stay visible here with the selected successor type, inherited inventory note, and the live vote state.';
  export let items: ProjectConversionWorkflowItem[] = [];
  export let emptyMessage = 'No governed conversion requests are available for this project yet.';

  function tone(label: string) {
    const normalized = label.toLowerCase();

    if (normalized.includes('approved')) {
      return 'approved';
    }

    if (normalized.includes('blocked')) {
      return 'blocked';
    }

    return 'pending';
  }
</script>

<section class="workflow-stack">
  <div class="section-heading">
    <h2>{title}</h2>
    <p>{description}</p>
  </div>

  {#if items.length === 0}
    <div class="empty-card">{emptyMessage}</div>
  {:else}
    <div class="workflow-list">
      {#each items as item}
        <article class="workflow-card">
          <div class="workflow-head">
            <div class="workflow-copy">
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </div>
            <span class={`status-pill ${tone(item.statusLabel)}`}>{item.statusLabel}</span>
          </div>

          <div class="workflow-meta">
            <span>Requested by {item.requestedByUsername}</span>
            <span>{item.createdAtLabel}</span>
            <span class="relationship-pill">{item.outcomeLabel}</span>
          </div>

          <div class="detail-grid">
            <div class="detail-card">
              <span>Successor target</span>
              <strong>{item.target.projectModeLabel} · {item.target.projectSubtypeLabel}</strong>
            </div>
            <div class="detail-card">
              <span>Successor entry phase</span>
              <strong>{item.target.entryPhaseLabel}</strong>
            </div>
          </div>

          <p class="inventory-note">{item.inventoryNote}</p>

          <div class="vote-summary-row">
            <span>{formatProjectVoteRequirement(item.voteSummary, item.approvalThresholdPercent)}</span>
            <span>{formatProjectVoteSummary(item.voteSummary)}</span>
          </div>

          {#if item.successor}
            {#if item.successor.href}
              <a class="open-link" href={item.successor.href}>Open planned successor record</a>
            {:else}
              <span class="open-link muted-link">Successor route not available yet</span>
            {/if}
          {/if}
        </article>
      {/each}
    </div>
  {/if}
</section>

<style>
  .workflow-stack,
  .workflow-list,
  .workflow-copy,
  .detail-grid {
    display: grid;
    gap: 10px;
  }

  .workflow-card,
  .empty-card,
  .detail-card {
    display: grid;
    gap: 10px;
    padding: 12px 0;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 70%, transparent);
    background: transparent;
  }

  .workflow-card:last-child,
  .detail-card:last-child {
    border-bottom: none;
  }

  .workflow-head,
  .workflow-meta,
  .vote-summary-row {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .detail-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  h2,
  h3,
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

  .workflow-meta,
  .vote-summary-row {
    font-size: 12px;
  }

  .inventory-note {
    padding: 8px 0;
    color: var(--text-soft);
  }

  .status-pill,
  .relationship-pill {
    padding: 4px 9px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--panel-border) 22%, transparent);
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
  }

  .status-pill.approved {
    color: var(--brand-strong);
    background: color-mix(in srgb, var(--brand-strong) 14%, transparent);
  }

  .status-pill.blocked {
    color: var(--accent-warm-strong);
    background: color-mix(in srgb, var(--accent-warm) 14%, transparent);
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