<script lang="ts">
  import { participationPhaseLabel } from '$lib/features/projects/detail/activityHistoryPresentation';

  type DetailPhaseStep = {
    id: string;
    title: string;
    progressLabel: string;
    progressState: string;
    isFuture: boolean;
  };

  export let steps: DetailPhaseStep[] = [];
  export let activeId = '';
  export let onSelect: (id: string) => void = () => {};
</script>

<nav class="phase-bar overview-phase-tabs" aria-label="Phases">
  {#each steps as step (step.id)}
    <button
      class="segment"
      class:active={activeId === step.id}
      class:current={step.progressState === 'current'}
      class:complete={step.progressState === 'complete'}
      class:future={step.isFuture && step.progressState !== 'locked'}
      class:locked={step.progressState === 'locked'}
      type="button"
      aria-current={step.progressState === 'current' ? 'step' : undefined}
      aria-pressed={activeId === step.id}
      aria-label={`${step.title} · ${step.progressLabel}`}
      title={`${step.title} · ${step.progressLabel}`}
      on:click={() => onSelect(step.id)}
    >
      <span class="label">{participationPhaseLabel(step.title)}</span>
    </button>
  {/each}
</nav>

<style>
  .phase-bar {
    display: flex;
    flex-wrap: nowrap;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-soft);
  }

  .segment {
    position: relative;
    display: flex;
    flex: 1 1 0;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 0;
    min-height: 36px;
    padding: 0 8px;
    border: 0;
    border-right: 1px solid color-mix(in srgb, var(--panel-border) 80%, transparent);
    background: transparent;
    color: var(--text-soft);
    font-size: clamp(10px, 1.5vw, 13px);
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
  }

  .segment:last-child {
    border-right: 0;
  }

  .label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .segment.complete {
    background: color-mix(in srgb, var(--brand) 22%, var(--panel));
    color: var(--text-main);
  }

  .segment.current {
    background: var(--brand);
    color: white;
  }

  .segment.future,
  .segment.locked:not(.active) {
    color: color-mix(in srgb, var(--text-soft) 80%, transparent);
  }

  .segment.active:not(.current) {
    box-shadow: inset 0 -3px 0 var(--brand);
    color: var(--text-main);
  }

  .segment:hover,
  .segment:focus-visible {
    color: var(--text-main);
  }

  .segment.current:hover,
  .segment.current:focus-visible {
    color: white;
  }
</style>
