<script lang="ts">
  import { page } from '$app/stores';
  import ThreadDiscussionPanel from '$lib/features/threads/detail/ThreadDiscussionPanel.svelte';
  import ThreadOverviewPanel from '$lib/features/threads/detail/ThreadOverviewPanel.svelte';
  import type { ThreadPageData } from '$lib/types/detail';

  export let data: ThreadPageData;

  let highlightedCommentId: string | null = null;

  function readCommentTarget(url: URL) {
    if (url.hash.startsWith('#comment-')) {
      return url.hash.slice('#comment-'.length) || null;
    }

    return url.searchParams.get('comment');
  }

  $: highlightedCommentId = readCommentTarget($page.url);
</script>

<section class="page">
  <section class="hero-card">
    <section class="section-card">
      <ThreadOverviewPanel {data} />
    </section>

    <section class="section-card">
      <ThreadDiscussionPanel {data} {highlightedCommentId} />
    </section>
  </section>
</section>

<style>
  .page {
    display: grid;
    gap: 20px;
  }

  .hero-card {
    display: grid;
    gap: 24px;
    margin-top: 22px;
    overflow: visible;
  }

  .section-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }
</style>
