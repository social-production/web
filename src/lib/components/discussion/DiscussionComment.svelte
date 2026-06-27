<script lang="ts">
  import { browser } from '$app/environment';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import ReportComposerModal from '$lib/components/shared/ReportComposerModal.svelte';
  import ReportMenu from '$lib/components/shared/ReportMenu.svelte';
  import { addComment, setReportVote, submitReport } from '$lib/services/queries/details';
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
  let reportModalOpen = false;
  let reportPending = false;
  let reportReason: 'spam' | 'serious-harm' = 'spam';
  let reportDescription = '';
  let revealHiddenBody = false;
  let cardElement: HTMLElement;
  let hasAutoScrolled = false;

  $: isHighlighted = highlightedCommentId === comment.id;
  $: viewerUsername = $page.data.bootstrap?.viewer?.username ?? null;
  $: supportsHiddenToggle =
    comment.report?.reason === 'serious-harm' || comment.report?.resolution === 'hidden';
  $: bodyIsHidden = supportsHiddenToggle && !revealHiddenBody;
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

  async function submitCommentReport() {
    reportPending = true;

    try {
      await submitReport(subjectId, comment.id, reportReason, reportDescription);
      closeReportComposer();
      await invalidateAll();
    } finally {
      reportPending = false;
    }
  }

  async function voteOnCommentReport(vote: 'yes' | 'no') {
    if (!comment.report) {
      return;
    }

    reportPending = true;

    try {
      await setReportVote(comment.report.id, vote);
      await invalidateAll();
    } finally {
      reportPending = false;
    }
  }

  function openReportComposer() {
    reportModalOpen = true;
  }

  function closeReportComposer() {
    reportModalOpen = false;
    reportReason = 'spam';
    reportDescription = '';
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

  {#if supportsHiddenToggle}
    <button
      aria-expanded={revealHiddenBody}
      class="hidden-toggle"
      type="button"
      on:click={() => (revealHiddenBody = !revealHiddenBody)}
    >
      <span class="hidden-plus">{revealHiddenBody ? '−' : '+'}</span>
      <span>{revealHiddenBody ? 'Hide' : 'Hidden'}</span>
    </button>
  {/if}

  {#if !bodyIsHidden}
    <p class="body">{comment.body}</p>
  {/if}

  <div class="actions-row">
    <VoteStrip activeVote={comment.activeVote} count={comment.voteCount} on:vote={handleVote} />
    <button class="reply-button" type="button" on:click={() => (replyOpen = !replyOpen)}>
      {replyOpen ? 'Cancel reply' : 'Reply'}
    </button>
    <ReportMenu
      blockedMessage={viewerUsername === comment.authorUsername ? "You can't report yourself" : ''}
      itemLabel="comment"
      report={comment.report ?? null}
      pending={reportPending}
      on:compose={openReportComposer}
      on:vote={(event) => voteOnCommentReport(event.detail.vote)}
    />
  </div>

  {#if replyOpen}
    <div class="composer-card">
      <textarea bind:value={draftReply} rows="3" placeholder="Write a reply..."></textarea>
      <div class="composer-actions">
        <button class="primary-button" type="button" on:click={submitReply}>Add reply</button>
      </div>
    </div>
  {/if}

  <ReportComposerModal
    bind:description={reportDescription}
    bind:open={reportModalOpen}
    bind:reason={reportReason}
    itemLabel="comment"
    pending={reportPending}
    on:close={closeReportComposer}
    on:submit={submitCommentReport}
  />

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
    gap: 10px;
  }

  .comment-card {
    padding: 6px 0 8px;
    border: none;
    border-radius: 0;
    background: var(--panel);
    scroll-margin-top: 84px;
    transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;
  }

  .comment-card.highlighted {
    background: color-mix(in srgb, var(--brand-soft) 30%, var(--panel));
    box-shadow: inset 2px 0 0 var(--brand);
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
    justify-content: flex-start;
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

  .body {
    margin: 0;
  }

  .reply-stack {
    margin-left: 14px;
    padding-left: 12px;
    border-left: 2px solid var(--panel-border);
  }

  textarea {
    width: 100%;
    min-height: 88px;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: white;
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

  .composer-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .hidden-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--text-soft);
    font-size: 13px;
    font-weight: 700;
  }

  .hidden-plus {
    display: inline-grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border: 1px solid var(--panel-border);
    border-radius: 50%;
    font-size: 16px;
    line-height: 1;
  }

</style>