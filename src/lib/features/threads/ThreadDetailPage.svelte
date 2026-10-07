<script lang="ts">
  import { page } from '$app/stores';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import DiscussionPanel from '$lib/components/discussion/DiscussionPanel.svelte';
  import ThreadOverviewPanel from '$lib/features/threads/detail/ThreadOverviewPanel.svelte';
  import type { ThreadPageData } from '$lib/types/detail';
  import { surfaceTypeAccent } from '$lib/utils/surfaceType';

  export let data: ThreadPageData;

  type CommentSort = 'oldest' | 'newest' | 'top';

  let sortMode: CommentSort = 'oldest';

  function readCommentTarget(url: URL) {
    if (url.hash.startsWith('#comment-')) {
      return url.hash.slice('#comment-'.length) || null;
    }

    return url.searchParams.get('comment');
  }

  $: highlightedCommentId = readCommentTarget($page.url);
</script>

<section class="page">
  <FeedSurface tone="public" accent={surfaceTypeAccent('thread')} isLast clampExcerpts={false}>
    <ThreadOverviewPanel {data} bind:sortMode />

    <DiscussionPanel {data} subjectType="thread" {highlightedCommentId} bind:sortMode embedded />
  </FeedSurface>
</section>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-width: 0;
    min-height: calc(100dvh - var(--topbar-height, 0px) - var(--shell-bottom-nav-offset, 0px));
  }

  .page :global(.surface.has-accent) {
    --surface-pad-x: 12px;
    flex: 1 0 auto;
    border-left: 0;
    padding-left: 16px;
    background:
      linear-gradient(var(--row-accent), var(--row-accent)) left center / 4px 100% no-repeat,
      var(--panel);
  }

</style>
