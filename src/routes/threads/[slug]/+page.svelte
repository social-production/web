<script lang="ts">
  import ThreadDetailPage from '$lib/features/threads/ThreadDetailPage.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  function reloadPage() {
    window.location.reload();
  }
</script>

{#if data.loadError || !data.thread}
  <section class="load-error">
    <p>{data.loadError ?? 'Could not load this thread.'}</p>
    <button type="button" on:click={reloadPage}>Retry</button>
  </section>
{:else}
  {#key data.thread.slug}
    <ThreadDetailPage data={data.thread} />
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
