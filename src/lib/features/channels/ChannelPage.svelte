<script lang="ts">
  import ChannelLayout from '$lib/features/channels/ChannelLayout.svelte';
  import type { ScopePageData } from '$lib/types/scope';

  export let scope: ScopePageData;
</script>

<ChannelLayout {scope} />