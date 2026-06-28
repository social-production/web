<script lang="ts">
  import ProjectDetailPage from '$lib/features/projects/ProjectDetailPage.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  function reloadPage() {
    window.location.reload();
  }
</script>

{#if data.loadError || !data.project}
  <section class="load-error">
    <p>{data.loadError ?? 'Could not load this project.'}</p>
    <button type="button" on:click={reloadPage}>Retry</button>
  </section>
{:else}
  {#key data.project.slug}
    <ProjectDetailPage data={data.project} />
  {/key}
{/if}

<style>
  .load-error {
    margin: 24px;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--surface-1);
  }

  .load-error p {
    margin: 0 0 12px;
  }
</style>
