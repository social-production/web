<script lang="ts">
  import EventDetailPage from '$lib/features/events/EventDetailPage.svelte';
  import { page } from '$app/stores';
  import type { PageData } from './$types';

  export let data: PageData;

  function reloadPage() {
    window.location.reload();
  }
</script>

{#if data.loadError || !data.event}
  <section class="load-error">
    <p>{data.loadError ?? 'Could not load this event.'}</p>
    {#if !$page.data.bootstrap?.viewer}
      <!-- A private event's invitee may simply be signed out. -->
      <a class="sign-in" href={`/onboarding?next=${encodeURIComponent($page.url.pathname)}`}>Sign in</a>
    {/if}
    <button type="button" on:click={reloadPage}>Retry</button>
  </section>
{:else}
  {#key data.event.slug}
    <EventDetailPage data={data.event} />
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

  .sign-in {
    margin-right: 12px;
    font-weight: 700;
  }
</style>
