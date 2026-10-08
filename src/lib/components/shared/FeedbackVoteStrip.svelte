<script lang="ts">
  import type { VoteDirection } from '$lib/types/feed';

  export let upvoteCount = 0;
  export let downvoteCount = 0;
  export let approvalPercent = 0;
  export let activeVote: VoteDirection = 0;
  export let labeled = false;
  export let docked = false;
  export let disabled = false;
  export let onvote: (vote: VoteDirection) => void | Promise<void> = () => {};

  $: showLabels = labeled || docked;

  $: percentLabel = `${Math.round(approvalPercent)}%`;
  $: tooltip = `${upvoteCount} support · ${downvoteCount} oppose · ${percentLabel}`;

  function handleVote(value: Exclude<VoteDirection, 0>, event: MouseEvent) {
    event.stopPropagation();
    const nextVote: VoteDirection = activeVote === value ? 0 : value;
    void onvote(nextVote);
  }
</script>

<div
  class="vote-strip signal-strip"
  class:disabled
  class:docked
  class:labeled={showLabels && !docked}
  title={tooltip}
>
  <button
    aria-label={`Support · ${upvoteCount}`}
    aria-pressed={activeVote === 1}
    class="signal-button vote-button"
    class:active-support={activeVote === 1}
    disabled={disabled}
    type="button"
    on:click={(event) => handleVote(1, event)}
  >
    ▲
    {#if showLabels}
      <span class="signal-label">Support</span>
      <span class="signal-count">{upvoteCount}</span>
    {/if}
  </button>
  <span class="signal-percent" aria-label={tooltip}>{percentLabel}</span>
  <button
    aria-label={`Oppose · ${downvoteCount}`}
    aria-pressed={activeVote === -1}
    class="signal-button vote-button"
    class:active-oppose={activeVote === -1}
    disabled={disabled}
    type="button"
    on:click={(event) => handleVote(-1, event)}
  >
    {#if showLabels}
      <span class="signal-label">Oppose</span>
      <span class="signal-count">{downvoteCount}</span>
    {/if}
    ▼
  </button>
</div>

<style>
  .vote-strip {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 32px;
    padding: 4px 6px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    transition: border-color 120ms ease, background-color 120ms ease;
  }

  .vote-strip:hover {
    border-color: var(--brand);
    background: color-mix(in srgb, var(--brand-soft) 78%, var(--panel-strong));
  }

  .vote-strip.disabled {
    opacity: 0.6;
  }

  .vote-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--text-soft);
    font-size: 11px;
    line-height: 1;
    border-radius: 999px;
    cursor: pointer;
    transition: color 120ms ease, background-color 120ms ease;
  }

  .vote-button:hover:not(:disabled) {
    background: color-mix(in srgb, var(--brand-soft) 78%, var(--panel-strong));
    color: var(--brand-strong);
    box-shadow: inset 0 0 0 1px var(--brand);
  }

  .vote-button:disabled {
    cursor: not-allowed;
  }

  .vote-strip:not(.labeled):not(.docked) {
    flex: 0 0 auto;
  }

  .signal-strip {
    gap: 4px;
    padding: 4px 6px;
  }

  .signal-percent {
    box-sizing: content-box;
    width: 4ch;
    min-width: 4ch;
    text-align: center;
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .signal-strip.labeled {
    gap: 8px;
    min-height: 0;
    padding: 0;
    border: none;
    background: transparent;
  }

  .signal-strip.labeled:hover {
    border: none;
    background: transparent;
  }

  .signal-strip.labeled .vote-button {
    width: auto;
    min-width: 72px;
    min-height: 28px;
    padding: 4px 10px;
    gap: 4px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    font-size: 12px;
  }

  .signal-strip.labeled .vote-button:hover:not(:disabled) {
    border-color: var(--brand);
    background: color-mix(in srgb, var(--brand-soft) 78%, var(--panel-strong));
    color: var(--text-main);
  }

  .signal-strip.docked {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: stretch;
    gap: 0;
    width: 100%;
    height: 100%;
    min-height: 44px;
    padding: 0;
    border: none;
    background: transparent;
  }

  .signal-strip.docked:hover {
    border: none;
    background: transparent;
  }

  .signal-strip.docked .vote-button {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 44px;
    align-self: stretch;
    padding: 0 12px;
    gap: 6px;
    border: 0;
    border-radius: 0;
    font-size: 15px;
    font-weight: 800;
  }

  .signal-strip.docked .vote-button:hover:not(:disabled) {
    filter: brightness(1.12);
  }

  .signal-strip.docked:not(:has(.active-support)):not(:has(.active-oppose)) .vote-button,
  .signal-strip.docked:not(:has(.active-support)):not(:has(.active-oppose)) .vote-button:hover:not(:disabled),
  .signal-strip.docked:not(:has(.active-support)):not(:has(.active-oppose)) .vote-button:focus,
  .signal-strip.docked:not(:has(.active-support)):not(:has(.active-oppose)) .vote-button:focus-visible {
    background: var(--brand);
    color: var(--page-bg);
  }

  .signal-strip.docked:not(:has(.active-support)):not(:has(.active-oppose)) .vote-button:last-child,
  .signal-strip.docked:not(:has(.active-support)):not(:has(.active-oppose)) .vote-button:last-child:hover:not(:disabled),
  .signal-strip.docked:not(:has(.active-support)):not(:has(.active-oppose)) .vote-button:last-child:focus,
  .signal-strip.docked:not(:has(.active-support)):not(:has(.active-oppose)) .vote-button:last-child:focus-visible {
    background: var(--danger);
    color: white;
  }

  .signal-strip.docked:has(.active-support) .vote-button,
  .signal-strip.docked:has(.active-oppose) .vote-button,
  .signal-strip.docked:has(.active-support) .vote-button:hover:not(:disabled),
  .signal-strip.docked:has(.active-oppose) .vote-button:hover:not(:disabled),
  .signal-strip.docked:has(.active-support) .vote-button:focus,
  .signal-strip.docked:has(.active-oppose) .vote-button:focus,
  .signal-strip.docked:has(.active-support) .vote-button:focus-visible,
  .signal-strip.docked:has(.active-oppose) .vote-button:focus-visible {
    background: var(--panel-strong);
    color: var(--text-main);
  }

  .signal-strip.docked .vote-button:not(.active-support):not(.active-oppose) .signal-label,
  .signal-strip.docked .vote-button:not(.active-support):not(.active-oppose) .signal-count {
    color: inherit;
  }

  .signal-strip.docked .vote-button.active-support,
  .signal-strip.docked .vote-button.active-support:hover:not(:disabled),
  .signal-strip.docked .vote-button.active-support:focus,
  .signal-strip.docked .vote-button.active-support:focus-visible {
    background: var(--panel-strong);
    color: #22c55e;
  }

  .signal-strip.docked .vote-button.active-support .signal-label,
  .signal-strip.docked .vote-button.active-support .signal-count {
    color: #22c55e;
  }

  .signal-strip.docked .vote-button.active-oppose,
  .signal-strip.docked .vote-button.active-oppose:hover:not(:disabled),
  .signal-strip.docked .vote-button.active-oppose:focus,
  .signal-strip.docked .vote-button.active-oppose:focus-visible {
    background: var(--panel-strong);
    color: #ef4444;
  }

  .signal-strip.docked .vote-button.active-oppose .signal-label,
  .signal-strip.docked .vote-button.active-oppose .signal-count {
    color: #ef4444;
  }

  .signal-strip.docked .signal-percent {
    display: flex;
    align-items: center;
    align-self: stretch;
    justify-content: center;
    width: auto;
    min-width: 72px;
    height: 100%;
    min-height: 44px;
    padding: 0 18px;
    border-right: 1px solid var(--panel-border);
    border-left: 1px solid var(--panel-border);
    background: var(--panel-strong);
    color: var(--text-main);
    font-size: 14px;
    font-weight: 700;
    pointer-events: none;
  }

  .signal-strip.docked .signal-label,
  .signal-strip.docked .signal-count {
    font-size: 14px;
    font-weight: 800;
  }

  .signal-label,
  .signal-count {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0;
  }

  .signal-count {
    color: var(--text-soft);
    font-variant-numeric: tabular-nums;
  }

  .active-support {
    color: #22c55e;
  }

  .active-oppose {
    color: #ef4444;
  }

  @media (max-width: 760px) {
    .vote-strip:not(.labeled):not(.docked) {
      gap: 4px;
      min-height: 24px;
      padding: 2px 4px;
      border-color: color-mix(in srgb, var(--panel-border) 88%, transparent);
    }

    .vote-strip:not(.labeled):not(.docked) .vote-button {
      width: 20px;
      height: 20px;
      font-size: 10px;
    }

    .vote-strip:not(.docked) .signal-percent {
      width: 4ch;
      min-width: 4ch;
      font-size: 10px;
    }

    .signal-strip.labeled .vote-button {
      min-width: 64px;
      min-height: 26px;
      padding: 3px 8px;
    }

    .signal-strip.docked .vote-button {
      min-height: 52px;
    }
  }
</style>
