<script lang="ts" context="module">
  export type PhaseMenuItem = {
    id: string;
    glyph: string;
    label: string;
    detail: string;
    disabled?: boolean;
    onSelect?: () => void;
  };
</script>

<script lang="ts">
  import OverlaySheet from './OverlaySheet.svelte';

  /** Every phase move (advance, return, close, convert) behind one button, so the bar keeps one clear work action. */
  export let items: PhaseMenuItem[] = [];
  export let currentPhaseLabel = '';
  export let labelledById = 'phase-menu-title';

  let open = false;

  $: hasChoice = items.some((item) => !item.disabled);

  function choose(item: PhaseMenuItem) {
    if (item.disabled) return;
    open = false;
    item.onSelect?.();
  }
</script>

{#if items.length > 0}
  <button
    class="phase-menu-trigger"
    class:muted={!hasChoice}
    data-participation-action="propose-advance"
    type="button"
    aria-haspopup="dialog"
    aria-expanded={open}
    title="Change phase"
    on:click={() => (open = true)}
  >
    <span class="label">Phase</span>
    <span class="caret" aria-hidden="true">▾</span>
  </button>

  <OverlaySheet bind:open title="Change phase" {labelledById}>
    <div class="phase-menu-body">
      {#if currentPhaseLabel}
        <p class="phase-menu-current">Now in <strong>{currentPhaseLabel}</strong></p>
      {/if}
      <ul class="phase-menu-list">
        {#each items as item (item.id)}
          <li>
            <button
              class="phase-menu-item"
              type="button"
              disabled={item.disabled}
              on:click={() => choose(item)}
            >
              <span class="glyph" aria-hidden="true">{item.disabled ? '🔒' : item.glyph}</span>
              <span class="text">
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
              </span>
            </button>
          </li>
        {/each}
      </ul>
    </div>
  </OverlaySheet>
{/if}

<style>
  .phase-menu-trigger {
    height: 40px;
    min-width: 40px;
    padding: 0 14px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
    color: var(--text-main);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .phase-menu-trigger:hover,
  .phase-menu-trigger:focus-visible,
  .phase-menu-trigger[aria-expanded='true'] {
    border-color: color-mix(in srgb, var(--brand) 45%, var(--panel-border));
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .phase-menu-trigger.muted {
    color: var(--text-muted, var(--text-main));
  }

  .caret {
    font-size: 11px;
  }

  .phase-menu-body {
    padding: 16px 20px 24px;
  }

  .phase-menu-current {
    margin: 0 0 10px;
    color: var(--text-muted, var(--text-main));
    font-size: 14px;
  }

  .phase-menu-list {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .phase-menu-item {
    width: 100%;
    display: grid;
    grid-template-columns: 28px 1fr;
    align-items: start;
    gap: 10px;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: 12px;
    background: var(--panel);
    color: var(--text-main);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .phase-menu-item:hover:not(:disabled),
  .phase-menu-item:focus-visible {
    border-color: color-mix(in srgb, var(--brand) 45%, var(--panel-border));
    background: var(--brand-soft);
  }

  .phase-menu-item:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .glyph {
    font-size: 20px;
    line-height: 1.1;
    text-align: center;
  }

  .text {
    display: grid;
    gap: 2px;
  }

  .text strong {
    font-size: 15px;
  }

  .text span {
    color: var(--text-muted, var(--text-main));
    font-size: 13px;
    line-height: 1.35;
  }
</style>
