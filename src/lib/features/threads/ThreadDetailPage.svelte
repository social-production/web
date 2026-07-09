<script lang="ts">
  import { page } from '$app/stores';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import DiscussionPanel from '$lib/components/discussion/DiscussionPanel.svelte';
  import ThreadOverviewPanel from '$lib/features/threads/detail/ThreadOverviewPanel.svelte';
  import type { ThreadPageData } from '$lib/types/detail';
  import { surfaceTypeAccent } from '$lib/utils/surfaceType';

  export let data: ThreadPageData;

  function readCommentTarget(url: URL) {
    if (url.hash.startsWith('#comment-')) {
      return url.hash.slice('#comment-'.length) || null;
    }

    return url.searchParams.get('comment');
  }

  $: highlightedCommentId = readCommentTarget($page.url);
</script>

<section class="page">
  <FeedSurface tone="public" accent={surfaceTypeAccent('thread')} isLast>
    <ThreadOverviewPanel {data} />

    <div class="comments-divider" aria-hidden="true"></div>

    <DiscussionPanel {data} {highlightedCommentId} embedded />
  </FeedSurface>
</section>

<style>
  .page {
    display: grid;
    gap: 0;
    min-width: 0;
  }

  .comments-divider {
    margin: 16px 0 4px;
    border-top: 1px solid var(--panel-border);
  }
</style>
