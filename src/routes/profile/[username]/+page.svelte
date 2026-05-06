<script lang="ts">
  import ProfilePage from '$lib/features/profile/ProfilePage.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<ProfilePage data={data.profile} />