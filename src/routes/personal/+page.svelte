<script lang="ts">
  import PersonalFeed from '$lib/features/personal-feed/PersonalFeed.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  function reloadPage() {
    window.location.reload();
  }
</script>

{#if data.loadError}
  <section class="load-error">
    <p>{data.loadError}</p>
    <button type="button" on:click={reloadPage}>Retry</button>
  </section>
{:else}
  <PersonalFeed items={data.items} />
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
