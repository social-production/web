<script lang="ts">
  import ProjectDetailPage from '$lib/features/projects/ProjectDetailPage.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

{#key data.project.slug}
  <ProjectDetailPage data={data.project} />
{/key}