<script lang="ts">
  import { browser } from '$app/environment';
  import { invalidateAll } from '$app/navigation';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import { addComment } from '$lib/services/queries/details';
  import { setVote } from '$lib/services/queries/feeds';
  import type { DetailComment } from '$lib/types/detail';
  import type { VoteDirection } from '$lib/types/feed';
  import { tick } from 'svelte';
  import { formatRelativeTime } from '$lib/utils/time';

  export let comment: DetailComment;
  export let subjectId: string;
  export let highlightedCommentId: string | null = null;

  let draftReply = '';
  let replyOpen = false;
  let cardElement: HTMLElement;
  let hasAutoScrolled = false;

  $: isHighlighted = highlightedCommentId === comment.id;
  $: if (!isHighlighted) {
    hasAutoScrolled = false;
  }
  $: if (browser && isHighlighted && cardElement && !hasAutoScrolled) {
    hasAutoScrolled = true;
    tick().then(() => {
      cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  async function handleVote(event: CustomEvent<{ vote: VoteDirection }>) {
    await setVote(comment.id, event.detail.vote);
    await invalidateAll();
  }

  async function submitReply() {
    if (!draftReply.trim()) {
      return;
    }

    await addComment(subjectId, draftReply, comment.id);
    draftReply = '';
    replyOpen = false;
    await invalidateAll();
  }
</script>

<article
  id={`comment-${comment.id}`}
  bind:this={cardElement}
  class:highlighted={isHighlighted}
  class="comment-card"
>
  <div class="topline">
    <a class="author-link" href={`/profile/${comment.authorUsername}`}>{comment.authorUsername}</a>
    <span>{formatRelativeTime(comment.createdAt)}</span>
  </div>

  <p class="body">{comment.body}</p>

  <div class="actions-row">
    <VoteStrip activeVote={comment.activeVote} count={comment.voteCount} on:vote={handleVote} />
    <button class="reply-button" type="button" on:click={() => (replyOpen = !replyOpen)}>
      {replyOpen ? 'Cancel reply' : 'Reply'}
    </button>
  </div>

  {#if replyOpen}
    <div class="composer-card">
      <textarea bind:value={draftReply} rows="3" placeholder="Write a reply..."></textarea>
      <div class="composer-actions">
        <button class="primary-button" type="button" on:click={submitReply}>Add reply</button>
      </div>
    </div>
  {/if}

  {#if comment.replies.length > 0}
    <div class="reply-stack">
      {#each comment.replies as reply}
        <svelte:self comment={reply} {subjectId} {highlightedCommentId} />
      {/each}
    </div>
  {/if}
</article>

<style>
  .comment-card,
  .composer-card,
  .reply-stack {
    display: grid;
    gap: 12px;
  }

  .comment-card {
    padding: 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    scroll-margin-top: 84px;
    transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;
  }

  .comment-card.highlighted {
    border-color: var(--brand);
    background: var(--brand-soft);
    box-shadow: inset 0 0 0 1px var(--brand);
  }

  .topline,
  .actions-row,
  .composer-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }

  .topline,
  .actions-row {
    justify-content: space-between;
  }

  .author-link {
    font-weight: 800;
    color: var(--text-main);
  }

  .body,
  .topline span {
    color: var(--text-soft);
    line-height: 1.5;
  }

  .reply-stack {
    margin-left: 16px;
    padding-left: 14px;
    border-left: 2px solid var(--panel-border);
  }

  textarea {
    width: 100%;
    min-height: 96px;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
    resize: vertical;
  }

  .reply-button,
  .primary-button {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
  }

  .reply-button {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    color: var(--text-soft);
  }

  .primary-button {
    background: var(--brand);
    color: var(--page-bg);
  }
</style>