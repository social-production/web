<script lang="ts">
  import { page } from '$app/stores';
  import { invalidateAll } from '$app/navigation';
  import ThreadDiscussionPanel from '$lib/features/threads/detail/ThreadDiscussionPanel.svelte';
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import { setVote } from '$lib/services/queries/feeds';
  import type { PostPageData } from '$lib/types/detail';
  import type { VoteDirection } from '$lib/types/feed';
  import { formatRelativeTime } from '$lib/utils/time';

  export let data: PostPageData;

  function readCommentTarget(url: URL) {
    if (url.hash.startsWith('#comment-')) {
      return url.hash.slice('#comment-'.length) || null;
    }

    return url.searchParams.get('comment');
  }

  $: highlightedCommentId = readCommentTarget($page.url);

  async function handleVote(event: CustomEvent<{ vote: VoteDirection }>) {
    await setVote(data.id, event.detail.vote);
    await invalidateAll();
  }
</script>

<section class="page">
  <section class="hero-card">
    <div class="identity-row">
      <AvatarBadge size="md" username={data.authorUsername} />
      <div class="identity-copy">
        <div class="name-line">
          <a class="inline-link" href={`/profile/${data.authorUsername}`}>{data.authorUsername}</a>
          <span class="chip post">Post</span>
        </div>
      </div>
    </div>

    <p class="body">{data.body}</p>

    <div class="engagement-row">
      <div class="engagement-actions">
        <VoteStrip activeVote={data.activeVote} count={data.voteCount} on:vote={handleVote} />
        <CountPill label={`${data.commentCount} comments`} />
      </div>
      <span>{formatRelativeTime(data.createdAt)}</span>
    </div>
  </section>

  <section class="panel">
    <ThreadDiscussionPanel {data} {highlightedCommentId} />
  </section>
</section>

<style>
  .page {
    display: grid;
    gap: 12px;
  }

  .hero-card,
  .panel {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .identity-row,
  .engagement-row,
  .engagement-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }

  .engagement-row {
    justify-content: space-between;
  }

  .identity-copy {
    display: grid;
    gap: 6px;
  }

  .inline-link {
    color: var(--text-main);
    font-size: 16px;
    font-weight: 800;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
  }

  .post {
    background: var(--accent-warm-soft);
    color: var(--accent-warm-strong);
  }

  .body,
  p,
  span {
    color: var(--text-soft);
    line-height: 1.5;
  }

  .body {
    margin-top: 14px;
    margin-bottom: 18px;
    font-size: 15px;
  }
</style>
