<script lang="ts">
  import EventDetailPage from '$lib/features/events/EventDetailPage.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  function reloadPage() {
    window.location.reload();
  }
</script>

{#if data.loadError || !data.event}
  <section class="load-error">
    <p>{data.loadError ?? 'Could not load this event.'}</p>
    <button type="button" on:click={reloadPage}>Retry</button>
  </section>
{:else}
  <EventDetailPage data={data.event} />
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
