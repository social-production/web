<script lang="ts">
  export let activeTab: 'live' | 'history' = 'live';
  export let ariaLabel = 'Activity view';
  export let liveLabel = 'Live';
  export let historyLabel = 'History';
</script>

<div class="tab-row" role="tablist" aria-label={ariaLabel}>
  <button
    class:active-tab={activeTab === 'live'}
    class="tab-button"
    type="button"
    on:click={() => (activeTab = 'live')}
  >
    {liveLabel}
  </button>
  <button
    class:active-tab={activeTab === 'history'}
    class="tab-button"
    type="button"
    on:click={() => (activeTab = 'history')}
  >
    {historyLabel}
  </button>
</div>

<style>
  .tab-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .tab-button {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    font-weight: 700;
    text-align: left;
    transition:
      border-color 0.12s ease,
      background 0.12s ease,
      color 0.12s ease,
      box-shadow 0.12s ease;
  }

  .tab-button.active-tab {
    border-color: color-mix(in srgb, var(--brand-strong) 62%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 56%, var(--panel));
    color: var(--brand-strong);
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--brand) 28%, transparent),
      inset 0 0 0 1px color-mix(in srgb, var(--brand) 18%, transparent);
  }

  @media (max-width: 760px) {
    .tab-row {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>