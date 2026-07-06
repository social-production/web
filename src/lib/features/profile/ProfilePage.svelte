<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import PersonalFeedCard from '$lib/components/cards/personal-feed/PersonalFeedCard.svelte';
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import ContextualBackButton from '$lib/components/shared/ContextualBackButton.svelte';
  import {
    acceptFollowRequest,
    followUser,
    getFollowRequests,
    rejectFollowRequest,
    unfollowUser
  } from '$lib/services/queries/account';
  import type { FollowStatus, ProfilePageData } from '$lib/types/account';
  import type { PersonalFeedItem } from '$lib/types/feed';
  import type { ViewerSummary } from '$lib/types/bootstrap';

  export let data: ProfilePageData;

  type FeedFilter = 'all' | 'public' | 'personal';
  type PeopleListMode = 'followers' | 'following' | null;
  type SortMode = 'newest' | 'top';

  let activeFilter: FeedFilter = 'all';
  let viewedUsername = data.username;
  let activePeopleList: PeopleListMode = null;
  let sortMode: SortMode = 'newest';
  let followPending = false;
  let followMessage = '';
  let requestActionPending = '';
  let pendingFollowRequests: ViewerSummary[] = data.pendingFollowRequests;
  let viewerFollowStatus: FollowStatus = data.viewerFollowStatus;
  let viewerIsFollowing = data.viewerIsFollowing;

  $: if (data.username !== viewedUsername) {
    viewedUsername = data.username;
    activeFilter = 'all';
    activePeopleList = null;
  }

  $: if (!followPending) {
    viewerFollowStatus = data.viewerFollowStatus;
    viewerIsFollowing = data.viewerIsFollowing;
  }

  $: followButtonLabel = followPending
    ? 'Working...'
    : viewerIsFollowing
      ? 'Unfollow'
      : viewerFollowStatus === 'pending'
        ? 'Request sent'
        : 'Follow';

  onMount(async () => {
    if (!data.isOwnProfile) {
      return;
    }

    try {
      pendingFollowRequests = await getFollowRequests();
    } catch {
      pendingFollowRequests = data.pendingFollowRequests;
    }

    if ($page.url.searchParams.get('followRequests') === '1') {
      const section = document.getElementById('follow-requests');
      section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

  function score(item: PersonalFeedItem) {
    if (item.kind === 'comment-activity') {
      return 0;
    }

    if (item.kind === 'help-request') {
      return item.voteCount + item.commentCount + (item.signupCount ?? 0);
    }

    return item.voteCount + item.commentCount;
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

  $: visibleFeed = data.feed
    .filter((item) => matchesFilter(item, activeFilter))
    .slice()
    .sort((left, right) => {
      if (sortMode === 'top') {
        const difference = score(right) - score(left);

        if (difference !== 0) {
          return difference;
        }
      }

      return +new Date(right.createdAt) - +new Date(left.createdAt);
    });
  $: peopleItems = activePeopleList === 'followers' ? data.followers : data.following;
  $: if (!data.canViewPersonalFeed && activeFilter === 'personal') {
    activeFilter = 'all';
  }
  $: backFallback = $page.url.searchParams.get('from') || '/';
</script>

<section class="page">
  <ContextualBackButton fallbackHref={backFallback} />
  <section class="hero-card">
    <div class="hero-topline">
      <div class="hero-identity">
        <AvatarBadge size="md" username={data.username} imageUrl={data.profileImageUrl ?? null} />
        <div>
          <span class="eyebrow">Profile</span>
          <h1>{data.username}</h1>
        </div>
      </div>

      <div class="profile-actions">
        {#if !data.isOwnProfile && $page.data.bootstrap?.viewer}
          <a class="message-button" href={`/messages?to=${encodeURIComponent(data.username)}`}>Message</a>
        {/if}
        {#if !data.isOwnProfile}
          <button
            class="follow-button"
            class:pending={viewerFollowStatus === 'pending'}
            type="button"
            disabled={followPending}
            on:click={toggleFollow}
          >
            {followButtonLabel}
          </button>
        {/if}

        <div class="stats-row">
          <button class:active={activePeopleList === 'followers'} class="stat-chip" type="button" on:click={() => togglePeopleList('followers')}>
            <strong>{data.followersCount}</strong>
            <span>Followers</span>
          </button>
          <button class:active={activePeopleList === 'following'} class="stat-chip" type="button" on:click={() => togglePeopleList('following')}>
            <strong>{data.followingCount}</strong>
            <span>Following</span>
          </button>
        </div>
      </div>
    </div>

    {#if data.bio}
      <p>{data.bio}</p>
    {/if}

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

  {#if activePeopleList}
    <section class="people-card">
      <div class="people-topline">
        <h2>{activePeopleList === 'followers' ? 'Followers' : 'Following'}</h2>
        <button class="toolbar-button" type="button" on:click={() => (activePeopleList = null)}>Close</button>
      </div>

      {#if peopleItems.length === 0}
        <p>No users in this list yet.</p>
      {:else}
        <div class="people-list">
          {#each peopleItems as person}
            <a class="person-row" href={`/profile/${person.username}`}>
              <strong>{person.username}</strong>
              {#if person.bio}
                <span>{person.bio}</span>
              {/if}
            </a>
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  <section class="toolbar-card">
    <div class="toolbar-group">
      <button class:active={activeFilter === 'all'} class="toolbar-button" type="button" on:click={() => (activeFilter = 'all')}>
        All
      </button>
      <button
        class:active={activeFilter === 'public'}
        class="toolbar-button"
        type="button"
        on:click={() => (activeFilter = 'public')}
      >
        Public
      </button>
      {#if data.canViewPersonalFeed}
        <button
          class:active={activeFilter === 'personal'}
          class="toolbar-button"
          type="button"
          on:click={() => (activeFilter = 'personal')}
        >
          Personal
        </button>
      {/if}
    </div>

    <div class="toolbar-group">
      <span class="toolbar-label">Sort</span>
      <button
        class:active={sortMode === 'newest'}
        class="toolbar-button"
        type="button"
        on:click={() => (sortMode = 'newest')}
      >
        Newest
      </button>
      <button class:active={sortMode === 'top'} class="toolbar-button" type="button" on:click={() => (sortMode = 'top')}>
        Top
      </button>
    </div>
  </section>

  <section class="feed-stack">
    {#if visibleFeed.length === 0}
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
      {#each visibleFeed as item}
        <PersonalFeedCard {item} />
      {/each}
    {/if}
  </section>
</section>

<style>
  .page,
  .feed-stack,
  .people-list {
    display: grid;
  }

  .page,
  .people-list {
    gap: 12px;
  }

  .feed-stack {
    gap: 0;
  }

  .hero-card,
  .toolbar-card,
  .people-card,
  .requests-card,
  .warning-card,
  .empty-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .hero-topline,
  .stats-row,
  .toolbar-group,
  .people-topline {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }

  .hero-identity {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .toolbar-card {
    display: flex;
    gap: 12px;
    flex-wrap: nowrap;
    align-items: center;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .toolbar-card::-webkit-scrollbar {
    display: none;
  }

  .toolbar-group {
    flex-wrap: nowrap;
    flex-shrink: 0;
  }

  .hero-topline,
  .toolbar-card,
  .people-topline {
    justify-content: space-between;
  }

  .profile-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }

  .hero-topline .stats-row {
    margin-left: 0;
  }

  .eyebrow,
  .toolbar-label {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  h1 {
    margin-top: 6px;
    font-size: 22px;
    letter-spacing: -0.02em;
    color: var(--brand-strong);
  }

  p {
    color: var(--text-soft);
    line-height: 1.45;
  }

  .hero-card p {
    margin-top: 10px;
    max-width: 72ch;
  }

  .stat-chip {
    display: grid;
    gap: 4px;
    min-width: 104px;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .stat-chip.active {
    border-color: var(--brand);
    background: var(--brand-soft);
  }

  .stat-chip strong {
    font-size: 16px;
  }

  .stat-chip span {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .toolbar-button,
  .follow-button,
  .message-button {
    padding: 7px 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .message-button {
    background: var(--panel-strong);
    color: var(--brand-strong);
  }

  .toolbar-button.active {
    border-color: var(--brand);
    color: var(--brand-strong);
  }

  .follow-button {
    background: var(--brand);
    color: var(--page-bg);
  }

  .follow-button.pending {
    background: var(--panel-strong);
    color: var(--text-main);
    border: 1px solid var(--panel-border);
  }

  .follow-button:disabled {
    opacity: 0.7;
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

  .toolbar-button:hover,
  .stat-chip:hover {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
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