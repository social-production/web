<script lang="ts">
  import CommunityLayout from '$lib/features/communities/CommunityLayout.svelte';
  import type { ScopePageData } from '$lib/types/scope';

  export let scope: ScopePageData;
</script>

<CommunityLayout {scope} />