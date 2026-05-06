<script lang="ts">
  import ScopePage from '$lib/features/scopes/ScopePage.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<ScopePage scope={data.scope} />