<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import DiscussionComment from '$lib/components/discussion/DiscussionComment.svelte';
  import RoundPlusButton from '$lib/components/shared/RoundPlusButton.svelte';
  import { addComment } from '$lib/services/queries/details';
  import type { PostPageData, ThreadPageData } from '$lib/types/detail';

  export let data: Pick<PostPageData | ThreadPageData, 'id' | 'discussion'>;
  export let highlightedCommentId: string | null = null;

  type CommentSort = 'oldest' | 'newest' | 'top';

  let draftComment = '';
  let showComposer = false;
  let sortMode: CommentSort = 'oldest';

  $: sortedDiscussion = [...data.discussion].sort((left, right) => {
    if (sortMode === 'top') {
      return right.voteCount - left.voteCount || right.createdAt.localeCompare(left.createdAt);
    }

    if (sortMode === 'newest') {
      return right.createdAt.localeCompare(left.createdAt);
    }

    return left.createdAt.localeCompare(right.createdAt);
  });

  async function submitComment() {
    if (!draftComment.trim()) {
      return;
    }

    await addComment(data.id, draftComment);
    draftComment = '';
    showComposer = false;
    await invalidateAll();
  }

  function toggleComposer() {
    showComposer = !showComposer;
  }
</script>

<section class="discussion-shell" id="comments">
  <div class="discussion-toolbar">
    <label class="sort-control">
      <span>Sort comments</span>
      <select bind:value={sortMode} aria-label="Sort comments">
        <option value="oldest">Oldest first</option>
        <option value="newest">Newest first</option>
        <option value="top">Top voted</option>
      </select>
    </label>
  </div>

  <div class="composer-toggle-anchor">
    <RoundPlusButton active={showComposer} ariaLabel="Add comment" action={toggleComposer} />
  </div>

  {#if showComposer}
    <div class="composer-card">
      <textarea bind:value={draftComment} rows="4" placeholder="Write a comment..."></textarea>
      <div class="composer-actions">
        <button class="secondary-button" type="button" on:click={() => (showComposer = false)}>
          Cancel
        </button>
        <button class="primary-button" type="button" on:click={submitComment}>Add comment</button>
      </div>
    </div>
  {/if}

  <div class="stack">
    {#if data.discussion.length === 0}
      <div class="empty-card">
        <p>No comments yet.</p>
      </div>
    {:else}
      {#each sortedDiscussion as comment}
        <DiscussionComment {comment} subjectId={data.id} {highlightedCommentId} />
      {/each}
    {/if}
  </div>
</section>

<style>
  .discussion-shell,
  .stack,
  .composer-card {
    display: grid;
    gap: 10px;
  }

  .discussion-shell {
    position: relative;
    padding-top: 0;
  }

  .composer-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .composer-toggle-anchor {
    position: absolute;
    top: 34px;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2;
  }

  .discussion-toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 8px;
  }

  .sort-control {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .sort-control select {
    min-height: 32px;
    padding: 0 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-main);
  }

  .composer-card,
  .empty-card {
    padding: 10px 0;
    border: none;
    border-radius: 0;
    background: var(--panel);
  }

  .composer-card {
    margin-top: 10px;
  }

  textarea {
    width: 100%;
    min-height: 96px;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-main);
    resize: vertical;
  }

  .primary-button,
  .secondary-button {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
  }

  .primary-button {
    background: var(--brand);
    color: var(--page-bg);
  }

  .secondary-button {
    border: 1px solid var(--panel-border);
    background: var(--panel-strong);
    color: var(--text-soft);
  }

  .empty-card p {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.45;
  }
</style>