<script lang="ts">
  import AssetUseRequestFrame from './AssetUseRequestFrame.svelte';
  import BorrowingRequestFrame from './BorrowingRequestFrame.svelte';
  import DeliveryRequestFrame from './DeliveryRequestFrame.svelte';
  import RequestFrameCard from './RequestFrameCard.svelte';

  type RequestFrameItem = {
    id: string;
    title: string;
    body: string;
    statusLabel?: string;
  };

  export let title = '';
  export let description = '';
  export let frames: RequestFrameItem[] = [];
</script>

{#if frames.length > 0}
  <section class="request-frame-stack">
    {#if title}
      <div class="section-heading">
        <h2>{title}</h2>
        {#if description}
          <p>{description}</p>
        {/if}
      </div>
    {/if}

    <div class="request-grid">
      {#each frames as frame}
        {#if frame.id === 'borrowing'}
          <BorrowingRequestFrame title={frame.title} body={frame.body} statusLabel={frame.statusLabel ?? 'Frame only'} />
        {:else if frame.id === 'delivery'}
          <DeliveryRequestFrame title={frame.title} body={frame.body} statusLabel={frame.statusLabel ?? 'Frame only'} />
        {:else if frame.id === 'asset-use'}
          <AssetUseRequestFrame title={frame.title} body={frame.body} statusLabel={frame.statusLabel ?? 'Frame only'} />
        {:else}
          <RequestFrameCard title={frame.title} body={frame.body} statusLabel={frame.statusLabel ?? 'Frame only'} />
        {/if}
      {/each}
    </div>
  </section>
{/if}

<style>
  .request-frame-stack,
  .request-grid {
    display: grid;
    gap: 12px;
  }

  .request-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  h2 {
    margin: 0;
    color: var(--text-main);
    font-size: 16px;
  }

  p {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.6;
  }
</style>
