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

<section class="phase-tab-row" style={`grid-template-columns: repeat(${tabs.length}, minmax(0, 1fr))`}>
  {#each tabs as tab}
    <button
      class:active={activePhaseId === tab.phase.id}
      class:current-phase={tab.phase.progressState === 'current'}
      class:complete-phase={tab.phase.progressState === 'complete'}
      class:future-phase={tab.isFuture && tab.phase.progressState !== 'locked'}
      class:locked-phase={tab.phase.progressState === 'locked'}
      class="phase-tab"
      type="button"
      aria-label={`${tab.title} · ${tab.progressLabel}`}
      on:click={() => selectPhase(tab.phase)}
    >
      <span aria-hidden="true" class="phase-tab-swatch"></span>
      <span class="phase-tab-title">{tab.title}</span>
      <small class:current-label={tab.phase.progressState === 'current'}>{tab.progressLabel}</small>
    </button>
  {/each}
</section>

<style>
  .phase-tab-row {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .phase-tab {
    min-width: 0;
    display: grid;
    justify-items: start;
    gap: 3px;
    align-content: start;
    min-height: 82px;
    padding: 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-soft);
    text-align: left;
    font-size: 12px;
    font-weight: 700;
  }

  .phase-tab-swatch {
    display: none;
  }

  .phase-tab.future-phase {
    border-color: color-mix(in srgb, var(--accent-warm) 35%, var(--panel-border));
    color: var(--accent-warm-strong);
  }

  .phase-tab.locked-phase {
    border-color: color-mix(in srgb, var(--tablet-community-bg) 60%, var(--panel-border));
    background: color-mix(in srgb, var(--tablet-community-bg) 16%, var(--panel));
    color: var(--tablet-community-text);
  }

  .phase-tab small {
    color: inherit;
    font-size: 10px;
    opacity: 0.82;
  }

  .phase-tab.active {
    border-color: var(--brand);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand) 30%, transparent);
  }

  .phase-tab-title {
    color: var(--text-main);
    font-size: 13px;
    font-weight: 700;
  }

  .phase-tab small.current-label {
    color: var(--brand-strong);
    opacity: 1;
  }

  @media (max-width: 760px) {
    .phase-tab-row {
      gap: 8px;
      padding: 12px;
    }

    .phase-tab {
      min-height: auto;
      min-width: 0;
      padding: 0;
      border: none;
      background: transparent;
      box-shadow: none;
      justify-items: center;
    }

    .phase-tab.active {
      box-shadow: none;
    }

    .phase-tab-title,
    .phase-tab small {
      display: none;
    }

    .phase-tab-swatch {
      display: block;
      width: 30px;
      height: 30px;
      border-radius: 6px;
      border: 1px solid color-mix(in srgb, var(--panel-border) 80%, transparent);
      background: #9aa3ad;
    }

    .phase-tab.current-phase .phase-tab-swatch {
      background: #2f9e44;
      border-color: color-mix(in srgb, #2f9e44 70%, var(--panel-border));
    }

    .phase-tab.complete-phase .phase-tab-swatch {
      background: #228be6;
      border-color: color-mix(in srgb, #228be6 70%, var(--panel-border));
    }

    .phase-tab.future-phase .phase-tab-swatch {
      background: #adb5bd;
      border-color: color-mix(in srgb, #adb5bd 70%, var(--panel-border));
    }

    .phase-tab.locked-phase .phase-tab-swatch {
      background: color-mix(in srgb, var(--tablet-community-bg) 55%, var(--panel-strong));
      border-color: color-mix(in srgb, var(--tablet-community-bg) 60%, var(--panel-border));
    }

    .phase-tab.active .phase-tab-swatch {
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand) 45%, transparent);
    }
  }
</style>
