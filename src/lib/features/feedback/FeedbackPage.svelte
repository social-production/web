<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import FeedbackCard from '$lib/components/cards/feedback/FeedbackCard.svelte';
  import FeedbackComposeSheet from '$lib/components/shared/FeedbackComposeSheet.svelte';
  import FeedbackDetailSheet from '$lib/components/shared/FeedbackDetailSheet.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import IconMenuButton from '$lib/components/shared/IconMenuButton.svelte';
  import { createFeedback } from '$lib/services/commands/feedback';
  import { setVote } from '$lib/services/commands/shared';
  import { getFeedbackItem, getFeedbackPage } from '$lib/services/queries/feedback';
  import type {
    CreateFeedbackInput,
    FeedbackFilter,
    FeedbackItem,
    FeedbackPageResult,
    FeedbackSort,
  } from '$lib/types/feedback';
  import type { VoteDirection } from '$lib/types/feed';
  import { subscribeFeedToolbarLabels } from '$lib/utils/feedToolbarLabels';
  import { requireViewer } from '$lib/utils/requireViewer';
  import { onMount } from 'svelte';

  export let initialPage: FeedbackPageResult;

  const filterOptions: Array<{ value: FeedbackFilter; label: string }> = [
    { value: 'all', label: 'All feedback' },
    { value: 'bugs', label: 'Bugs' },
    { value: 'suggestions', label: 'Suggestions' },
  ];

  const sortOptions: Array<{ value: FeedbackSort; label: string }> = [
    { value: 'trending', label: 'Trending' },
    { value: 'recent', label: 'Most recent' },
  ];

  let activeFilter: FeedbackFilter = 'all';
  let activeSort: FeedbackSort = 'trending';
  let items: FeedbackItem[] = [];
  let pageLoading = false;
  let pageError = '';
  let composeOpen = false;
  let composePending = false;
  let composeMessage = '';
  let detailOpen = false;
  let detailItem: FeedbackItem | null = null;
  let detailRequestId = 0;
  let pageRequestId = 0;
  let showTriggerLabels = false;
  let lastHydratedUrl = '';
  let isSyncingUrl = false;
  let lastLoaderKey = '';
  let votePendingIds: Record<string, boolean> = {};

  function normalizeFilter(value: string | null | undefined): FeedbackFilter {
    const normalized = (value ?? '').trim().toLowerCase();
    if (normalized === 'bugs' || normalized === 'suggestions') {
      return normalized;
    }
    return 'all';
  }

  function normalizeSort(value: string | null | undefined): FeedbackSort {
    return (value ?? '').trim().toLowerCase() === 'recent' ? 'recent' : 'trending';
  }

  function applyLoaderPage(nextPage: FeedbackPageResult) {
    activeFilter = normalizeFilter(nextPage.filter);
    activeSort = normalizeSort(nextPage.sort);
    items = nextPage.items;
    pageError = '';
  }

  function emptyMessage() {
    if (activeFilter === 'bugs') {
      return 'No bugs have been submitted yet.';
    }
    if (activeFilter === 'suggestions') {
      return 'No suggestions have been submitted yet.';
    }
    return 'No feedback has been submitted yet.';
  }

  function syncDetailItem(itemId: string) {
    detailItem = items.find((item) => item.id === itemId) ?? detailItem;
  }

  function mergeItem(nextItem: FeedbackItem) {
    let found = false;
    items = items.map((item) => {
      if (item.id !== nextItem.id) {
        return item;
      }
      found = true;
      return nextItem;
    });
    if (!found && (activeFilter === 'all' || (activeFilter === 'bugs' && nextItem.kind === 'bug') || (activeFilter === 'suggestions' && nextItem.kind === 'suggestion'))) {
      items = [nextItem, ...items];
    }
    if (detailItem?.id === nextItem.id) {
      detailItem = nextItem;
    }
  }

  function nextVotedItem(item: FeedbackItem, nextVote: VoteDirection): FeedbackItem {
    let upvoteCount = item.upvoteCount;
    let downvoteCount = item.downvoteCount;
    let voteCount = item.voteCount;

    if (item.activeVote === 1) {
      upvoteCount -= 1;
      voteCount -= 1;
    } else if (item.activeVote === -1) {
      downvoteCount -= 1;
      voteCount += 1;
    }

    if (nextVote === 1) {
      upvoteCount += 1;
      voteCount += 1;
    } else if (nextVote === -1) {
      downvoteCount += 1;
      voteCount -= 1;
    }

    const totalVotes = upvoteCount + downvoteCount;
    return {
      ...item,
      activeVote: nextVote,
      voteCount,
      upvoteCount,
      downvoteCount,
      approvalPercent: totalVotes > 0 ? (upvoteCount / totalVotes) * 100 : 0,
    };
  }

  function setVotePending(itemId: string, pending: boolean) {
    const next = { ...votePendingIds };
    if (pending) {
      next[itemId] = true;
    } else {
      delete next[itemId];
    }
    votePendingIds = next;
  }

  async function syncQueryToUrl() {
    const params = new URLSearchParams($page.url.searchParams);

    if (activeFilter === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', activeFilter);
    }

    if (activeSort === 'trending') {
      params.delete('sort');
    } else {
      params.set('sort', activeSort);
    }

    const nextSearch = params.toString();
    const nextUrlSearch = nextSearch ? `?${nextSearch}` : '';
    if (nextUrlSearch === $page.url.search) {
      lastHydratedUrl = $page.url.search;
      return;
    }

    isSyncingUrl = true;
    lastHydratedUrl = nextUrlSearch;
    try {
      await goto(`${$page.url.pathname}${nextUrlSearch}`, {
        replaceState: true,
        noScroll: true,
        keepFocus: true,
      });
    } finally {
      lastHydratedUrl = $page.url.search;
      isSyncingUrl = false;
    }
  }

  async function loadItems() {
    const requestId = ++pageRequestId;
    pageLoading = true;
    pageError = '';

    try {
      const result = await getFeedbackPage({
        filter: activeFilter,
        sort: activeSort,
        limit: 100,
        offset: 0,
      });
      if (requestId !== pageRequestId) {
        return;
      }
      items = result.items;
    } catch {
      if (requestId === pageRequestId) {
        pageError = 'Could not load feedback right now.';
      }
    } finally {
      if (requestId === pageRequestId) {
        pageLoading = false;
      }
    }
  }

  async function updateControls(filter: FeedbackFilter, sort: FeedbackSort) {
    activeFilter = filter;
    activeSort = sort;
    await syncQueryToUrl();
    await loadItems();
  }

  async function handleCreateFeedback(input: CreateFeedbackInput) {
    composePending = true;
    composeMessage = '';

    const result = await createFeedback(input);
    if (!result.ok) {
      composePending = false;
      composeMessage = result.error ?? 'Could not submit feedback.';
      return;
    }

    composePending = false;
    composeOpen = false;
    composeMessage = '';
    await loadItems();
  }

  async function handleVote(itemId: string, nextVote: VoteDirection) {
    const viewer = $page.data.bootstrap?.viewer ?? null;
    if (!requireViewer(viewer, 'Sign in to vote on platform feedback.')) {
      return;
    }

    const currentItem = items.find((item) => item.id === itemId) ?? detailItem;
    if (!currentItem) {
      return;
    }

    const optimistic = nextVotedItem(currentItem, nextVote);
    mergeItem(optimistic);
    setVotePending(itemId, true);

    try {
      await setVote({ id: itemId, type: 'platform_feedback' }, nextVote);
    } catch {
      mergeItem(currentItem);
    } finally {
      setVotePending(itemId, false);
      syncDetailItem(itemId);
    }
  }

  async function openDetail(item: FeedbackItem) {
    detailItem = item;
    detailOpen = true;
    const requestId = ++detailRequestId;
    const fresh = await getFeedbackItem(item.id);
    if (requestId !== detailRequestId || !fresh) {
      return;
    }
    mergeItem(fresh);
  }

  function hydrateFromUrl() {
    activeFilter = normalizeFilter($page.url.searchParams.get('filter'));
    activeSort = normalizeSort($page.url.searchParams.get('sort'));
  }

  onMount(() => {
    const unsubscribeToolbar = subscribeFeedToolbarLabels((show) => {
      showTriggerLabels = show;
    });
    lastHydratedUrl = $page.url.search;
    return unsubscribeToolbar;
  });

  $: {
    const loaderKey = `${initialPage.filter}:${initialPage.sort}:${initialPage.count}:${initialPage.items.length}:${initialPage.items[0]?.id ?? ''}`;
    if (loaderKey !== lastLoaderKey) {
      lastLoaderKey = loaderKey;
      applyLoaderPage(initialPage);
      lastHydratedUrl = $page.url.search;
    }
  }

  $: if (!isSyncingUrl && $page.url.search !== lastHydratedUrl) {
    lastHydratedUrl = $page.url.search;
    hydrateFromUrl();
    void loadItems();
  }
