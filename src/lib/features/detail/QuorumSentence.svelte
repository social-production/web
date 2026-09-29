<script lang="ts">
  import QuorumHelp from '$lib/features/detail/QuorumHelp.svelte';

  export let text = '';
  export let votesRequired = 0;
  export let audienceSize = 0;
  export let audienceLabel = '';
  export let usesPlatform = false;
  export let entityLabel: 'project' | 'event' = 'project';

  $: match = text.match(/^(.*?\b)(quorum|threshold)(\b.*)$/i);
</script>

{#if match}
  {match[1]}<QuorumHelp
    label={match[2]}
    {votesRequired}
    {audienceSize}
    {audienceLabel}
    {usesPlatform}
    {entityLabel}
  />{match[3]}
{:else}
  {text}
{/if}
