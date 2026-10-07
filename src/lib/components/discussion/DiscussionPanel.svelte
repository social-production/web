<script lang="ts">
  import { invalidate } from '$app/navigation';
  import DiscussionComment from '$lib/components/discussion/DiscussionComment.svelte';
  import CommentComposer from '$lib/components/shared/CommentComposer.svelte';
  import { addComment } from '$lib/services/commands/shared';
  import type { DetailComment, PostPageData, ThreadPageData } from '$lib/types/detail';
  import type { VoteDirection } from '$lib/types/feed';
  import type { CommentSubjectType } from '$lib/types/governance';
  import { applyVoteTarget } from '$lib/utils/feedSignals';

  export let data: Pick<PostPageData | ThreadPageData, 'id' | 'discussion'> & {
    slug?: string;
  };
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
    const dependency =
      subjectType === 'post' ? `app:post:${data.id}` : data.slug ? `app:thread:${data.slug}` : null;
    if (dependency) {
      void invalidate(dependency);
    }
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
      [commentId]: next,
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

  .composer-card {
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    min-width: 0;
  }

  .discussion-shell:has(:global(.comment-card.reply-open)) > .composer-card {
    display: none;
  }

  @media (max-width: 760px) {
    :global(html:has(.discussion-shell)) {
      --detail-action-dock-height: 64px;
    }

    :global(html:has(.discussion-shell:has(.comment-card.reply-open))) {
      --detail-action-dock-height: 0px;
    }

    .discussion-shell {
      padding-bottom: 72px;
    }

    .discussion-shell:has(:global(.comment-card.reply-open)) {
      padding-bottom: 0;
    }

    .composer-card {
      position: fixed;
      left: 0;
      right: 0;
      bottom: var(--shell-bottom-nav-offset, 0px);
      z-index: 40;
      padding: 8px 12px;
      border-top: 1px solid var(--panel-border);
      background: var(--panel);
    }
  }
</style>
