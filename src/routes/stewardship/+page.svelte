<script lang="ts">
  import PlatformPage from '$lib/features/platform/PlatformPage.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<PlatformPage scope={data.scope} />