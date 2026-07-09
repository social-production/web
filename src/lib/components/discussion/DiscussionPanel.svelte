<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import DiscussionComment from '$lib/components/discussion/DiscussionComment.svelte';
  import CommentComposer from '$lib/components/shared/CommentComposer.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import IconMenuButton from '$lib/components/shared/IconMenuButton.svelte';
  import { addComment } from '$lib/services/queries/details';
  import type { PostPageData, ThreadPageData } from '$lib/types/detail';

  export let data: Pick<PostPageData | ThreadPageData, 'id' | 'discussion'>;
  export let highlightedCommentId: string | null = null;
  export let embedded = false;

  type CommentSort = 'oldest' | 'newest' | 'top';

  const sortOptions = [
    { value: 'oldest', label: 'Oldest first' },
    { value: 'newest', label: 'Newest first' },
    { value: 'top', label: 'Top voted' }
  ];

  let draftComment = '';
  let sortMode: CommentSort = 'oldest';
  let composer: CommentComposer;

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
    await composer?.resetHeight();
    await invalidateAll();
  }
</script>

<section class:embedded class="discussion-shell" id="comments">
  <div class="discussion-toolbar">
    <IconMenuButton bind:value={sortMode} ariaLabel="Sort comments" options={sortOptions}>
      <FeedToolbarIcon name="sort" />
    </IconMenuButton>
  </div>

  <div class="composer-card">
    <CommentComposer
      bind:this={composer}
      bind:value={draftComment}
      placeholder="Write a comment..."
      submitLabel="Post comment"
      on:submit={submitComment}
    />
  </div>

  <div class="stack">
    {#if data.discussion.length === 0}
      <div class="empty-card">
        <p>No comments yet.</p>
      </div>
    {:else}
      {#each sortedDiscussion as comment}
        <DiscussionComment {comment} subjectId={data.id} {highlightedCommentId} {embedded} />
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
    min-width: 0;
  }

  .discussion-shell {
    padding-top: 0;
  }

  .discussion-shell.embedded {
    padding-top: 0;
  }

  .discussion-toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 4px;
  }

  .composer-card,
  .empty-card {
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    min-width: 0;
  }

  .empty-card p {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.45;
  }
</style>
