<script lang="ts">
  import PersonalFeed from '$lib/features/personal-feed/PersonalFeed.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<PersonalFeed items={data.items} />