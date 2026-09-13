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
</script>

<section class="phase-tab-row overview-phase-tabs" role="tablist">
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
      on:click={() => selectPhase(tab.phase)}
    >
      <span aria-hidden="true" class="phase-tab-swatch"></span>
      <span class="phase-tab-copy">
        <span class="phase-tab-title">{tab.title}</span>
        <small class:current-label={tab.phase.progressState === 'current'}>{tab.progressLabel}</small>
      </span>
    </button>
  {/each}
</section>

<style>
  .phase-tab-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(140px, 100%), 1fr));
    gap: 8px;
    padding: 4px 0 8px;
    min-width: 0;
  }

  .phase-tab {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
    text-align: left;
    font-size: 12px;
    font-weight: 700;
  }

  .phase-tab-copy {
    display: grid;
    gap: 1px;
  }

  .phase-tab-swatch {
    width: 8px;
    height: 8px;
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

  .phase-tab small {
    color: inherit;
    font-size: 10px;
    opacity: 0.82;
  }

  .phase-tab.active {
    border-color: color-mix(in srgb, var(--brand) 50%, var(--panel-border));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 20%, transparent);
  }

  .phase-tab-title {
    color: inherit;
    font-size: 13px;
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  .phase-tab.active .phase-tab-title,
  .phase-tab small.current-label {
    color: var(--brand-strong);
    opacity: 1;
  }
</style>
