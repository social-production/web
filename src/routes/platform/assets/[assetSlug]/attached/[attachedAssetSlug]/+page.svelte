<script lang="ts">
  import AttachedAssetDetailPage from '$lib/features/assets/AttachedAssetDetailPage.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<AttachedAssetDetailPage
  scope={data.scope}
  parentAsset={data.parentAsset}
  asset={data.asset}
/>
