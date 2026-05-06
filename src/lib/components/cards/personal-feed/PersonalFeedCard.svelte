<script lang="ts">
  import PersonalActivityCard from '$lib/components/cards/personal-feed/PersonalActivityCard.svelte';
  import PersonalPostCard from '$lib/components/cards/personal-feed/PersonalPostCard.svelte';
  import type { PersonalFeedItem } from '$lib/types/feed';

  export let item: PersonalFeedItem;
</script>

{#if item.kind === 'post'}
  <PersonalPostCard item={item} />
{:else}
  <PersonalActivityCard item={item} />
{/if}