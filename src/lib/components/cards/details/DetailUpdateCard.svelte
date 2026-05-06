<script lang="ts">
  import { browser } from '$app/environment';
  import type { DetailUpdate } from '$lib/types/detail';
  import { formatRelativeTime } from '$lib/utils/time';
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
  <strong class="update-title">{update.title}</strong>
  <p class="update-body">{update.body}</p>
  <div class="update-meta">
    <a class="inline-link" href={`/profile/${update.authorUsername}`}>{update.authorUsername}</a>
    <span>updated {formatRelativeTime(update.createdAt)}</span>
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

  .update-title {
    color: var(--text-main);
    font-size: 14px;
  }

  .update-body,
  .update-meta span {
    color: var(--text-soft);
    line-height: 1.45;
  }

  .update-body {
    margin: 0;
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

  .inline-link {
    color: var(--text-main);
    font-weight: 700;
  }

</style>