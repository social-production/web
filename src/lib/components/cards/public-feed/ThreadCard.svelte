<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import SurfaceTypeLabel from '$lib/components/cards/shared/SurfaceTypeLabel.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import { setVote } from '$lib/services/queries/feeds';
  import type { PublicThreadItem, VoteDirection } from '$lib/types/feed';
  import { surfaceTypeAccent } from '$lib/utils/surfaceType';
  import { describeActivityTime } from '$lib/utils/time';

  export let item: PublicThreadItem;

  $: orderedTags = [...item.channelTags, ...item.communityTags];

  async function handleVote(event: CustomEvent<{ vote: VoteDirection }>) {
    await setVote(item.id, event.detail.vote);
    await invalidateAll();
  }
</script>

<FeedSurface href={item.href} tone="public" accent={surfaceTypeAccent('thread')}>
  <div class="header-row">
    <div class="chips">
      <SurfaceTypeLabel kind="thread" />
    </div>

    {#if orderedTags.length > 0}
      <div class="tag-stack">
        <TagList tags={orderedTags} />
      </div>
    {/if}
  </div>

  <a class="title" href={item.href}>{item.title}</a>
  <p class="body">{item.body}</p>

  <div class="footer">
    <div class="engagement-row">
      <VoteStrip activeVote={item.activeVote} count={item.voteCount} on:vote={handleVote} />
      <a class="comment-link" href={item.href}>
        <CountPill label={`${item.commentCount} comments`} />
      </a>
    </div>
    <div class="footer-meta">
      <span>
        <a class="inline-link" href={`/profile/${item.authorUsername}`}>{item.authorUsername}</a>
        · <span class="activity-stamp">{describeActivityTime(item.createdAt, item.createdAt)}</span>
      </span>
    </div>
  </div>
</FeedSurface>

<style>
  .header-row,
  .footer {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .chips {
    display: flex;
    gap: 0.45rem;
    align-items: center;
    flex: 1 1 auto;
    min-width: 0;
  }

  .body,
  .footer {
    color: var(--text-soft);
  }

  .title {
    margin-top: 10px;
    font-size: 16px;
    font-weight: 800;
  }

  .body {
    margin: 6px 0 0;
    line-height: 1.4;
  }

  .tag-stack {
    margin-left: auto;
    flex: 0 1 auto;
    min-width: 0;
  }

  .footer {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--panel-border);
    font-size: 13px;
  }

  .inline-link {
    color: var(--text-main);
    font-weight: 700;
  }

  .engagement-row {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  .comment-link {
    text-decoration: none;
    color: inherit;
    border-radius: var(--radius-sm);
  }

  .footer-meta {
    text-align: right;
  }

  .activity-stamp {
    white-space: nowrap;
  }

  @media (max-width: 760px) {
    .title {
      font-size: 17px;
    }

    .body {
      font-size: 15px;
    }

    .footer-meta {
      text-align: left;
    }
  }
</style>
