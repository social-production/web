<script lang="ts">
  import NotificationsPage from '$lib/features/notifications/NotificationsPage.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<NotificationsPage data={data.notifications} />