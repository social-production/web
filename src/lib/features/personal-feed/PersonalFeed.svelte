<script lang="ts">
  import PageHeader from '$lib/components/shared/PageHeader.svelte';
  import PersonalFeedCard from '$lib/components/cards/personal-feed/PersonalFeedCard.svelte';
  import type { PersonalFeedItem } from '$lib/types/feed';

  export let items: PersonalFeedItem[];

  type PersonalFilter = 'all' | 'activity' | 'posts' | 'events';
  type FeedSort = 'popular' | 'recent';
  type FeedWindow = '12h' | '1d' | '7d' | '1m' | '1y' | 'all';

  let activeFilter: PersonalFilter = 'all';
  let activeSort: FeedSort = 'popular';
  let activeWindow: FeedWindow = 'all';

  function matchesFilter(item: PersonalFeedItem, filter: PersonalFilter) {
    if (filter === 'all') {
      return true;
    }

    if (filter === 'activity') {
      return item.kind === 'activity';
    }

    if (filter === 'posts') {
      return item.kind === 'post';
    }

    return item.kind === 'activity' && item.subjectKind === 'event';
  }

  function itemTimestamp(item: PersonalFeedItem) {
    return +(new Date(item.createdAt));
  }

  function timeWindowMs(window: FeedWindow) {
    switch (window) {
      case '12h':
        return 12 * 60 * 60 * 1000;
      case '1d':
        return 24 * 60 * 60 * 1000;
      case '7d':
        return 7 * 24 * 60 * 60 * 1000;
      case '1m':
        return 30 * 24 * 60 * 60 * 1000;
      case '1y':
        return 365 * 24 * 60 * 60 * 1000;
      default:
        return Number.POSITIVE_INFINITY;
    }
  }

  function matchesWindow(item: PersonalFeedItem, window: FeedWindow, referenceTime: number) {
    if (window === 'all') {
      return true;
    }

    return referenceTime - itemTimestamp(item) <= timeWindowMs(window);
  }

  function compareItems(left: PersonalFeedItem, right: PersonalFeedItem, sort: FeedSort) {
    if (sort === 'popular') {
      return right.voteCount - left.voteCount || itemTimestamp(right) - itemTimestamp(left);
    }

    return itemTimestamp(right) - itemTimestamp(left);
  }

  $: referenceTime = items.reduce((max, item) => Math.max(max, itemTimestamp(item)), 0);
  $: visibleItems = items
    .filter((item) => matchesFilter(item, activeFilter))
    .filter((item) => matchesWindow(item, activeWindow, referenceTime))
    .slice()
    .sort((left, right) => compareItems(left, right, activeSort));
</script>

<section class="feed-page">
  <PageHeader
    title="Personal"
    description="This timeline follows people instead of tags. Use it for direct social posting and followed-user public activity."
  />

  <section class="toolbar-card">
    <div class="controls-row">
      <select aria-label="Filter personal feed" bind:value={activeFilter}>
        <option value="all">All items</option>
        <option value="activity">Public activity</option>
        <option value="posts">Posts</option>
        <option value="events">Events</option>
      </select>

      <select aria-label="Sort personal feed by" bind:value={activeSort}>
        <option value="popular">Most popular</option>
        <option value="recent">Most recent</option>
      </select>

      <select aria-label="Personal feed time window" bind:value={activeWindow}>
        <option value="12h">Last 12 hours</option>
        <option value="1d">1 day</option>
        <option value="7d">7 days</option>
        <option value="1m">1 month</option>
        <option value="1y">1 year</option>
        <option value="all">All time</option>
      </select>
    </div>
  </section>

  <div class="stack">
    {#if visibleItems.length === 0}
      <section class="empty-card">
        <p>No posts or activity match this filter yet.</p>
      </section>
    {:else}
      {#each visibleItems as item}
        <PersonalFeedCard item={item} />
      {/each}
    {/if}
  </div>
</section>

<style>
  .feed-page,
  .stack {
    display: grid;
  }

  .feed-page {
    gap: 12px;
  }

  .stack {
    gap: 0;
  }

  .toolbar-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .controls-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(150px, 184px));
    gap: 8px;
    justify-content: start;
  }

  .controls-row select {
    min-width: 0;
    height: 38px;
    padding: 0 12px;
  }

  .empty-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: 0;
    background: var(--panel);
  }

  .empty-card p {
    color: var(--text-soft);
  }

  @media (max-width: 760px) {
    .controls-row {
      grid-template-columns: repeat(1, minmax(0, 1fr));
      width: 100%;
    }
  }
</style>