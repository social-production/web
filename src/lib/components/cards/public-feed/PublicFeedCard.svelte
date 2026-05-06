<script lang="ts">
  import EventCard from '$lib/components/cards/public-feed/EventCard.svelte';
  import ProjectCard from '$lib/components/cards/public-feed/ProjectCard.svelte';
  import ThreadCard from '$lib/components/cards/public-feed/ThreadCard.svelte';
  import type { PublicFeedItem } from '$lib/types/feed';

  export let item: PublicFeedItem;
</script>

{#if item.kind === 'project'}
  <ProjectCard item={item} />
{:else if item.kind === 'thread'}
  <ThreadCard item={item} />
{:else}
  <EventCard item={item} />
{/if}