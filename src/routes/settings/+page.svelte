<script lang="ts">
  import SettingsPage from '$lib/features/settings/SettingsPage.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<SettingsPage data={data.settings} />