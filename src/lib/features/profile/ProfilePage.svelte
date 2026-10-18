<script lang="ts">
  import { errorMessage } from '$lib/services/errors';
  import { askConfirm } from '$lib/stores/confirmDialog';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import PersonalFeedCard from '$lib/components/cards/personal-feed/PersonalFeedCard.svelte';
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import IconMenuButton from '$lib/components/shared/IconMenuButton.svelte';
  import InfiniteFeedSentinel from '$lib/components/shared/InfiniteFeedSentinel.svelte';
  import PeopleSheet from '$lib/components/shared/PeopleSheet.svelte';
  import PhotoViewer from '$lib/components/shared/PhotoViewer.svelte';
  import { showToast } from '$lib/stores/toast';
  import ComposeMessageSheet from '$lib/components/shared/ComposeMessageSheet.svelte';
  import { DEFAULT_FEED_PAGE_SIZE, appendUniqueById } from '$lib/types/pagination';
  import { getFollowRequests } from '$lib/services/queries/account';
  import {
    acceptFollowRequest,
    followUser,
    rejectFollowRequest,
    setAccountStance,
    voteBotReview,
    requestBotReReview,
    unfollowUser,
  } from '$lib/services/commands/account';
  import { getUserFeedPage } from '$lib/services/queries/feeds';
  import type { FollowStatus, ProfilePageData } from '$lib/types/account';
  import type { PersonalFeedItem } from '$lib/types/feed';
  import type { ViewerSummary } from '$lib/types/bootstrap';
  import { profileSortToApiSort, type FeedSortQuery } from '$lib/utils/feedQuery';
  import { trustBadges } from '$lib/utils/trustBadges';
  import { mergeFeedEngagement } from '$lib/utils/feedSignals';

  export let data: ProfilePageData;

  type FeedFilter = 'all' | 'public' | 'personal';
  type PeopleListMode = 'followers' | 'following' | null;
  type SortMode = 'newest' | 'top' | 'oldest';

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'top', label: 'Top' },
    { value: 'oldest', label: 'Oldest' },
  ];

  let activeFilter: FeedFilter = 'all';
  let viewedUsername = data.username;
  let activePeopleList: PeopleListMode = null;
  let trustOpen = false;
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
  let stancePending = false;
  let stanceMessage = '';
  let followMessage = '';
  let requestActionPending = '';
  let pendingFollowRequests: ViewerSummary[] = data.pendingFollowRequests;
  let viewerFollowStatus: FollowStatus = data.viewerFollowStatus;
  let viewerIsFollowing = data.viewerIsFollowing;

  $: scopeOptions = [
    { value: 'all', label: 'All' },
    { value: 'public', label: 'Public' },
    ...(data.canViewPersonalFeed ? [{ value: 'personal', label: 'Personal' as const }] : []),
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
    trustOpen = false;
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
        offset: 0,
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
        offset: feedOffset,
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
      feedItems = feedItems.length > 0 ? mergeFeedEngagement(feedItems, data.feed) : data.feed;
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
      pendingFollowRequests = pendingFollowRequests.filter(
        (person) => person.username !== username
      );
      await invalidateAll();
    } catch {
      followMessage = 'Could not update follow request. Reload and try again.';
    } finally {
      requestActionPending = '';
    }
  }

  function togglePeopleList(mode: Exclude<PeopleListMode, null>) {
    activePeopleList = activePeopleList === mode ? null : mode;
    if (activePeopleList) {
      trustOpen = false;
    }
  }

  function toggleTrustSheet() {
    trustOpen = !trustOpen;
    if (trustOpen) {
      activePeopleList = null;
    }
  }

  const STANDING_LABELS: Record<string, string> = {
    new: 'New',
    warm: 'Warming up',
    full: 'Full member',
    paused: 'Paused',
  };

  // Accounts found to be bots can't vouch or mark, so they only see the standing label.
  $: viewerPaused = $page.data.bootstrap?.viewer?.standing === 'paused';

  function standingLabel(level: string) {
    return STANDING_LABELS[level] ?? 'Member';
  }

  function standingHint(level: string) {
    if (level === 'new') return 'Can join and take part; voting opens after a short warm-up.';
    if (level === 'warm')
      return 'Votes count half until a vouch, a completed service request, or 10 active days.';
    if (level === 'paused') return 'A community review found this account is a bot.';
    return 'Votes count fully and can vouch for others.';
  }

  function trustAction(next: 'vouch' | 'bot') {
    if (!data.trust || stancePending) {
      return;
    }
    if (data.trust.viewerStance === next) {
      void updateStance('clear');
      return;
    }
    if (next === 'bot') {
      void confirmBotMark();
      return;
    }
    void updateStance(next);
  }

  async function confirmBotMark() {
    const ok = await askConfirm({
      title: `Mark ${data.username} as a possible bot?`,
      body:
        'One mark only flags the account. When three full members mark it, a public review opens and full members vote on whether it is a bot. You can clear your mark any time.',
      confirmLabel: 'Mark as bot',
      danger: true
    });
    if (ok) void updateStance('bot');
  }

  function matchesFilter(item: PersonalFeedItem, filter: FeedFilter) {
    if (filter === 'all') {
      return true;
    }

    if (filter === 'public') {
      return (
        item.kind === 'activity' ||
        item.kind === 'comment-activity' ||
        item.kind === 'help-request' ||
        (item.kind === 'post' && item.audience === 'public')
      );
    }

    return item.kind === 'post';
  }

  let reviewPending = false;
  let reviewMessage = '';

  // Shows your vote and the moved tally at once, until the reloaded profile catches up.
  let reviewVoteOverride: { vote: 'bot' | 'real'; realVotes: number; botVotes: number } | null =
    null;
  let lastTrustRef: unknown = null;
  $: if (data.trust !== lastTrustRef) {
    lastTrustRef = data.trust;
    reviewVoteOverride = null;
  }

  async function castBotReviewVote(vote: 'bot' | 'real') {
    const review = data.trust?.botReview;
    if (!review || review.viewerVote === vote) return;
    reviewPending = true;
    reviewMessage = '';
    try {
      await voteBotReview(data.username, vote);
      const previous = review.viewerVote;
      reviewVoteOverride = {
        vote,
        realVotes: review.realVotes + (vote === 'real' ? 1 : 0) - (previous === 'real' ? 1 : 0),
        botVotes: review.botVotes + (vote === 'bot' ? 1 : 0) - (previous === 'bot' ? 1 : 0)
      };
      await invalidateAll();
      const outcome = data.trust?.botReview?.status;
      showToast(
        outcome === 'upheld'
          ? `Vote recorded. That decided it: ${data.username} is now read-only.`
          : outcome !== 'open'
            ? `Vote recorded. That decided it: ${data.username} was cleared.`
            : vote === 'bot'
              ? 'Vote recorded: bot'
              : 'Vote recorded: real person'
      );
    } catch (err) {
      reviewMessage = errorMessage(err, 'Could not record that vote.');
    } finally {
      reviewPending = false;
    }
  }

  async function askForReReview() {
    reviewPending = true;
    reviewMessage = '';
    try {
      await requestBotReReview();
      showToast('Re-review requested');
      await invalidateAll();
    } catch (err) {
      reviewMessage = errorMessage(err, 'Could not ask for a re-review.');
    } finally {
      reviewPending = false;
    }
  }

  async function updateStance(stance: 'vouch' | 'bot' | 'clear') {
    if (stancePending || data.isOwnProfile) {
      return;
    }
    stancePending = true;
    stanceMessage = '';
    try {
      const reviewWasOpen = data.trust?.botReview?.status === 'open';
      await setAccountStance(data.username, stance);
      await invalidateAll();
      const reviewOpened =
        stance === 'bot' && !reviewWasOpen && data.trust?.botReview?.status === 'open';
      showToast(
        stance === 'vouch'
          ? `You vouched for ${data.username}`
          : reviewOpened
            ? `Marked ${data.username}. That made three marks, so a public bot review is now open.`
            : stance === 'bot'
              ? `Marked ${data.username} as a possible bot`
              : 'Mark cleared'
      );
    } catch (err) {
      stanceMessage = errorMessage(err, 'Could not update that stance.');
    } finally {
      stancePending = false;
    }
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
    profileImageUrl: person.profileImageUrl ?? null,
    badges: trustBadges(person.realR, person.bootstrapFloor),
  }));
  $: if (!data.canViewPersonalFeed && activeFilter === 'personal') {
    activeFilter = 'all';
  }

  $: displayBio = data.bio ? data.bio.trim() : '';
  let profilePhotoOpen = false;
