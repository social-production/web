<script lang="ts">
  import type { ProjectLifecyclePhase } from '$lib/types/detail';

  export let phase: ProjectLifecyclePhase;
  export let progressLabel = '';
  export let showHowItWorks = false;

  function phaseSubtitle(summary: string) {
    const firstSentence = summary.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();

    return firstSentence && firstSentence.length > 0 ? firstSentence : summary.trim();
  }

  $: inlineSubtitle = phaseSubtitle(phase.summary);
</script>

<div class="phase-header">
  <div class="phase-line">
    <span class="phase-kicker">{phase.shortLabel}</span>
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

    <div class="phase-subtitle-row">
      <p class="phase-subtitle">{inlineSubtitle}</p>
      <button
        class="phase-help-button"
        type="button"
        aria-label={showHowItWorks ? 'Hide how it works' : 'Show how it works'}
        aria-expanded={showHowItWorks}
        on:click={() => (showHowItWorks = !showHowItWorks)}
      >
        ?
      </button>
    </div>
  </div>
</div>

{#if showHowItWorks}
  <div class="mechanics-card">
    <div class="mechanics-body">
      <p>{phase.summary}</p>
      {#if phase.note}
        <p class:locked-copy={phase.progressState === 'locked'} class="phase-note">{phase.note}</p>
      {/if}
      <ul class="phase-list">
        {#each phase.mechanics as mechanic}
          <li>{mechanic}</li>
        {/each}
      </ul>
    </div>
  </div>
{/if}

<style>
  .phase-copy,
  .mechanics-card,
  .phase-header {
    display: grid;
    gap: 12px;
  }

  .phase-line,
  .phase-badges,
  .phase-title-row,
  .phase-subtitle-row {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .phase-line,
  .phase-title-row {
    justify-content: space-between;
  }

  .mechanics-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .phase-kicker {
    color: var(--brand-strong);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .phase-title-row {
    justify-content: flex-start;
  }

  .phase-subtitle-row {
    justify-content: flex-start;
    align-items: flex-start;
    gap: 8px;
  }

  .phase-help-button {
    width: 26px;
    height: 26px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel);
    color: var(--text-main);
    font-size: 14px;
    font-weight: 700;
    line-height: 1;
    display: grid;
    place-items: center;
  }

  h2 {
    margin: 0;
    font-size: 16px;
    color: var(--text-main);
  }

  .phase-subtitle {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-soft);
  }

  p,
  li {
    color: var(--text-soft);
    line-height: 1.5;
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

  .phase-list {
    margin: 0;
    padding-left: 18px;
    display: grid;
    gap: 10px;
  }

  .mechanics-body {
    display: grid;
    gap: 12px;
  }

  .locked-copy {
    color: var(--tablet-community-text);
  }
</style>