<script lang="ts">
  import HelpRequestDetailPage from '$lib/features/help-requests/HelpRequestDetailPage.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<HelpRequestDetailPage data={data.helpRequest} />