</script>

<section class="page">
  <section class="hero-section">
    <div class="hero-topline">
      <div class="hero-main">
        <div class="hero-identity">
          {#if data.profileImageUrl}
            <button
              class="avatar-open"
              type="button"
              aria-label={`View ${data.username} profile photo`}
              on:click={() => (profilePhotoOpen = true)}
            >
              <AvatarBadge size="md" username={data.username} imageUrl={data.profileImageUrl} />
            </button>
          {:else}
            <AvatarBadge size="md" username={data.username} imageUrl={null} />
          {/if}
          <div class="hero-copy">
            <div class="name-row">
              <h1>{data.username}</h1>
              {#if data.trust}
                <button
                  aria-expanded={trustOpen}
                  aria-label={`Standing: ${standingLabel(data.trust.standing)}`}
                  class="standing-chip"
                  class:paused={data.trust.standing === 'paused'}
                  title={standingHint(data.trust.standing)}
                  type="button"
                  on:click={toggleTrustSheet}
                >
                  {standingLabel(data.trust.standing)}
                </button>
              {/if}
            </div>
            {#if displayBio}
              <p class="profile-bio">{displayBio}</p>
            {/if}
            <!-- Counts read as text links, like most profile pages. -->
            <div class="count-row">
              <button
                class:active={activePeopleList === 'followers'}
                type="button"
                on:click={() => togglePeopleList('followers')}
              >
                <strong>{data.followersCount}</strong>
                {data.followersCount === 1 ? 'follower' : 'followers'}
              </button>
              <button
                class:active={activePeopleList === 'following'}
                type="button"
                on:click={() => togglePeopleList('following')}
              >
                <strong>{data.followingCount}</strong> following
              </button>
            </div>
          </div>
        </div>

        {#if !data.isOwnProfile && $page.data.bootstrap?.viewer}
          <!-- One row of equal buttons that fits a phone: Follow, Message, Vouch, Bot. -->
          <div class="action-row">
            <button
              aria-label={followAriaLabel}
              title={followAriaLabel}
              class="action primary"
              class:on={viewerIsFollowing || viewerFollowStatus === 'pending'}
              disabled={followPending}
              type="button"
              on:click={toggleFollow}
            >
              <FeedToolbarIcon name={viewerIsFollowing ? 'person-check' : 'person-plus'} />
              <span class="action-text"
                >{viewerFollowStatus === 'pending' ? 'Requested' : viewerIsFollowing ? 'Following' : 'Follow'}</span
              >
            </button>
            {#if !viewerPaused}
              <button
                aria-label={`Message ${data.username}`}
                class="action"
                title="Message"
                type="button"
                on:click={() => (composeOpen = true)}
              >
                <FeedToolbarIcon name="message" />
                <span class="action-text">Message</span>
              </button>
            {/if}
            {#if data.trust && !viewerPaused}
              <button
                aria-label={data.trust.viewerStance === 'vouch'
                  ? `Clear vouch for ${data.username}`
                  : `Vouch for ${data.username}`}
                aria-pressed={data.trust.viewerStance === 'vouch'}
                class="action vouch"
                class:on={data.trust.viewerStance === 'vouch'}
                disabled={stancePending ||
                  (data.trust.viewerStance !== 'vouch' && !data.trust.viewerCanVouch)}
                title={data.trust.viewerStance === 'vouch'
                  ? 'Clear vouch'
                  : data.trust.viewerCanVouch
                    ? 'Vouch'
                    : 'Vouching opens once your own votes count fully.'}
                type="button"
                on:click={() => trustAction('vouch')}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"
                  ><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" /><path d="M8.5 12l2.5 2.5 4.5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg
                >
                <span class="action-text">{data.trust.viewerStance === 'vouch' ? 'Vouched' : 'Vouch'}</span>
              </button>
              <button
                aria-label={data.trust.viewerStance === 'bot'
                  ? `Clear bot mark for ${data.username}`
                  : `Mark ${data.username} as a bot`}
                aria-pressed={data.trust.viewerStance === 'bot'}
                class="action bot"
                class:on={data.trust.viewerStance === 'bot'}
                disabled={stancePending ||
                  (data.trust.viewerStance !== 'bot' && !data.trust.viewerCanMarkBot)}
                title={data.trust.viewerStance === 'bot'
                  ? 'Clear bot mark'
                  : data.trust.viewerCanMarkBot
                    ? 'Mark as bot'
                    : 'Marking as a bot opens once your own votes count fully.'}
                type="button"
                on:click={() => trustAction('bot')}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"
                  ><rect x="5" y="8" width="14" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="1.8" /><path d="M12 4v4M9.5 13h.01M14.5 13h.01M10 16.5h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /><circle cx="12" cy="3.5" r="1" fill="currentColor" /></svg
                >
                <span class="action-text">{data.trust.viewerStance === 'bot' ? 'Marked bot' : 'Bot'}</span>
              </button>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    {#if followMessage}
      <div class="warning-card" role="alert">{followMessage}</div>
    {/if}
    {#if stanceMessage}
      <div class="warning-card" role="alert">{stanceMessage}</div>
    {/if}
  </section>

  {#if data.trust?.botReview}
    {@const review = data.trust.botReview}
    <section class="bot-review-card" class:upheld={review.status === 'upheld'} aria-live="polite">
      {#if review.status === 'open'}
        <div class="bot-review-copy">
          <strong>{review.isAppeal ? 'Re-review open' : 'Bot review open'}</strong>
          <p>
            {data.isOwnProfile
              ? 'Full members are voting on whether this account belongs to a real person. You can keep using the site meanwhile.'
              : 'Full members are voting on whether this account belongs to a real person.'}
          </p>
          <p class="bot-review-tally">
            {reviewVoteOverride?.realVotes ?? review.realVotes} real · {reviewVoteOverride?.botVotes ?? review.botVotes} bot ·
            needs {review.votesRequired} votes, 66% bot to pass
            {#if review.closesAt}
              · closes {new Date(review.closesAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            {/if}
          </p>
        </div>
        {#if review.viewerCanVote}
          {@const chosenVote = reviewVoteOverride?.vote ?? review.viewerVote}
          {#if chosenVote}
            <p class="bot-review-tally">
              You voted {chosenVote === 'bot' ? 'Bot' : 'Real person'}. Tap the other to change it.
            </p>
          {/if}
          <div class="bot-review-actions">
            <button
              type="button"
              class:chosen={chosenVote === 'real'}
              aria-pressed={chosenVote === 'real'}
              disabled={reviewPending}
              on:click={() => castBotReviewVote('real')}>Real person</button
            >
            <button
              type="button"
              class="bot"
              class:chosen={chosenVote === 'bot'}
              aria-pressed={chosenVote === 'bot'}
              disabled={reviewPending}
              on:click={() => castBotReviewVote('bot')}>Bot</button
            >
          </div>
        {/if}
      {:else}
        <div class="bot-review-copy">
          <strong>Found to be a bot</strong>
          <p>A community review decided this account is a bot, so it is read-only.</p>
          {#if data.isOwnProfile && review.canRequestReReview}
            <button type="button" class="re-review" disabled={reviewPending} on:click={askForReReview}>
              Ask for a re-review
            </button>
          {:else if data.isOwnProfile && review.reReviewAvailableAt}
            <p class="bot-review-tally">
              You can ask for one re-review from {new Date(review.reReviewAvailableAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}.
            </p>
          {/if}
        </div>
      {/if}
      {#if reviewMessage}
        <p class="bot-review-error" role="alert">{reviewMessage}</p>
      {/if}
    </section>
  {/if}

  {#if data.isOwnProfile && pendingFollowRequests.length > 0}
    <section id="follow-requests" class="requests-card">
      <h2>Follow requests</h2>
      <p class="requests-copy">
        Approve followers who need your permission before they can see personal content.
      </p>
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

  {#if data.trust}
    <PeopleSheet
      description={data.trust.standingNextStep ??
        `${standingLabel(data.trust.standing)}. ${standingHint(data.trust.standing)} Only full members can vouch. Three bot marks from full members open a public review; marks alone never pause anyone.`}
      open={trustOpen}
      sectionLayout="tabs"
      sections={[
        {
          title: 'Vouchers',
          emptyCopy: 'No vouches yet.',
          members: data.trust.vouchers.map((person) => ({
            id: person.username,
            username: person.username,
            profileImageUrl: person.profileImageUrl,
          })),
        },
        {
          title: 'Bot marks',
          emptyCopy: 'No bot marks yet.',
          members: data.trust.botMarkers.map((person) => ({
            id: person.username,
            username: person.username,
            profileImageUrl: person.profileImageUrl,
          })),
        },
      ]}
      title="Trust"
      on:close={() => (trustOpen = false)}
    />
  {/if}

  <PhotoViewer
    url={profilePhotoOpen ? data.profileImageUrl ?? null : null}
    alt={`${data.username} profile photo`}
    on:close={() => (profilePhotoOpen = false)}
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
  .name-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 8px;
    min-width: 0;
  }

  .name-row h1 {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .standing-chip {
    flex: 0 0 auto;
    padding: 2px 8px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-soft);
    color: var(--text-soft);
    font: inherit;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .standing-chip.paused {
    border-color: transparent;
    background: color-mix(in srgb, #d97706 16%, transparent);
    color: #b45309;
  }

  .count-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin-top: 6px;
  }

  .count-row button {
    padding: 4px 0;
    border: 0;
    background: transparent;
    color: var(--text-soft);
    font: inherit;
    font-size: 14px;
    cursor: pointer;
  }

  .count-row button strong {
    color: var(--text-main);
  }

  .count-row button:hover {
    color: var(--brand-strong);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .count-row button.active {
    color: var(--brand-strong);
  }

  .action-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
    grid-auto-flow: column;
    gap: 8px;
    margin-top: 12px;
    width: 100%;
    max-width: 520px;
  }

  .action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 0;
    min-height: 40px;
    padding: 0 8px;
    overflow: hidden;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }

  .action :global(.toolbar-icon) {
    width: 18px;
    height: 18px;
  }

  .action:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--brand) 45%, var(--panel-border));
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .action.primary:hover:not(:disabled) {
    background: var(--brand-strong);
    color: var(--page-bg);
  }

  .action.bot:hover:not(:disabled) {
    border-color: color-mix(in srgb, #b91c1c 45%, var(--panel-border));
    background: color-mix(in srgb, #b91c1c 10%, var(--panel));
    color: #b91c1c;
  }

  /* Phones: symbols only; each button keeps its name as its label and tooltip. */
  @media (max-width: 600px) {
    .action-text {
      display: none;
    }
  }

  .action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action.primary {
    border-color: var(--brand);
    background: var(--brand);
    color: var(--page-bg);
  }

  .action.primary.on {
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .action.vouch.on {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .action.bot.on {
    border-color: color-mix(in srgb, #b91c1c 50%, var(--panel-border));
    background: color-mix(in srgb, #b91c1c 12%, var(--panel));
    color: #b91c1c;
  }


  /* Inset by the page gutter like the header above, so its border isn't cut at the screen edge. */
  .bot-review-card {
    display: grid;
    gap: 10px;
    min-width: 0;
    margin: 12px var(--page-gutter);
    padding: 14px 16px;
    border: 1px solid color-mix(in srgb, var(--status-yellow) 55%, var(--panel-border));
    border-radius: var(--radius-sm, 10px);
    background: var(--status-yellow-soft);
  }

  .bot-review-card.upheld {
    border-color: color-mix(in srgb, var(--need-strong) 50%, var(--panel-border));
    background: var(--need-soft);
  }

  .bot-review-copy {
    display: grid;
    gap: 4px;
  }

  .bot-review-copy p {
    margin: 0;
    color: var(--text-main);
    font-size: 14px;
    line-height: 1.4;
  }

  .bot-review-copy .bot-review-tally {
    color: var(--text-soft);
    font-size: 13px;
  }

  .bot-review-actions {
    display: flex;
    gap: 8px;
  }

  .bot-review-actions button,
  .re-review {
    flex: 1 1 0;
    min-height: 40px;
    padding: 0 14px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel);
    color: var(--text-main);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .re-review {
    justify-self: start;
    flex: 0 0 auto;
    margin-top: 6px;
  }

  .bot-review-actions button.chosen {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .bot-review-actions button.bot.chosen {
    border-color: var(--need-strong);
    background: var(--need-soft);
    color: var(--need-strong);
  }

  .bot-review-error {
    margin: 0;
    color: var(--danger);
    font-size: 13px;
  }

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
    flex-direction: column;
    flex-wrap: nowrap;
    gap: 10px;
    align-items: stretch;
    justify-content: flex-start;
    width: 100%;
  }

  .hero-identity {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    min-width: 0;
    flex: 1 1 0;
  }

  .avatar-open {
    padding: 0;
    border: 0;
    background: transparent;
    cursor: zoom-in;
  }

  .hero-copy {
    display: grid;
    gap: 8px;
    flex: 1 1 auto;
    width: 100%;
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
    line-height: 1.2;
    overflow-wrap: anywhere;
    white-space: normal;
  }

  .profile-bio {
    min-width: 0;
    margin: 0;
    padding-left: 10px;
    border-left: 2px solid var(--brand);
    color: var(--text-soft);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.45;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
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
