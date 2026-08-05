<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import PublicFeedCard from '$lib/components/cards/public-feed/PublicFeedCard.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import IconMenuButton from '$lib/components/shared/IconMenuButton.svelte';
  import InfiniteFeedSentinel from '$lib/components/shared/InfiniteFeedSentinel.svelte';
  import PlatformBoardPanel from '$lib/features/platform/board/PlatformBoardPanel.svelte';
  import ScopeDirectoryHeader from '$lib/features/shared-directory/ScopeDirectoryHeader.svelte';
  import {
    DEFAULT_FEED_PAGE_SIZE,
    appendUniqueById
  } from '$lib/features/feed/feedPagination';
  import { refreshBootstrap } from '$lib/services/queries/bootstrap';
  import { getScopeFeedPage } from '$lib/services/queries/feeds';
  import { redeemScopeInvite, toggleScopeMembership, castModeratorVote } from '$lib/services/queries/scopes';
  import { parseInviteToken } from '$lib/utils/invite-token';
  import type { VoteDirection } from '$lib/types/feed';
  import type { ScopeMemberSummary, ScopePageData } from '$lib/types/scope';
  import {
    normalizeFeedFilter,
    normalizeFeedSort,
    normalizeFeedWindow
  } from '$lib/utils/feedQuery';

  export let pageData: ScopePageData;

  type DirectoryFilter = 'all' | 'projects' | 'threads' | 'events' | 'help_requests';
  type FeedSort = 'trending' | 'recent';
  type FeedWindow = 'today' | 'week' | 'month' | 'all';

  const filterOptions = [
    { value: 'all', label: 'All items' },
    { value: 'projects', label: 'Projects', icon: 'project' as const },
    { value: 'threads', label: 'Threads', icon: 'thread' as const },
    { value: 'events', label: 'Events', icon: 'event' as const },
    { value: 'help_requests', label: 'Help requests', icon: 'help-request' as const }
  ];

  const sortOptions = [
    { value: 'trending', label: 'Trending' },
    { value: 'recent', label: 'Most recent' }
  ];

  const windowOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This week' },
    { value: 'month', label: 'This month' },
    { value: 'all', label: 'All time' }
  ];

  let activeFilter: DirectoryFilter = 'all';
  let activeSort: FeedSort = 'trending';
  let activeWindow: FeedWindow = 'all';
  let feedItems = pageData.feed;
  let feedLoading = false;
  let feedLoadingMore = false;
  let feedHasMore = pageData.feed.length >= DEFAULT_FEED_PAGE_SIZE;
  let feedOffset = pageData.feed.length;
  let feedRequestId = 0;
  let lastLoadedQuery = '';
  let lastPageSlug = pageData.slug;
  let lastHydratedUrl = '';
  let isSyncingFeedUrl = false;
  let preferencesReady = false;
  let showBoardPanel = false;
  let showInvitePanel = false;
  let membershipPending = false;
  let inviteDraft = '';
  let invitePending = false;
  let inviteFeedback = '';
  let inviteFeedbackTone: 'soft' | 'warning' = 'soft';
  let lastInviteParam = '';
  let autoRedeemAttempted = false;

  $: showRolePanel = pageData.kind === 'platform';
  $: if (!showRolePanel && showBoardPanel) {
    showBoardPanel = false;
  }
  let scopeKind: 'channel' | 'community' = 'channel';
  $: scopeKind = pageData.kind === 'community' ? 'community' : 'channel';
  $: if (pageData.slug !== lastPageSlug) {
    lastPageSlug = pageData.slug;
    feedItems = pageData.feed;
    feedOffset = pageData.feed.length;
    feedHasMore = pageData.feed.length >= DEFAULT_FEED_PAGE_SIZE;
    lastLoadedQuery = '';
    hydrateFromUrl();
    lastHydratedUrl = $page.url.search;
    void loadFeedItems();
  }
  $: {
    const inviteParam = $page.url.searchParams.get('invite') ?? '';

    if (inviteParam && inviteParam !== lastInviteParam && !pageData.membership.viewerIsMember) {
      inviteDraft = inviteParam;
      inviteFeedback = '';
      inviteFeedbackTone = 'soft';
      showInvitePanel = true;

      if (!autoRedeemAttempted) {
        autoRedeemAttempted = true;
        void handleInviteRedeem();
      }
    }

    if (!inviteParam) {
      autoRedeemAttempted = false;
    }

    lastInviteParam = inviteParam;
  }

  function normalizeDirectoryFilter(value: string | null | undefined): DirectoryFilter {
    const normalized = normalizeFeedFilter(value);
    return normalized;
  }

  function normalizeDirectorySort(value: string | null | undefined): FeedSort {
    const normalized = normalizeFeedSort(value);
    return normalized === 'recent' ? 'recent' : 'trending';
  }

  function hydrateFromUrl() {
    const params = $page.url.searchParams;
    activeFilter = normalizeDirectoryFilter(params.get('filter'));
    activeSort = normalizeDirectorySort(params.get('sort'));
    activeWindow = normalizeFeedWindow(params.get('window')) as FeedWindow;
  }

  async function syncFeedQueryToUrl() {
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

    if (activeWindow === 'all') {
      params.delete('window');
    } else {
      params.set('window', activeWindow);
    }

    const nextSearch = params.toString();
    const nextUrlSearch = nextSearch ? `?${nextSearch}` : '';
    if (nextUrlSearch === $page.url.search) {
      lastHydratedUrl = $page.url.search;
      return;
    }

    isSyncingFeedUrl = true;
    lastHydratedUrl = nextUrlSearch;
    try {
      await goto(`${$page.url.pathname}${nextUrlSearch}`, {
        replaceState: true,
        noScroll: true,
        keepFocus: true
      });
    } finally {
      lastHydratedUrl = $page.url.search;
      isSyncingFeedUrl = false;
    }
  }

  function currentFeedQueryKey() {
    return `${pageData.kind}:${pageData.slug}:${activeFilter}:${activeSort}:${activeWindow}`;
  }

  async function loadFeedItems() {
    if (!pageData.membership.viewerCanSeeFeed) {
      feedItems = [];
      feedHasMore = false;
      feedOffset = 0;
      return;
    }

    const feedQueryKey = currentFeedQueryKey();
    if (feedQueryKey === lastLoadedQuery && feedItems.length > 0) {
      return;
    }

    const requestId = ++feedRequestId;
    feedLoading = true;
    feedLoadingMore = false;
    feedHasMore = true;
    feedOffset = 0;

    try {
      const pageResult = await getScopeFeedPage({
        kind: scopeKind,
        slug: pageData.slug,
        sort: activeSort,
        window: activeWindow,
        filter: activeFilter,
        limit: DEFAULT_FEED_PAGE_SIZE,
        offset: 0
      });
      if (requestId === feedRequestId) {
        feedItems = pageResult.items;
        feedOffset = pageResult.items.length;
        feedHasMore = pageResult.hasMore;
        lastLoadedQuery = feedQueryKey;
      }
    } finally {
      if (requestId === feedRequestId) {
        feedLoading = false;
      }
    }
  }

  async function loadMoreFeedItems() {
    if (!pageData.membership.viewerCanSeeFeed || feedLoading || feedLoadingMore || !feedHasMore) {
      return;
    }

    const requestId = ++feedRequestId;
    feedLoadingMore = true;
    try {
      const pageResult = await getScopeFeedPage({
        kind: scopeKind,
        slug: pageData.slug,
        sort: activeSort,
        window: activeWindow,
        filter: activeFilter,
        limit: DEFAULT_FEED_PAGE_SIZE,
        offset: feedOffset
      });
      if (requestId !== feedRequestId) {
        return;
      }
      feedItems = appendUniqueById(feedItems, pageResult.items);
      feedOffset += pageResult.items.length;
      feedHasMore = pageResult.hasMore;
    } finally {
      if (requestId === feedRequestId) {
        feedLoadingMore = false;
      }
    }
  }

  function handleFeedQueryChange() {
    lastLoadedQuery = '';
    feedItems = [];
    void syncFeedQueryToUrl();
    void loadFeedItems();
  }

  $: if (preferencesReady && !isSyncingFeedUrl && $page.url.search !== lastHydratedUrl) {
    lastHydratedUrl = $page.url.search;
    hydrateFromUrl();
    lastLoadedQuery = '';
    feedItems = [];
    void loadFeedItems();
  }

  onMount(() => {
    hydrateFromUrl();
    lastHydratedUrl = $page.url.search;
    preferencesReady = true;
    void syncFeedQueryToUrl();
    lastLoadedQuery = '';
    void loadFeedItems();
  });

  function meetsConfidenceThreshold(member: ScopeMemberSummary) {
    return (
      member.confidenceStandingState === 'active' ||
      member.confidenceStandingState === 'grace' ||
      member.confidenceStandingState === 'qualifying'
    );
  }

  function boardStatusLabel(member: ScopeMemberSummary) {
    if (member.confidenceStandingState === 'active') {
      return 'Standing confirmed';
    }

    if (member.confidenceStandingState === 'grace') {
      return 'Grace period';
    }

    if (member.confidenceStandingState === 'qualifying') {
      return 'Qualifying';
    }

    return 'Needs more standing votes';
  }

  async function handleConfidenceVote(member: ScopeMemberSummary, vote: VoteDirection) {
    if (!member.confidenceTargetId) {
      return;
    }
    if (vote === 0) {
      await castModeratorVote(member.confidenceTargetId, 'neutral');
    } else {
      await castModeratorVote(member.confidenceTargetId, vote === 1 ? 'yes' : 'no');
    }
    await invalidateAll();
  }

  async function handleMembershipToggle() {
    membershipPending = true;

    try {
      await toggleScopeMembership(pageData.kind, pageData.slug, pageData.membership.viewerIsMember);
    } catch (err) {
      console.error('Failed to toggle membership:', err);
    } finally {
      membershipPending = false;
      await refreshBootstrap();
      await invalidateAll();
    }
  }

  async function handleInviteRedeem() {
    const token = parseInviteToken(inviteDraft);
    if (!token) {
      return;
    }

    invitePending = true;
    inviteFeedback = '';
    inviteFeedbackTone = 'soft';

    try {
      const result = await redeemScopeInvite(pageData.kind, pageData.slug, token);

      if (!result.ok) {
        inviteFeedback = 'That invite link or code is invalid or expired.';
        inviteFeedbackTone = 'warning';
        return;
      }

      if (pageData.kind === 'community' && result.slug && result.slug !== pageData.slug) {
        inviteFeedback = 'That invite is for a different community.';
        inviteFeedbackTone = 'warning';
        return;
      }

      inviteDraft = '';
      showInvitePanel = false;
      await invalidateAll();
    } finally {
      invitePending = false;
    }
  }
