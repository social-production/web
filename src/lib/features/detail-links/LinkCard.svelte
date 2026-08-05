<script lang="ts">
  import SurfaceIcon from '$lib/components/cards/shared/SurfaceIcon.svelte';
  import type { SurfaceIconId } from '$lib/utils/surfaceType';

  export let title = '';
  export let metaLine = '';
  export let sideVoteLines: string[] = [];
  export let outcomeLabel: string | null = null;
  export let outcomeTone: 'approved' | 'blocked' | 'pending' | null = null;
  export let icon: SurfaceIconId = 'document';
  export let accentStyle = '';
  export let href: string | null = null;
  export let expanded = false;
  export let domId: string | null = null;
  export let highlighted = false;
  export let onToggle: () => void | Promise<void> = () => {};

  $: detailsId = domId ? `${domId}-details` : 'link-card-details';
  $: hasMeta = Boolean(metaLine) || sideVoteLines.length > 0;
</script>

<article
  id={domId ?? undefined}
  class="link-card"
  class:expanded
  class:highlighted
  style={accentStyle}
>
  <div class="card-header">
    <button
      class="toggle-button"
      type="button"
      aria-expanded={expanded}
      aria-controls={detailsId}
      on:click={() => onToggle()}
    >
      <div class="header-top">
        <span class="identity" aria-hidden="true">
          <SurfaceIcon {icon} size="sm" />
        </span>
        <strong class="card-title">{title}</strong>
        {#if outcomeLabel}
          <span class={`outcome-label ${outcomeTone ?? 'pending'}`}>{outcomeLabel}</span>
        {/if}
      </div>

      {#if hasMeta}
        <div class="header-meta">
          {#if metaLine}
            <span class="row-meta">{metaLine}</span>
          {/if}
          {#if sideVoteLines.length > 0}
            <div class="side-votes">
              {#each sideVoteLines as line}
                <span class="side-vote-line">{line}</span>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </button>

    {#if href}
      <a class="open-button" href={href}>Open</a>
    {/if}
  </div>

  {#if expanded}
    <div id={detailsId} class="card-body">
      <slot />
    </div>
  {/if}
</article>

<style>
  .link-card {
    padding: 12px 14px 12px 12px;
    border: 1px solid var(--panel-border);
    border-left: 3px solid var(--row-accent, var(--type-accent-neutral));
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    display: grid;
    gap: 12px;
    transition:
      border-color 0.12s ease,
      box-shadow 0.12s ease;
  }

  .link-card:hover,
  .link-card.expanded,
  .link-card.highlighted,
  .link-card:global(.request-highlight) {
    border-color: color-mix(in srgb, var(--brand) 40%, var(--panel-border));
    border-left-color: var(--row-accent, var(--type-accent-neutral));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 25%, transparent);
  }

  .link-card.highlighted,
  .link-card:global(.request-highlight) {
    background: color-mix(in srgb, var(--brand-soft) 35%, var(--panel-strong));
  }

  .card-header {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }

  .toggle-button {
    display: grid;
    gap: 8px;
    flex: 1;
    min-width: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }

  .header-top {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
  }

  .identity {
    display: inline-flex;
    color: var(--row-accent, var(--text-soft));
    flex-shrink: 0;
  }

  .card-title {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: 14px;
    line-height: 1.35;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .header-meta {
    display: grid;
    gap: 6px;
    padding-left: 26px;
  }

  .row-meta,
  .side-vote-line {
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.45;
  }

  .side-votes {
    display: grid;
    gap: 2px;
  }

  .outcome-label {
    flex-shrink: 0;
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  .outcome-label.approved {
    color: var(--brand-strong);
  }

  .outcome-label.blocked {
    color: var(--accent-warm-strong);
  }

  .open-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
    padding: 6px 12px;
    border: 1px solid color-mix(in srgb, var(--brand) 35%, var(--panel-border));
    border-radius: 999px;
    background: color-mix(in srgb, var(--brand-soft) 70%, var(--panel));
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
    transition:
      background 0.12s ease,
      border-color 0.12s ease,
      box-shadow 0.12s ease,
      color 0.12s ease;
  }

  .open-button:hover,
  .open-button:focus-visible {
    background: color-mix(in srgb, var(--brand) 18%, var(--panel));
    border-color: color-mix(in srgb, var(--brand) 55%, var(--panel-border));
    color: var(--brand-strong);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand) 22%, transparent);
  }

  .card-body {
    display: grid;
    gap: 12px;
    padding-top: 2px;
  }

  @media (max-width: 640px) {
    .header-meta {
      padding-left: 0;
    }
  }
</style>
