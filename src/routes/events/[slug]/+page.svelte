<script lang="ts">
  import EventDetailPage from '$lib/features/events/EventDetailPage.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<EventDetailPage data={data.event} />