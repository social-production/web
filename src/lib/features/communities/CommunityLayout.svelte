<script lang="ts">
  import DirectoryFeedLayout from '$lib/features/shared-directory/DirectoryFeedLayout.svelte';
  import type { ScopePageData } from '$lib/types/scope';

  export let scope: ScopePageData;
</script>

<DirectoryFeedLayout pageData={scope} />