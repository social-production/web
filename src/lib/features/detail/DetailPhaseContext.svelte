<script lang="ts">
  export let kicker = '';
  export let title = '';
  export let summary = '';

  $: sharpSummary = summary.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || summary.trim();
</script>

<header class="phase-context overview-phase-context">
  {#if kicker}
    <p class="kicker">{kicker}</p>
  {/if}
  <h2>{title}</h2>
  {#if sharpSummary}
    <p class="summary">{sharpSummary}</p>
  {/if}
</header>

<style>
  .phase-context {
    display: grid;
    gap: 6px;
    min-width: 0;
    max-width: 68ch;
  }

  .kicker {
    margin: 0;
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  h2 {
    margin: 0;
    color: var(--text-main);
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.2;
    overflow-wrap: break-word;
  }

  @media (max-width: 760px) {
    h2 {
      font-size: clamp(16px, 4.6vw, 20px);
    }
  }

  .summary {
    margin: 0;
    color: var(--text-soft);
    font-size: 14px;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }
</style>
