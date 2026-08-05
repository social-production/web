<script lang="ts">
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import type { DetailTabId } from './detailTabs';

  export let activeTab: DetailTabId = 'overview';
  export let ariaLabel = 'Detail tabs';
  export let selectTab: (tab: DetailTabId) => void = () => {};

  const tabs: Array<{
    id: DetailTabId;
    label: string;
    icon: 'list' | 'message' | 'link' | 'clock';
  }> = [
    { id: 'overview', label: 'Overview', icon: 'list' },
    { id: 'chat', label: 'Chat', icon: 'message' },
    { id: 'links', label: 'Links', icon: 'link' },
    { id: 'history', label: 'History', icon: 'clock' }
  ];
</script>

<div class="top-tab-row" role="tablist" aria-label={ariaLabel}>
  {#each tabs as tab}
    <button
      class:active-tab={activeTab === tab.id}
      class="top-tab detail-surface-tab"
      role="tab"
      type="button"
      aria-label={tab.label}
      aria-selected={activeTab === tab.id}
      on:click={() => selectTab(tab.id)}
    >
      <span class="tab-icon" aria-hidden="true">
        <FeedToolbarIcon name={tab.icon} />
      </span>
      <span class="tab-label">{tab.label}</span>
    </button>
  {/each}
</div>

<style>
  .top-tab-row {
    display: inline-flex;
    gap: 8px;
    padding: 2px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    width: fit-content;
    position: absolute;
    top: 0;
    left: 16px;
    transform: translateY(-44%);
    z-index: 1;
    box-shadow: 0 10px 24px color-mix(in srgb, var(--page-bg) 82%, transparent);
  }

  .top-tab {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-width: 108px;
    padding: 9px 14px;
    border-radius: calc(var(--radius-sm) - 2px);
    font-size: 13px;
    font-weight: 700;
  }

  .tab-icon {
    display: none;
    width: 18px;
    height: 18px;
  }

  .tab-icon :global(.toolbar-icon) {
    width: 18px;
    height: 18px;
  }

  @media (max-width: 1080px) {
    .top-tab-row {
      position: static;
      width: 100%;
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      transform: none;
      box-shadow: none;
      margin-bottom: 12px;
    }

    .top-tab {
      min-width: 0;
      padding: 10px 6px;
      font-size: 12px;
    }

    .tab-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .tab-label {
      display: none;
    }
  }
</style>
