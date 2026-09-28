<script lang="ts">
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import QuorumExplanation from '$lib/features/detail/QuorumExplanation.svelte';

  export let votesRequired = 0;
  export let audienceSize = 0;
  export let audienceLabel = '';
  export let usesPlatform = false;
  export let entityLabel: 'project' | 'event' = 'project';
  export let label = 'quorum';

  let open = false;
</script>

<button class="quorum-link" type="button" aria-label="How quorum works" on:click={() => (open = true)}>
  {label}
</button>

<OverlaySheet bind:open elevated title="Quorum" labelledById="quorum-help-sheet">
  <QuorumExplanation {votesRequired} {audienceSize} {audienceLabel} {usesPlatform} {entityLabel} />
</OverlaySheet>

<style>
  .quorum-link {
    display: inline;
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    line-height: inherit;
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }

  .quorum-link:hover,
  .quorum-link:focus-visible {
    color: var(--brand-strong);
  }
</style>
