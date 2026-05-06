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

  <div class="filters">
    <button class:active={activeFilter === 'all'} class="filter" type="button" on:click={() => (activeFilter = 'all')}>
      All
    </button>
    <button
      class:active={activeFilter === 'activity'}
      class="filter"
      type="button"
      on:click={() => (activeFilter = 'activity')}
    >
      Public Activity
    </button>
    <button class:active={activeFilter === 'posts'} class="filter" type="button" on:click={() => (activeFilter = 'posts')}>
      Posts
    </button>
    <button class:active={activeFilter === 'events'} class="filter" type="button" on:click={() => (activeFilter = 'events')}>
      Events
    </button>
  </div>

  <div class="controls-row">
    <label class="control-field">
      <span>Sort by</span>
      <select bind:value={activeSort}>
        <option value="popular">Most popular</option>
        <option value="recent">Most recent</option>
      </select>
    </label>

    <label class="control-field">
      <span>Window</span>
      <select bind:value={activeWindow}>
        <option value="12h">Last 12 hours</option>
        <option value="1d">1 day</option>
        <option value="7d">7 days</option>
        <option value="1m">1 month</option>
        <option value="1y">1 year</option>
        <option value="all">All time</option>
      </select>
    </label>
  </div>

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

  .filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .controls-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .control-field {
    display: grid;
    gap: 6px;
    min-width: min(220px, 100%);
  }

  .control-field span {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .filter {
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--panel-border);
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 13px;
    font-weight: 700;
    transition:
      border-color 120ms ease,
      background-color 120ms ease,
      color 120ms ease;
  }

  .filter:hover {
    border-color: var(--brand);
    background: color-mix(in srgb, var(--brand-soft) 72%, var(--panel-strong));
    color: var(--brand-strong);
  }

  .active {
    background: var(--brand-soft);
    color: var(--brand-strong);
    border-color: transparent;
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
</style>