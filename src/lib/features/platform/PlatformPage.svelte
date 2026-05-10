<script lang="ts">
  import PlatformLayout from '$lib/features/platform/PlatformLayout.svelte';
  import type { ScopePageData } from '$lib/types/scope';

  export let scope: ScopePageData;
</script>

<PlatformLayout {scope} />