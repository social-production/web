<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import SubjectTablet from '$lib/components/cards/shared/SubjectTablet.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import Tablet from '$lib/components/cards/shared/Tablet.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import { setVote } from '$lib/services/queries/feeds';
  import type { PublicEventItem, VoteDirection } from '$lib/types/feed';
  import { isImplementedScheduleLabel } from '$lib/utils/scheduleMeta';
  import { describeUpdateTime } from '$lib/utils/time';

  export let item: PublicEventItem;

  $: orderedTags = [...item.channelTags, ...item.communityTags];
  $: scheduleTime = isImplementedScheduleLabel(item.timeLabel) ? item.timeLabel.trim() : '';
  $: scheduleLocation = isImplementedScheduleLabel(item.locationLabel) ? item.locationLabel.trim() : '';

  async function handleVote(event: CustomEvent<{ vote: VoteDirection }>) {
    await setVote(item.id, event.detail.vote);
    await invalidateAll();
  }
</script>

<FeedSurface href={item.href} tone="public">
  <div class="header-row">
    <div class="chips">
      <SubjectTablet kind="event" />
      <Tablet label={item.isPrivate ? 'Private' : 'Public'} variant="visibility" />
      {#if item.stage}
        <Tablet label={item.stage} variant="stage" />
      {/if}
    </div>

    <div class="tag-stack">
      <TagList columns={4} tags={orderedTags} />
    </div>
  </div>

  <a class="title" href={item.href}>{item.title}</a>
  <p class="body">{item.description}</p>
  {#if item.latestUpdateBody}
    <p class="latest-summary">Latest: {item.latestUpdateBody}</p>
  {/if}
  {#if scheduleTime || scheduleLocation}
    <p class="location">{[scheduleTime, scheduleLocation].filter(Boolean).join(' · ')}</p>
  {:else}
    <p class="location">Proposal schedule and location are set when an event plan is approved.</p>
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
        <a class="inline-link" href={`/profile/${item.createdByUsername}`}>{item.createdByUsername}</a>
        · {item.memberCount} members · <span class="activity-stamp">{describeUpdateTime(item.createdAt, item.latestUpdateAt)}</span>
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

  .body,
  .location,
  .latest-summary,
  .footer {
    color: var(--text-soft);
  }

  .body,
  .location,
  .latest-summary {
    margin: 6px 0 0;
    line-height: 1.4;
  }

  .latest-summary {
    display: -webkit-box;
    overflow: hidden;
    line-clamp: 2;
    -webkit-box-orient: vertical;
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

  @media (max-width: 760px) {
    .tag-stack {
      margin-left: 0;
    }

    .footer-meta {
      text-align: left;
    }
  }
</style>