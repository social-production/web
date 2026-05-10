<script lang="ts">
  import CommunityPage from '$lib/features/communities/CommunityPage.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<CommunityPage scope={data.scope} />