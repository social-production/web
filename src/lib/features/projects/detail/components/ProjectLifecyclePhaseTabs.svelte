<script lang="ts">
  import type { ProjectLifecyclePhase, ProjectLifecyclePhaseId } from '$lib/types/detail';

  type LifecycleTabItem = {
    phase: ProjectLifecyclePhase;
    title: string;
    progressLabel: string;
    isFuture: boolean;
  };

  export let tabs: LifecycleTabItem[] = [];
  export let activePhaseId: ProjectLifecyclePhaseId;
  export let selectPhase: (phase: ProjectLifecyclePhase) => void = () => {};

  function compactTitle(title: string) {
    return title.replace(/\s+Plan$/i, '').trim() || title;
  }
</script>

<section
  class="phase-tab-row overview-phase-tabs"
  role="tablist"
  style={`--phase-count: ${Math.max(tabs.length, 1)}`}
>
  {#each tabs as tab}
    <button
      class:active={activePhaseId === tab.phase.id}
      class:current-phase={tab.phase.progressState === 'current'}
      class:complete-phase={tab.phase.progressState === 'complete'}
      class:future-phase={tab.isFuture && tab.phase.progressState !== 'locked'}
      class:locked-phase={tab.phase.progressState === 'locked'}
      class="phase-tab detail-surface-tab"
      type="button"
      role="tab"
      aria-selected={activePhaseId === tab.phase.id}
      aria-label={`${tab.title} · ${tab.progressLabel}`}
      title={`${tab.title} · ${tab.progressLabel}`}
      on:click={() => selectPhase(tab.phase)}
    >
      {#if tab.phase.progressState === 'current'}
        <span aria-hidden="true" class="phase-tab-swatch"></span>
      {/if}
      <span class="phase-tab-title">{compactTitle(tab.title)}</span>
    </button>
  {/each}
</section>

<style>
  .phase-tab-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 10px 14px;
    min-width: 0;
    max-width: 100%;
    overflow: visible;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
  }

  .phase-tab {
    flex: 0 1 auto;
    min-width: max-content;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 24px;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--text-soft);
    text-align: center;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
  }

  .phase-tab-swatch {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: #2f9e44;
    flex: 0 0 auto;
  }

  .phase-tab.current-phase {
    color: #2f9e44;
    font-size: 15px;
  }

  .phase-tab.complete-phase {
    color: #9aa3ad;
  }

  .phase-tab.future-phase:not(.active) {
    color: var(--text-soft);
  }

  .phase-tab.locked-phase:not(.active) {
    color: var(--tablet-community-text);
    opacity: 0.8;
  }

  .phase-tab-title {
    color: inherit;
    font-size: inherit;
    font-weight: 700;
    overflow: visible;
    text-overflow: clip;
  }

  .phase-tab:hover,
  .phase-tab.active {
    border-color: transparent;
    background: transparent;
    box-shadow: none;
    filter: none;
  }

  .phase-tab.active {
    color: var(--text-main);
    box-shadow: inset 0 -2px 0 currentColor;
  }

  .phase-tab.active.current-phase,
  .phase-tab.current-phase .phase-tab-title {
    color: #2f9e44;
  }

  .phase-tab.active .phase-tab-title {
    color: inherit;
  }
</style>
