<script lang="ts">
  import LandAssetDetailPage from '$lib/features/assets/LandAssetDetailPage.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<LandAssetDetailPage scope={data.scope} asset={data.asset} />