</script>

<section class="feedback-page">
  <div class="page-hero">
    <div class="hero-copy">
      <p class="eyebrow">Platform feedback</p>
      <h1>Feedback</h1>
      <p class="hero-body">
        Track bugs, share suggestions, and vote on what the platform should fix or improve next.
        The code is on <a href="https://github.com/social-production" rel="noreferrer" target="_blank">GitHub</a>.
      </p>
    </div>

    <button class="create-button" type="button" on:click={() => (composeOpen = true)}>
      <FeedToolbarIcon name="plus" />
      <span>Add feedback</span>
    </button>
  </div>

  <div class="toolbar">
    <IconMenuButton
      ariaLabel="Filter feedback"
      options={filterOptions}
      showTriggerLabel={showTriggerLabels}
      value={activeFilter}
      on:change={(event) => updateControls(event.detail.value as FeedbackFilter, activeSort)}
    >
      <FeedToolbarIcon name="filter" />
    </IconMenuButton>

    <IconMenuButton
      ariaLabel="Sort feedback"
      options={sortOptions}
      showTriggerLabel={showTriggerLabels}
      value={activeSort}
      on:change={(event) => updateControls(activeFilter, event.detail.value as FeedbackSort)}
    >
      <FeedToolbarIcon name={activeSort === 'recent' ? 'clock' : 'trending'} />
    </IconMenuButton>
  </div>

  {#if pageError}
    <div class="status-card warning">{pageError}</div>
  {:else if pageLoading}
    <div class="status-card">Loading feedback…</div>
  {:else if items.length === 0}
    <div class="status-card">{emptyMessage()}</div>
  {:else}
    <div class="feedback-list">
      {#each items as item (item.id)}
        <FeedbackCard
          item={item}
          onOpen={() => openDetail(item)}
          onVote={(vote) => handleVote(item.id, vote)}
          pendingVote={Boolean(votePendingIds[item.id])}
        />
      {/each}
    </div>
  {/if}
</section>

<FeedbackComposeSheet
  bind:open={composeOpen}
  message={composeMessage}
  onSubmit={handleCreateFeedback}
  pending={composePending}
/>

<FeedbackDetailSheet
  bind:open={detailOpen}
  item={detailItem}
  onVote={(vote) => (detailItem ? handleVote(detailItem.id, vote) : undefined)}
  pendingVote={detailItem ? Boolean(votePendingIds[detailItem.id]) : false}
/>

<style>
  .feedback-page {
    display: grid;
    gap: 16px;
    min-width: 0;
    max-width: 100%;
    overflow-x: clip;
    padding: 20px 0 32px;
  }

  .page-hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    padding: 0 16px;
  }

  .hero-copy {
    display: grid;
    gap: 8px;
  }

  .eyebrow {
    margin: 0;
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    font-size: clamp(28px, 4vw, 38px);
    line-height: 1;
    letter-spacing: -0.03em;
  }

  .hero-body {
    max-width: 54ch;
    margin: 0;
    color: var(--text-soft);
    font-size: 14px;
    line-height: 1.55;
  }

  .hero-body a {
    color: var(--brand-strong);
    font-weight: 700;
  }

  .create-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    padding: 0 14px;
    border: 1px solid color-mix(in srgb, var(--brand) 72%, transparent);
    border-radius: var(--radius-sm);
    background: var(--brand);
    color: var(--page-bg);
    font-size: 13px;
    font-weight: 800;
    white-space: nowrap;
    cursor: pointer;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 16px;
  }

  .feedback-list {
    min-width: 0;
    max-width: 100%;
    overflow-x: clip;
    border-top: 1px solid color-mix(in srgb, var(--panel-border) 72%, transparent);
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 72%, transparent);
  }

  .status-card {
    margin: 0 16px;
    padding: 14px 16px;
    border: 1px solid color-mix(in srgb, var(--panel-border) 80%, transparent);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--panel-soft) 58%, transparent);
    color: var(--text-soft);
    font-size: 13px;
    font-weight: 600;
  }

  .status-card.warning {
    border-color: color-mix(in srgb, var(--accent-warm) 36%, var(--panel-border));
    color: var(--text-main);
  }

  @media (max-width: 760px) {
    .page-hero {
      flex-direction: column;
      align-items: stretch;
    }

    .create-button {
      justify-content: center;
      width: 100%;
    }
  }
</style>