</script>

<section class="directory-page">
  <ScopeDirectoryHeader
    bind:inviteDraft
    bind:inviteFeedback
    bind:inviteFeedbackTone
    bind:invitePending
    bind:showBoardPanel
    bind:showInvitePanel
    {membershipPending}
    {pageData}
    onInviteRedeem={handleInviteRedeem}
    onLeave={handleMembershipToggle}
    onMembershipAction={handleMembershipToggle}
    onToggleBoardPanel={() => (showBoardPanel = !showBoardPanel)}
  />

  {#if showRolePanel && showBoardPanel}
    <PlatformBoardPanel
      {pageData}
      {boardStatusLabel}
      {meetsConfidenceThreshold}
      onVote={handleConfidenceVote}
    />
  {/if}

  {#if pageData.membership.viewerCanSeeFeed}
    <section class="toolbar-card">
      <div class="controls-row">
        <IconMenuButton
          bind:value={activeFilter}
          ariaLabel={`Filter ${pageData.title} feed`}
          defaultValue="all"
          options={filterOptions}
          showOptionIcons
          on:change={handleFeedQueryChange}
        >
          <FeedToolbarIcon name="filter" />
        </IconMenuButton>

        <IconMenuButton
          bind:value={activeSort}
          ariaLabel={`Sort ${pageData.title} feed by`}
          options={sortOptions}
          on:change={handleFeedQueryChange}
        >
          <FeedToolbarIcon name="sort" />
        </IconMenuButton>

        <IconMenuButton
          bind:value={activeWindow}
          ariaLabel={`${pageData.title} feed time window`}
          defaultValue="all"
          options={windowOptions}
          on:change={handleFeedQueryChange}
        >
          <FeedToolbarIcon name="clock" />
        </IconMenuButton>
      </div>
    </section>
  {/if}

  <div class="stack">
    {#if !pageData.membership.viewerCanSeeFeed}
      <section class="info-card">
        <p>{pageData.membership.hiddenFeedCopy ?? 'This feed is only visible to members.'}</p>
      </section>
    {:else if feedLoading && feedItems.length === 0}
      <section class="info-card">
        <p>Loading feed…</p>
      </section>
    {:else if feedItems.length === 0}
      <section class="info-card">
        <p>{pageData.emptyFeedText}</p>
      </section>
    {:else}
      {#each feedItems as item (item.id)}
        <PublicFeedCard item={item} />
      {/each}
      <InfiniteFeedSentinel
        disabled={!feedHasMore || feedLoading}
        loading={feedLoadingMore}
        on:loadMore={loadMoreFeedItems}
      />
      {#if !feedHasMore && feedItems.length > 0}
        <p class="end-copy">You're caught up.</p>
      {/if}
    {/if}
  </div>
</section>

<style>
  .directory-page,
  .stack {
    display: grid;
  }

  .directory-page {
    gap: 12px;
  }

  .stack {
    gap: 0;
    min-width: 0;
    overflow-x: clip;
  }

  .stack :global(.surface:last-child) {
    border-bottom: none;
  }

  .end-copy {
    margin: 0;
    padding: 12px 4px 4px;
    color: var(--text-soft);
    font-size: 13px;
    text-align: center;
  }

  .toolbar-card,
  .info-card {
    padding: 12px 0;
    border: none;
    border-bottom: 1px solid var(--panel-border);
    border-radius: 0;
    background: transparent;
  }

  .controls-row {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 6px;
    width: 100%;
    overflow-x: auto;
  }

  .info-card p {
    color: var(--text-soft);
    line-height: 1.5;
  }
</style>
