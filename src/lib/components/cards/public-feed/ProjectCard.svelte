<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import SubjectTablet from '$lib/components/cards/shared/SubjectTablet.svelte';
  import Tablet from '$lib/components/cards/shared/Tablet.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import { setVote } from '$lib/services/queries/feeds';
  import type { PublicProjectItem, VoteDirection } from '$lib/types/feed';
  import { describeActivityTime } from '$lib/utils/time';

  export let item: PublicProjectItem;

  $: orderedTags = [...item.channelTags, ...item.communityTags];

  async function handleVote(event: CustomEvent<{ vote: VoteDirection }>) {
    await setVote(item.id, event.detail.vote);
    await invalidateAll();
  }
</script>

<FeedSurface href={item.href} tone="public">
  <div class="header-row">
    <div class="chips">
      <SubjectTablet kind="project" projectMode={item.projectMode} />
      <Tablet label={item.stage} variant="stage" />
    </div>

    <div class="tag-stack">
      <TagList columns={4} tags={orderedTags} />
    </div>
  </div>

  <a class="title" href={item.href}>{item.title}</a>
  <p class="summary">{item.summary}</p>

  {#if item.latestDescription}
    <p class="latest-summary">Latest: {item.latestDescription}</p>
  {/if}

  <div class="footer">
    <div class="engagement-row">
      <VoteStrip activeVote={item.activeVote} count={item.voteCount} on:vote={handleVote} />
      <a class="comment-link" href={`${item.href}?tab=chat`}>
        <CountPill label={`${item.commentCount} comments`} />
      </a>
    </div>
    <div class="footer-meta">
      <span>
        <a class="inline-link" href={`/profile/${item.authorUsername}`}>{item.authorUsername}</a>
        · {item.memberCount} members · <span class="activity-stamp">{describeActivityTime(item.createdAt, item.lastActivityAt)}</span>
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
  }

  .header-row,
  .footer {
    justify-content: space-between;
  }

  .chips {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .title {
    display: inline-block;
    margin-top: 10px;
    font-size: 16px;
    font-weight: 800;
  }

  .summary,
  .latest-summary {
    margin: 6px 0 0;
    color: var(--text-soft);
    line-height: 1.4;
  }

  .summary,
  .latest-summary {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .summary {
    line-clamp: 3;
    -webkit-line-clamp: 3;
  }

  .latest-summary {
    line-clamp: 2;
    -webkit-line-clamp: 2;
    color: var(--text-main);
    opacity: 0.84;
  }

  .tag-stack {
    margin-left: auto;
  }

  .footer {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--panel-border);
    color: var(--text-soft);
    font-size: 13px;
  }

  .engagement-row {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  .comment-link {
    text-decoration: none;
    border-radius: var(--radius-sm);
    outline: none;
    transition: opacity 0.1s;
  }

  .comment-link:hover,
  .comment-link:focus-visible {
    opacity: 0.75;
  }

  .footer-meta {
    text-align: right;
  }

  .inline-link {
    color: var(--text-main);
    font-weight: 700;
  }

  @media (max-width: 760px) {
    .tag-stack {
      margin-left: 0;
    }

    .footer-meta {
      text-align: left;
    }
  }
</style>