<script lang="ts">
  import AssetDetailPage from '$lib/features/assets/AssetDetailPage.svelte';
  import type { LandAssetRecord } from '$lib/types/assets';
  import type { ScopePageData } from '$lib/types/scope';

  export let scope: ScopePageData;
  export let asset: LandAssetRecord;
</script>

<AssetDetailPage {scope} {asset} />