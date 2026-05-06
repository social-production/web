<script lang="ts">
  import MessagesPage from '$lib/features/messages/MessagesPage.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<MessagesPage data={data.messages} />