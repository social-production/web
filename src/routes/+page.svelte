<script lang="ts">
  import PublicFeed from '$lib/features/public-feed/PublicFeed.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<PublicFeed items={data.items} />