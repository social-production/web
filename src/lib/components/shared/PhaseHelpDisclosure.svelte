<script lang="ts">
  export let summary = '';
  export let mechanics: string[] = [];
  export let note: string | null = null;
  export let progressState: 'complete' | 'current' | 'upcoming' | 'locked' = 'current';

  function phaseSubtitle(value: string) {
    const firstSentence = value.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();

    return firstSentence && firstSentence.length > 0 ? firstSentence : value.trim();
  }

  $: inlineSubtitle = phaseSubtitle(summary);
  $: hasDetails = mechanics.length > 0 || (note?.trim().length ?? 0) > 0;
</script>

<div class="phase-help">
  <p class="phase-subtitle">{inlineSubtitle}</p>

  {#if hasDetails}
    <details class="phase-details">
      <summary>How this phase works</summary>
      <div class="phase-details-body">
        {#if mechanics.length > 0}
          <ul class="phase-list">
            {#each mechanics as mechanic}
              <li>{mechanic}</li>
            {/each}
          </ul>
        {/if}
        {#if note}
          <p class:locked-copy={progressState === 'locked'} class="phase-note">{note}</p>
        {/if}
      </div>
    </details>
  {/if}
</div>

<style>
  .phase-help {
    display: grid;
    gap: 8px;
  }

  .phase-subtitle {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-soft);
  }

  .phase-details {
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    padding: 10px 12px;
  }

  summary {
    cursor: pointer;
    color: var(--brand-strong);
    font-size: 13px;
    font-weight: 600;
    list-style: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  .phase-details-body {
    display: grid;
    gap: 10px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--panel-border);
  }

  .phase-list {
    margin: 0;
    padding-left: 18px;
    display: grid;
    gap: 8px;
  }

  li,
  .phase-note {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.5;
  }

  .locked-copy {
    color: var(--tablet-community-text);
  }
</style>
