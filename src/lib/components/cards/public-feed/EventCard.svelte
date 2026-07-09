<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import SurfaceTypeLabel from '$lib/components/cards/shared/SurfaceTypeLabel.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import { setVote } from '$lib/services/queries/feeds';
  import type { PublicEventItem, VoteDirection } from '$lib/types/feed';
  import { surfaceTypeAccent } from '$lib/utils/surfaceType';
  import { isImplementedScheduleLabel } from '$lib/utils/scheduleMeta';
  import { describeUpdateTime, formatLocalDateTime } from '$lib/utils/time';

  export let item: PublicEventItem;

  $: orderedTags = [...item.channelTags, ...item.communityTags];
  $: scheduleTime = item.scheduledAt
    ? formatLocalDateTime(item.scheduledAt)
    : isImplementedScheduleLabel(item.timeLabel)
      ? item.timeLabel.trim()
      : '';
  $: scheduleLocation = isImplementedScheduleLabel(item.locationLabel) ? item.locationLabel.trim() : '';

  async function handleVote(event: CustomEvent<{ vote: VoteDirection }>) {
    await setVote(item.id, event.detail.vote);
    await invalidateAll();
  }
</script>

<FeedSurface href={item.href} tone="public" accent={surfaceTypeAccent('event')}>
  <div class="header-row">
    <div class="chips">
      <SurfaceTypeLabel kind="event" />
      <span class="meta-note">· {item.isPrivate ? 'Private' : 'Public'}</span>
      {#if item.stage}
        <span class="meta-note">· {item.stage}</span>
      {/if}
    </div>

    <div class="tag-stack">
      <TagList tags={orderedTags} />
    </div>
  </div>

  <a class="title" href={item.href}>{item.title}</a>
  <p class="body">{item.description}</p>
  {#if item.latestUpdateBody}
    <p class="latest-summary">Latest: {item.latestUpdateBody}</p>
  {/if}
  {#if scheduleTime || scheduleLocation}
    <p class="location">{[scheduleTime, scheduleLocation].filter(Boolean).join(' · ')}</p>
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
    flex-wrap: nowrap;
    align-items: center;
    flex: 1 1 auto;
    min-width: 0;
  }

  .meta-note {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 600;
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

  .body {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-clamp: 3;
    -webkit-line-clamp: 3;
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
    .footer-meta {
      text-align: left;
    }
  }
</style>