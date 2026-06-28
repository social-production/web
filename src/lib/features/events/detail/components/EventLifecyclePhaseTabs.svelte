<script lang="ts">
  import type { EventLifecyclePhase, EventLifecyclePhaseId } from '$lib/types/detail';
  import type { EventLifecycleTabItem } from '../lifecycle/eventLifecycleShared';

  export let tabs: EventLifecycleTabItem[] = [];
  export let activePhaseId: EventLifecyclePhaseId;
  export let selectPhase: (phase: EventLifecyclePhase) => void = () => {};
</script>

<section class="phase-tab-row" style={`grid-template-columns: repeat(${tabs.length}, minmax(0, 1fr))`}>
  {#each tabs as tab}
    <button
      class:active={activePhaseId === tab.phase.id}
      class:current-phase={tab.phase.progressState === 'current'}
      class:future-phase={tab.isFuture && tab.phase.progressState !== 'locked'}
      class:locked-phase={tab.phase.progressState === 'locked'}
      class="phase-tab"
      type="button"
      on:click={() => selectPhase(tab.phase)}
    >
      <span class="phase-tab-title">{tab.title}</span>
      <span aria-hidden="true" class="phase-tab-abbrev">{tab.phase.shortLabel}</span>
      <small class:current-label={tab.phase.progressState === 'current'}>{tab.progressLabel}</small>
    </button>
  {/each}
</section>

<style>
  .phase-tab-row {
    display: grid;
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
  }

  .phase-tab-title {
    font-size: 13px;
    font-weight: 700;
  }

  .phase-tab small.current-label {
    color: var(--brand-strong);
    opacity: 1;
  }

  @media (max-width: 760px) {
    .phase-tab-row {
      gap: 6px;
      padding: 12px;
    }

    .phase-tab {
      min-height: 56px;
      padding: 6px 4px;
      justify-items: center;
      text-align: center;
    }

    .phase-tab-title {
      display: none;
    }

    .phase-tab-abbrev {
      display: block;
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--text-main);
      font-size: 11px;
      font-weight: 800;
      line-height: 1.2;
    }

    .phase-tab small {
      display: none;
    }
  }

  .phase-tab-abbrev {
    display: none;
  }
</style>