<script lang="ts">
  import AssetsLayout from '$lib/features/assets/AssetsLayout.svelte';
  import type { PlatformAssetsPageData } from '$lib/types/assets';
  import type { ScopePageData } from '$lib/types/scope';

  export let scope: ScopePageData;
  export let assets: PlatformAssetsPageData;
</script>

<AssetsLayout {scope} {assets} />