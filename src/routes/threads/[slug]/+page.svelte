<script lang="ts">
  import ThreadDetailPage from '$lib/features/threads/ThreadDetailPage.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<ThreadDetailPage data={data.thread} />