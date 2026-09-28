<script lang="ts">
  import FeedbackPage from '$lib/features/feedback/FeedbackPage.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<FeedbackPage initialPage={data.page} />
