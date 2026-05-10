<script lang="ts">
  import ChannelPage from '$lib/features/channels/ChannelPage.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<ChannelPage scope={data.scope} />