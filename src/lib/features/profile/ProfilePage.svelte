<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import PersonalFeedCard from '$lib/components/cards/personal-feed/PersonalFeedCard.svelte';
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import MembershipSplitButton from '$lib/components/shared/MembershipSplitButton.svelte';
  import IconMenuButton from '$lib/components/shared/IconMenuButton.svelte';
  import InfiniteFeedSentinel from '$lib/components/shared/InfiniteFeedSentinel.svelte';
  import PeopleSheet from '$lib/components/shared/PeopleSheet.svelte';
  import ComposeMessageSheet from '$lib/components/shared/ComposeMessageSheet.svelte';
  import {
    DEFAULT_FEED_PAGE_SIZE,
    appendUniqueById
  } from '$lib/types/pagination';
  import { getFollowRequests } from '$lib/services/queries/account';
  import {
    acceptFollowRequest,
    followUser,
    rejectFollowRequest,
    unfollowUser
  } from '$lib/services/commands/account';
  import { getUserFeedPage } from '$lib/services/queries/feeds';
  import type { FollowStatus, ProfilePageData } from '$lib/types/account';
  import type { PersonalFeedItem } from '$lib/types/feed';
  import type { ViewerSummary } from '$lib/types/bootstrap';
  import { profileSortToApiSort, type FeedSortQuery } from '$lib/utils/feedQuery';
  import { mergeFeedEngagement } from '$lib/utils/feedSignals';

  export let data: ProfilePageData;

  type FeedFilter = 'all' | 'public' | 'personal';
  type PeopleListMode = 'followers' | 'following' | null;
  type SortMode = 'newest' | 'top' | 'oldest';

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'top', label: 'Top' },
    { value: 'oldest', label: 'Oldest' }
  ];

  let activeFilter: FeedFilter = 'all';
  let viewedUsername = data.username;
  let activePeopleList: PeopleListMode = null;
  let composeOpen = false;
  let sortMode: SortMode = 'newest';
  let feedItems: PersonalFeedItem[] = data.feed;
  let feedLoading = false;
  let feedLoadingMore = false;
  let feedHasMore = data.feed.length >= DEFAULT_FEED_PAGE_SIZE;
  let feedOffset = data.feed.length;
  let feedRequestId = 0;
  let lastLoadedQuery = `${data.username}:recent`;
  let appliedFeedRef = data.feed;
  let followPending = false;
  let followMessage = '';
  let requestActionPending = '';
  let pendingFollowRequests: ViewerSummary[] = data.pendingFollowRequests;
  let viewerFollowStatus: FollowStatus = data.viewerFollowStatus;
  let viewerIsFollowing = data.viewerIsFollowing;

  $: scopeOptions = [
    { value: 'all', label: 'All' },
    { value: 'public', label: 'Public' },
    ...(data.canViewPersonalFeed ? [{ value: 'personal', label: 'Personal' as const }] : [])
  ];

  function scopeIconFor(filter: FeedFilter): 'filter' | 'globe' | 'people' {
    if (filter === 'public') {
      return 'globe';
    }

    if (filter === 'personal') {
      return 'people';
    }

    return 'filter';
  }

  $: if (data.username !== viewedUsername) {
    viewedUsername = data.username;
    activeFilter = 'all';
    activePeopleList = null;
    composeOpen = false;
    sortMode = 'newest';
    feedItems = data.feed;
    feedOffset = data.feed.length;
    feedHasMore = data.feed.length >= DEFAULT_FEED_PAGE_SIZE;
    // Profile loader always requests recent (Newest).
    lastLoadedQuery = `${data.username}:recent`;
    appliedFeedRef = data.feed;
  }

  $: if (!followPending) {
    viewerFollowStatus = data.viewerFollowStatus;
    viewerIsFollowing = data.viewerIsFollowing;
  }

  $: followAriaLabel = followPending
    ? 'Working...'
    : viewerIsFollowing
      ? `Unfollow ${data.username}`
      : viewerFollowStatus === 'pending'
        ? `Cancel follow request to ${data.username}`
        : `Follow ${data.username}`;

  let apiSort: FeedSortQuery = 'recent';
  // Newest = chronological newest-first, Top = highest rated (raw score), Oldest = chronological oldest-first.
  $: apiSort = profileSortToApiSort(sortMode);
  $: feedQueryKey = `${data.username}:${apiSort}`;

  async function loadFeedItems(sortOverride?: FeedSortQuery) {
    const requestedSort = sortOverride ?? apiSort;
    const queryKey = `${data.username}:${requestedSort}`;
    if (queryKey === lastLoadedQuery && feedItems.length > 0) {
      return;
    }

    const requestId = ++feedRequestId;
    feedLoading = true;
    feedLoadingMore = false;
    feedHasMore = true;
    feedOffset = 0;

    try {
      const pageResult = await getUserFeedPage({
        username: data.username,
        sort: requestedSort,
        limit: DEFAULT_FEED_PAGE_SIZE,
        offset: 0
      });
      if (requestId === feedRequestId) {
        feedItems = pageResult.items;
        feedOffset = pageResult.items.length;
        feedHasMore = pageResult.hasMore;
        lastLoadedQuery = queryKey;
      }
    } finally {
      if (requestId === feedRequestId) {
        feedLoading = false;
      }
    }
  }

  async function loadMoreFeedItems() {
    if (feedLoading || feedLoadingMore || !feedHasMore) {
      return;
    }

    const requestId = ++feedRequestId;
    feedLoadingMore = true;
    try {
      const pageResult = await getUserFeedPage({
        username: data.username,
        sort: apiSort,
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

  function handleSortChange(event: CustomEvent<{ value: string }>) {
    const nextSort = profileSortToApiSort(event.detail.value as SortMode);
    sortMode = event.detail.value as SortMode;
    lastLoadedQuery = '';
    void loadFeedItems(nextSort);
  }

  // After report/vote invalidation, profile loader data refreshes. Keep the local
  // feed list in sync so emblems/dismissals appear without a manual reload.
  $: if (data.feed !== appliedFeedRef) {
    appliedFeedRef = data.feed;
    if (apiSort === 'recent' && lastLoadedQuery === `${data.username}:recent`) {
      // Merge engagement onto the client list instead of replacing it wholesale,
      // so live votes on paginated rows are not wiped by the recent loader snapshot.
      feedItems =
        feedItems.length > 0 ? mergeFeedEngagement(feedItems, data.feed) : data.feed;
      feedOffset = Math.max(feedOffset, data.feed.length);
      feedHasMore = data.feed.length >= DEFAULT_FEED_PAGE_SIZE || feedHasMore;
    } else if (apiSort !== 'recent') {
      // Loader always seeds newest/recent; ignore it while a different sort is active
      // and refresh from the matching client query instead of snapping back.
      if (!feedLoading) {
        lastLoadedQuery = '';
        void loadFeedItems();
      }
    } else if (!feedLoading && feedItems.length === 0) {
      feedItems = data.feed;
      feedOffset = data.feed.length;
      feedHasMore = data.feed.length >= DEFAULT_FEED_PAGE_SIZE;
      lastLoadedQuery = `${data.username}:recent`;
    }
  }

  onMount(() => {
    // Loader seeds Newest/recent; mark query so infinite scroll stays on the same sort.
    if (!lastLoadedQuery) {
      lastLoadedQuery = `${data.username}:recent`;
    }

    if (!data.isOwnProfile) {
      return;
    }

    void (async () => {
      try {
        pendingFollowRequests = await getFollowRequests();
      } catch {
        pendingFollowRequests = data.pendingFollowRequests;
      }

      if ($page.url.searchParams.get('followRequests') === '1') {
        const section = document.getElementById('follow-requests');
        section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    })();
  });


  async function handleFollowRequest(username: string, action: 'accept' | 'reject') {
    requestActionPending = username;
    followMessage = '';

    try {
      if (action === 'accept') {
        await acceptFollowRequest(username);
      } else {
        await rejectFollowRequest(username);
      }
      pendingFollowRequests = pendingFollowRequests.filter((person) => person.username !== username);
      await invalidateAll();
    } catch {
      followMessage = 'Could not update follow request. Reload and try again.';
    } finally {
      requestActionPending = '';
    }
  }

  function togglePeopleList(mode: Exclude<PeopleListMode, null>) {
    activePeopleList = activePeopleList === mode ? null : mode;
  }

  function matchesFilter(item: PersonalFeedItem, filter: FeedFilter) {
    if (filter === 'all') {
      return true;
    }

    if (filter === 'public') {
      return item.kind === 'activity' || item.kind === 'comment-activity' || item.kind === 'help-request' || (item.kind === 'post' && item.audience === 'public');
    }

    return item.kind === 'post';
  }

  async function toggleFollow() {
    if (data.isOwnProfile || followPending) {
      return;
    }

    followPending = true;
    followMessage = '';

    try {
      if (viewerIsFollowing || viewerFollowStatus === 'pending') {
        await unfollowUser(data.username);
        viewerIsFollowing = false;
        viewerFollowStatus = null;
        await invalidateAll();
      } else {
        const result = await followUser(data.username);
        viewerFollowStatus = (result.followStatus as FollowStatus) ?? null;
        viewerIsFollowing = result.followStatus === 'accepted';
        await invalidateAll();
      }
    } catch {
      followMessage = 'Could not update follow status. Reload and try again.';
    } finally {
      followPending = false;
    }
  }

  $: visibleFeed = feedItems.filter((item) => matchesFilter(item, activeFilter));
  $: peopleItems = activePeopleList === 'followers' ? data.followers : data.following;
  $: peopleSheetPeople = peopleItems.map((person) => ({
    id: person.id,
    username: person.username,
    profileImageUrl: person.profileImageUrl ?? null
  }));
  $: if (!data.canViewPersonalFeed && activeFilter === 'personal') {
    activeFilter = 'all';
  }

  const BIO_DISPLAY_LIMIT = 160;
  $: displayBio = data.bio ? data.bio.trim().slice(0, BIO_DISPLAY_LIMIT) : '';
</script>

<section class="page">
  <section class="hero-section">
    <div class="hero-topline">
      <div class="hero-main">
        <div class="hero-identity">
          <AvatarBadge size="md" username={data.username} imageUrl={data.profileImageUrl ?? null} />
          <div class="hero-copy">
            <h1>{data.username}</h1>
            {#if displayBio}
              <p class="profile-bio">{displayBio}</p>
            {/if}
          </div>
        </div>

        <div class="profile-side">
          <div class="stats-row">
            {#if data.isOwnProfile}
              <MembershipSplitButton
                count={data.followersCount}
                canOpenMembers={true}
                membersOpen={activePeopleList === 'followers'}
                membersAriaLabel={`${data.followersCount} followers`}
                onOpenMembers={() => togglePeopleList('followers')}
              />
            {:else}
              <MembershipSplitButton
                joined={viewerIsFollowing}
                pending={viewerFollowStatus === 'pending'}
                count={data.followersCount}
                canToggle={true}
                canOpenMembers={true}
                disabled={followPending}
                membersOpen={activePeopleList === 'followers'}
                joinAriaLabel={followAriaLabel}
                membersAriaLabel={`${data.followersCount} followers`}
                onToggleJoin={toggleFollow}
                onOpenMembers={() => togglePeopleList('followers')}
              />
            {/if}

            <button
              aria-label={`${data.followingCount} following`}
              class:active={activePeopleList === 'following'}
              class="stat-chip"
              type="button"
              on:click={() => togglePeopleList('following')}
            >
              <FeedToolbarIcon name="people" />
              <span>{data.followingCount}</span>
            </button>

            {#if !data.isOwnProfile && $page.data.bootstrap?.viewer}
              <button
                aria-label={`Message ${data.username}`}
                class="icon-action"
                type="button"
                on:click={() => (composeOpen = true)}
              >
                <FeedToolbarIcon name="message" />
              </button>
            {/if}
          </div>
        </div>
      </div>
    </div>

    {#if followMessage}
      <div class="warning-card" role="alert">{followMessage}</div>
    {/if}
  </section>

  {#if data.isOwnProfile && pendingFollowRequests.length > 0}
    <section id="follow-requests" class="requests-card">
      <h2>Follow requests</h2>
      <p class="requests-copy">Approve followers who need your permission before they can see personal content.</p>
      <div class="people-list">
        {#each pendingFollowRequests as person (person.username)}
          <div class="person-row">
            <a class="person-link" href={`/profile/${person.username}`}>
              <strong>{person.username}</strong>
              {#if person.bio}
                <span>{person.bio}</span>
              {/if}
            </a>
            <div class="request-actions">
              <button
                class="accept-button"
                disabled={requestActionPending === person.username}
                type="button"
                on:click={() => handleFollowRequest(person.username, 'accept')}
              >
                Accept
              </button>
              <button
                class="reject-button"
                disabled={requestActionPending === person.username}
                type="button"
                on:click={() => handleFollowRequest(person.username, 'reject')}
              >
                Decline
              </button>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <PeopleSheet
    open={activePeopleList !== null}
    title={activePeopleList === 'followers' ? 'Followers' : 'Following'}
    emptyCopy={activePeopleList === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
    people={peopleSheetPeople}
    on:close={() => (activePeopleList = null)}
  />

  <ComposeMessageSheet
    bind:open={composeOpen}
    prefillUsername={data.username}
    on:close={() => (composeOpen = false)}
  />

  <section class="toolbar-card">
    <div class="controls-row">
      <IconMenuButton
        bind:value={activeFilter}
        ariaLabel="Filter profile feed"
        defaultValue="all"
        options={scopeOptions}
      >
        <FeedToolbarIcon name={scopeIconFor(activeFilter)} />
      </IconMenuButton>

      <IconMenuButton
        bind:value={sortMode}
        ariaLabel="Sort profile feed"
        defaultValue="newest"
        options={sortOptions}
        on:change={handleSortChange}
      >
        <FeedToolbarIcon name="sort" />
      </IconMenuButton>
    </div>
  </section>

  <section class="feed-stack">
    {#if feedLoading && visibleFeed.length === 0}
      <section class="empty-card">
        <p>Loading activity…</p>
      </section>
    {:else if visibleFeed.length === 0}
      <section class="empty-card">
        <p>
          {#if !data.canViewPublicProfileActivity}
            This user keeps their public profile activity private.
          {:else if activeFilter === 'personal' && !data.canViewPersonalFeed}
            Personal posts are only visible to followers.
          {:else}
            No activity matches this view yet.
          {/if}
        </p>
      </section>
    {:else}
      {#each visibleFeed as item (item.id)}
        <PersonalFeedCard {item} />
      {/each}
      <InfiniteFeedSentinel
        disabled={!feedHasMore || feedLoading}
        loading={feedLoadingMore}
        on:loadMore={loadMoreFeedItems}
      />
      {#if !feedHasMore && visibleFeed.length > 0}
        <p class="end-copy">You're caught up.</p>
      {/if}
    {/if}
  </section>
</section>

<style>
  .page,
  .feed-stack,
  .people-list {
    display: grid;
  }

  .page {
    gap: 0;
  }

  .people-list {
    gap: 12px;
  }

  .feed-stack {
    gap: 0;
    min-width: 0;
    overflow-x: clip;
    overflow-y: clip;
  }

  .feed-stack :global(.surface:last-child) {
    border-bottom: none;
  }

  .end-copy {
    margin: 0;
    padding: 12px 4px 4px;
    color: var(--text-soft);
    font-size: 13px;
    text-align: center;
  }

  .hero-section {
    display: grid;
    gap: 12px;
    padding: 12px var(--page-gutter) 16px;
    border: none;
    border-bottom: 1px solid var(--panel-border);
    border-radius: 0;
    background: transparent;
  }

  .requests-card,
  .empty-card {
    padding: 14px var(--page-gutter);
    border: none;
    border-bottom: 1px solid var(--panel-border);
    border-radius: 0;
    background: transparent;
  }

  .warning-card {
    padding: 14px 0;
    border: none;
    border-bottom: 1px solid var(--panel-border);
    border-radius: 0;
    background: transparent;
  }

  .toolbar-card {
    padding: 12px var(--page-gutter);
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

  .empty-card {
    padding: 20px var(--page-gutter);
    border: none;
    border-bottom: 1px solid var(--panel-border);
    border-radius: 0;
    background: transparent;
  }

  .hero-topline {
    position: relative;
    display: block;
  }

  .hero-main {
    display: flex;
    flex-wrap: nowrap;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
    width: 100%;
  }

  .hero-identity {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    min-width: 0;
    flex: 1 1 0;
    padding-right: 176px;
  }

  .hero-copy {
    display: grid;
    gap: 8px;
    min-width: 0;
  }

  .hero-copy > * {
    min-width: 0;
  }

  .hero-copy h1 {
    margin: 0;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 36px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .profile-side {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
    display: flex;
    justify-content: flex-end;
    flex: 0 0 auto;
  }

  .stats-row {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: nowrap;
  }

  .profile-bio {
    margin: 0;
    max-width: 42ch;
    padding-left: 10px;
    border-left: 2px solid var(--brand);
    color: var(--text-soft);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.45;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
  }

  .stat-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 36px;
    min-width: 0;
    padding: 0 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    flex: 0 0 auto;
    transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease;
  }

  .stat-chip :global(.toolbar-icon) {
    width: 18px;
    height: 18px;
  }

  .stat-chip span {
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
  }

  .stat-chip:hover,
  .stat-chip:focus-visible,
  .icon-action:hover,
  .icon-action:focus-visible {
    background: var(--brand-soft);
    border-color: color-mix(in srgb, var(--brand) 40%, var(--panel-border));
    color: var(--brand-strong);
  }

  .stat-chip.active {
    border-color: color-mix(in srgb, var(--brand) 40%, var(--panel-border));
    color: var(--brand-strong);
  }

  .icon-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    flex: 0 0 auto;
    cursor: pointer;
    transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease;
  }

  @media (max-width: 720px) {
    .hero-identity {
      padding-right: 168px;
    }

    .profile-side {
      width: auto;
    }
  }

  .requests-card h2 {
    margin: 0 0 8px;
    font-size: 16px;
    color: var(--brand-strong);
  }

  .requests-copy {
    margin: 0 0 12px;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.45;
  }

  .request-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .accept-button,
  .reject-button {
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .accept-button {
    border: 0;
    background: var(--brand);
    color: var(--page-bg);
  }

  .reject-button {
    border: 1px solid var(--panel-border);
    background: var(--panel-strong);
    color: var(--text-soft);
  }

  .person-row {
    display: grid;
    gap: 10px;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
  }

  .person-link {
    display: grid;
    gap: 4px;
    color: inherit;
    text-decoration: none;
  }

  .warning-card {
    margin-top: 12px;
    border-color: color-mix(in srgb, var(--status-yellow) 50%, var(--panel-border));
    background: color-mix(in srgb, var(--status-yellow) 14%, var(--panel));
    color: var(--text-main);
    font-size: 13px;
    font-weight: 700;
  }

  .person-row strong {
    font-size: 14px;
  }

  .person-row span {
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.45;
  }
</style>