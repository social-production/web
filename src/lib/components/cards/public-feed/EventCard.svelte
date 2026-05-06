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
  import { describeActivityTime } from '$lib/utils/time';

  export let item: PublicEventItem;

  $: orderedTags = [...item.channelTags, ...item.communityTags];

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
    </div>

    <div class="tag-stack">
      <TagList columns={4} tags={orderedTags} />
    </div>
  </div>

  <a class="title" href={item.href}>{item.title}</a>
  <p class="body">{item.description}</p>
  <p class="location">{item.timeLabel} · {item.locationLabel}</p>

  <div class="footer">
    <div class="engagement-row">
      <VoteStrip activeVote={item.activeVote} count={item.voteCount} on:vote={handleVote} />
      <CountPill label={`${item.commentCount} comments`} />
    </div>
    <div class="footer-meta">
      <span>
        <a class="inline-link" href={`/profile/${item.createdByUsername}`}>{item.createdByUsername}</a>
        · {item.goingCount} going · <span class="activity-stamp">{describeActivityTime(item.createdAt, item.lastActivityAt)}</span>
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
  .footer {
    color: var(--text-soft);
  }

  .body,
  .location {
    margin: 6px 0 0;
    line-height: 1.4;
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