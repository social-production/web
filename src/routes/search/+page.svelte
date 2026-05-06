<script lang="ts">
  import SearchPage from '$lib/features/search/SearchPage.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<SearchPage data={data.search} />