<script lang="ts">
  export let detailsOpen = false;
  export let participationOpen = false;
  export let onToggleDetails: () => void = () => {};
  export let onToggleParticipation: () => void = () => {};
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
</div>

<style>
  .fold-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 2px 0 0;
    min-width: 0;
    flex-wrap: wrap;
  }

  .fold-button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 28px;
    padding: 0 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
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
    border-color: color-mix(in srgb, var(--brand) 40%, var(--panel-border));
    color: var(--brand-strong);
  }

  .fold-button:hover,
  .fold-button:focus-visible {
    border-color: color-mix(in srgb, var(--brand) 28%, var(--panel-border));
    color: var(--text-main);
  }
</style>
