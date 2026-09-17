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
      <span aria-hidden="true" class="phase-tab-swatch"></span>
      <span class="phase-tab-title">{compactTitle(tab.title)}</span>
    </button>
  {/each}
</section>

<style>
  .phase-tab-row {
    display: grid;
    grid-template-columns: repeat(var(--phase-count, 4), minmax(0, 1fr));
    gap: 0;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    margin: 8px 0 0;
    padding: 2px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
  }

  .phase-tab {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    min-height: 32px;
    padding: 4px 6px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    text-align: center;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
  }

  .phase-tab-swatch {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: #9aa3ad;
    flex: 0 0 auto;
  }

  .phase-tab.current-phase .phase-tab-swatch {
    background: #2f9e44;
  }

  .phase-tab.complete-phase .phase-tab-swatch {
    background: #228be6;
  }

  .phase-tab.future-phase:not(.active) {
    color: var(--accent-warm-strong);
  }

  .phase-tab.future-phase .phase-tab-swatch {
    background: #adb5bd;
  }

  .phase-tab.locked-phase:not(.active) {
    color: var(--tablet-community-text);
    opacity: 0.8;
  }

  .phase-tab.locked-phase .phase-tab-swatch {
    background: color-mix(in srgb, var(--tablet-community-bg) 70%, #9aa3ad);
  }

  .phase-tab-title {
    min-width: 0;
    color: inherit;
    font-size: 11px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .phase-tab.active {
    background: color-mix(in srgb, var(--brand-soft) 62%, var(--panel));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand) 28%, transparent);
  }

  .phase-tab.active .phase-tab-title {
    color: var(--brand-strong);
  }

  @media (max-width: 760px) {
    .phase-tab {
      min-height: 28px;
      padding: 3px 4px;
      gap: 4px;
    }

    .phase-tab-swatch {
      display: none;
    }

    .phase-tab-title {
      font-size: 10px;
    }
  }
</style>
