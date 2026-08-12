<script lang="ts">
  import { browser } from '$app/environment';
  import ContentMetaRow from '$lib/components/shared/ContentMetaRow.svelte';
  import type { DetailUpdate } from '$lib/types/detail';
  import { tick } from 'svelte';

  export let update: DetailUpdate;
  export let highlightedUpdateId: string | null = null;

  let cardElement: HTMLElement;
  let hasAutoScrolled = false;

  $: isHighlighted = highlightedUpdateId === update.id;

  $: if (!isHighlighted) {
    hasAutoScrolled = false;
  }

  $: if (browser && isHighlighted && cardElement && !hasAutoScrolled) {
    hasAutoScrolled = true;
    tick().then(() => {
      cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
</script>

<article
  id={`update-${update.id}`}
  bind:this={cardElement}
  class:highlighted={isHighlighted}
  class="update-card"
>
  <p class="update-body">{update.body}</p>
  <div class="update-meta">
    <ContentMetaRow authorUsername={update.authorUsername} createdAt={update.createdAt} />
  </div>
</article>

<style>
  .update-card {
    padding: 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    scroll-margin-top: 84px;
    display: grid;
    gap: 10px;
    transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;
  }

  .update-card.highlighted {
    border-color: var(--brand);
    background: var(--brand-soft);
    box-shadow: inset 0 0 0 1px var(--brand);
  }

  .update-body {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.45;
  }

  .update-meta {
    display: flex;
    justify-self: end;
    justify-content: flex-end;
    gap: 6px;
    flex-wrap: wrap;
    text-align: right;
    font-size: 12px;
  }
</style>
