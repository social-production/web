<script lang="ts">
  import AssetsPage from '$lib/features/assets/AssetsPage.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<AssetsPage scope={data.scope} assets={data.assets} />