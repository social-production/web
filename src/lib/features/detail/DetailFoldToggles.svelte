<script lang="ts">
  export let detailsOpen = false;
  export let participationOpen = false;
  export let votesOpen = false;
  export let showVotes = false;
  export let voteCount = 0;
  export let onToggleDetails: () => void = () => {};
  export let onToggleParticipation: () => void = () => {};
  export let onToggleVotes: () => void = () => {};
</script>

<div class="fold-row overview-folds" role="group" aria-label="Overview sections">
  <button
    type="button"
    class="fold-button"
    class:open={detailsOpen}
    aria-expanded={detailsOpen}
    aria-controls="overview-details-sheet"
    on:click={onToggleDetails}
  >
    Details
    <span aria-hidden="true" class="fold-caret">▾</span>
  </button>
  <button
    type="button"
    class="fold-button"
    class:open={participationOpen}
    aria-expanded={participationOpen}
    aria-controls="detail-participation-panel"
    on:click={onToggleParticipation}
  >
    Participation
    <span aria-hidden="true" class="fold-caret">▾</span>
  </button>
  {#if showVotes}
    <button
      type="button"
      class="fold-button vote-fold"
      class:open={votesOpen}
      aria-expanded={votesOpen}
      aria-controls="pending-votes-panel"
      aria-label={voteCount > 0 ? `Vote, ${voteCount} needed` : 'Vote'}
      on:click={onToggleVotes}
    >
      Vote
      {#if voteCount > 0}
        <span class="fold-badge">{voteCount}</span>
      {/if}
      <span aria-hidden="true" class="fold-caret">▾</span>
    </button>
  {/if}
</div>

<style>
  .fold-row {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    margin: 0;
    min-width: 0;
    flex-wrap: nowrap;
  }

  .fold-button {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    min-height: 24px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.01em;
    cursor: pointer;
  }

  .fold-caret {
    font-size: 10px;
    line-height: 1;
    transform: translateY(-0.5px);
  }

  .fold-button.open .fold-caret {
    transform: rotate(180deg) translateY(-0.5px);
  }

  .fold-button.open {
    color: var(--brand-strong);
  }

  .fold-button:hover,
  .fold-button:focus-visible {
    color: var(--text-main);
  }

  .vote-fold {
    position: relative;
    gap: 5px;
    min-height: 28px;
    padding: 3px 9px;
    border: 1px solid color-mix(in srgb, var(--brand) 22%, var(--panel-border));
    border-radius: 999px;
    background: color-mix(in srgb, var(--panel) 82%, var(--panel-strong));
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
  }

  .vote-fold.open {
    border-color: color-mix(in srgb, var(--brand) 55%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 50%, var(--panel));
    color: var(--text-main);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 20%, transparent);
  }

  .vote-fold:hover,
  .vote-fold:focus-visible {
    border-color: color-mix(in srgb, var(--brand) 45%, var(--panel-border));
    color: var(--text-main);
  }

  .fold-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 999px;
    background: var(--brand);
    color: var(--page-bg, #fff);
    font-size: 10px;
    font-weight: 800;
    line-height: 1;
  }
</style>
