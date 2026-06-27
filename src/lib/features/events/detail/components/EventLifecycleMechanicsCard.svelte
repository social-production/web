<script lang="ts">
  import PhaseHelpDisclosure from '$lib/components/shared/PhaseHelpDisclosure.svelte';
  import type { EventLifecyclePhase } from '$lib/types/detail';

  export let phase: EventLifecyclePhase;
  export let progressLabel = '';
</script>

<div class="phase-header">
  <div class="phase-line">
    <div class="phase-badges">
      <span class={`phase-badge ${phase.progressState}`}>{progressLabel}</span>
      {#if phase.betaLocked}
        <span class="phase-badge locked">Coming later</span>
      {/if}
    </div>
  </div>

  <div class="phase-copy">
    <div class="phase-title-row">
      <h2>{phase.title}</h2>
    </div>

    <PhaseHelpDisclosure
      mechanics={phase.mechanics}
      note={phase.note ?? null}
      progressState={phase.progressState}
      summary={phase.summary}
    />
  </div>
</div>

<style>
  .phase-copy,
  .phase-header {
    display: grid;
    gap: 12px;
  }

  .phase-line,
  .phase-badges,
  .phase-title-row {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .phase-line,
  .phase-title-row {
    justify-content: space-between;
  }

  .phase-title-row {
    justify-content: flex-start;
  }

  h2 {
    margin: 0;
    font-size: 16px;
    color: var(--text-main);
  }

  .phase-badge {
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
  }

  .phase-badge.current,
  .phase-badge.complete {
    border-color: color-mix(in srgb, var(--brand) 40%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 75%, var(--panel));
    color: var(--brand-strong);
  }

  .phase-badge.locked {
    border-color: var(--tablet-community-bg);
    background: color-mix(in srgb, var(--tablet-community-bg) 16%, var(--panel));
    color: var(--tablet-community-text);
  }

  .phase-badge.upcoming {
    border-color: color-mix(in srgb, var(--accent-warm) 40%, var(--panel-border));
    color: var(--accent-warm-strong);
  }
</style>
