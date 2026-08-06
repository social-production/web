<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import DiscussionComment from '$lib/components/discussion/DiscussionComment.svelte';
  import CommentComposer from '$lib/components/shared/CommentComposer.svelte';
  import { addComment } from '$lib/services/commands/shared';
  import type { DetailComment, PostPageData, ThreadPageData } from '$lib/types/detail';
  import type { VoteDirection } from '$lib/types/feed';
  import type { CommentSubjectType } from '$lib/types/governance';
  import { applyVoteTarget } from '$lib/utils/feedSignals';

  export let data: Pick<PostPageData | ThreadPageData, 'id' | 'discussion'>;
  export let subjectType: CommentSubjectType;
  export let highlightedCommentId: string | null = null;
  export let embedded = false;
  export let sortMode: CommentSort = 'oldest';

  type CommentSort = 'oldest' | 'newest' | 'top';

  let draftComment = '';
  let composer: CommentComposer;
  let voteOverrides: Record<string, { activeVote: VoteDirection; voteCount: number }> = {};
  let lastDiscussionRef: DetailComment[] | null = null;

  $: if (data.discussion !== lastDiscussionRef) {
    lastDiscussionRef = data.discussion;
    voteOverrides = {};
  }

  $: displayDiscussion = data.discussion.map((comment) => {
    const override = voteOverrides[comment.id];
    return override ? { ...comment, ...override } : comment;
  });

  $: sortedDiscussion = [...displayDiscussion].sort((left, right) => {
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

    await addComment({ id: data.id, type: subjectType }, draftComment);
    draftComment = '';
    await composer?.resetHeight();
    await invalidateAll();
  }

  function handleCommentVote(commentId: string, vote: VoteDirection) {
    const current =
      displayDiscussion.find((comment) => comment.id === commentId) ??
      data.discussion.find((comment) => comment.id === commentId);
    if (!current) {
      return;
    }

    const next = applyVoteTarget(current.activeVote, current.voteCount, vote);
    voteOverrides = {
      ...voteOverrides,
      [commentId]: next
    };
  }
</script>

<section class:embedded class="discussion-shell" id="comments">
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
      {#each sortedDiscussion as comment (comment.id)}
        <DiscussionComment
          {comment}
          subjectId={data.id}
          {subjectType}
          {highlightedCommentId}
          {embedded}
          onVote={(vote) => handleCommentVote(comment.id, vote)}
        />
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
