<script lang="ts">
  import EventCard from '$lib/components/cards/public-feed/EventCard.svelte';
  import HelpRequestCard from '$lib/components/cards/public-feed/HelpRequestCard.svelte';
  import ProjectActivityCard from '$lib/components/cards/public-feed/ProjectActivityCard.svelte';
  import ProjectCard from '$lib/components/cards/public-feed/ProjectCard.svelte';
  import ThreadCard from '$lib/components/cards/public-feed/ThreadCard.svelte';
  import type { PublicFeedItem } from '$lib/types/feed';

  export let item: PublicFeedItem;
</script>

{#if item.kind === 'project'}
  <ProjectCard {item} />
{:else if item.kind === 'project-activity'}
  <ProjectActivityCard {item} />
{:else if item.kind === 'thread'}
  <ThreadCard {item} />
{:else if item.kind === 'help-request'}
  <HelpRequestCard {item} />
{:else if item.kind === 'event'}
  <EventCard {item} />
{/if}
