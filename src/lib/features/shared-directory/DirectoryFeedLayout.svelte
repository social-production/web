<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import PublicFeedCard from '$lib/components/cards/public-feed/PublicFeedCard.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import IconMenuButton from '$lib/components/shared/IconMenuButton.svelte';
  import PlatformBoardPanel from '$lib/features/platform/board/PlatformBoardPanel.svelte';
  import ScopeDirectoryHeader from '$lib/features/shared-directory/ScopeDirectoryHeader.svelte';
  import { refreshBootstrap } from '$lib/services/queries/bootstrap';
  import { setVote } from '$lib/services/queries/feeds';
  import { redeemScopeInvite, toggleScopeMembership, castModeratorVote } from '$lib/services/queries/scopes';
  import { parseInviteToken } from '$lib/utils/invite-token';
  import type { PublicFeedItem, VoteDirection } from '$lib/types/feed';
  import type { ScopeMemberSummary, ScopePageData } from '$lib/types/scope';

  export let pageData: ScopePageData;

  type DirectoryFilter = 'all' | 'projects' | 'threads' | 'events';
  type FeedSort = 'popular' | 'recent';
  type FeedWindow = '12h' | '1d' | '7d' | '1m' | '1y' | 'all';

  const filterOptions = [
    { value: 'all', label: 'All items' },
    { value: 'projects', label: 'Projects', icon: 'project' as const },
    { value: 'threads', label: 'Threads', icon: 'thread' as const },
    { value: 'events', label: 'Events', icon: 'event' as const }
  ];

  const sortOptions = [
    { value: 'popular', label: 'Most popular' },
    { value: 'recent', label: 'Most recent' }
  ];

  const windowOptions = [
    { value: '12h', label: 'Last 12 hours' },
    { value: '1d', label: '1 day' },
    { value: '7d', label: '7 days' },
    { value: '1m', label: '1 month' },
    { value: '1y', label: '1 year' },
    { value: 'all', label: 'All time' }
  ];

  let activeFilter: DirectoryFilter = 'all';
  let activeSort: FeedSort = 'popular';
  let activeWindow: FeedWindow = 'all';
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
  $: referenceTime = pageData.feed.reduce((max, item) => Math.max(max, itemTimestamp(item)), 0);
  $: filteredFeed = pageData.feed
    .filter((item) => matchesFilter(item, activeFilter))
    .filter((item) => matchesWindow(item, activeWindow, referenceTime))
    .slice()
    .sort((left, right) => compareItems(left, right, activeSort));
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

  function matchesFilter(item: PublicFeedItem, filter: DirectoryFilter) {
    if (filter === 'all') {
      return true;
    }

    if (filter === 'projects') {
      return item.kind === 'project';
    }

    if (filter === 'threads') {
      return item.kind === 'thread';
    }

    return item.kind === 'event';
  }

  function itemTimestamp(item: PublicFeedItem) {
    return +(new Date(item.lastActivityAt));
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

  function matchesWindow(item: PublicFeedItem, window: FeedWindow, referenceTime: number) {
    if (window === 'all') {
      return true;
    }

    return referenceTime - itemTimestamp(item) <= timeWindowMs(window);
  }

  function compareItems(left: PublicFeedItem, right: PublicFeedItem, sort: FeedSort) {
    if (sort === 'popular') {
      return right.voteCount - left.voteCount || itemTimestamp(right) - itemTimestamp(left);
    }

    return itemTimestamp(right) - itemTimestamp(left);
  }

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
        >
          <FeedToolbarIcon name="filter" />
        </IconMenuButton>

        <IconMenuButton bind:value={activeSort} ariaLabel={`Sort ${pageData.title} feed by`} options={sortOptions}>
          <FeedToolbarIcon name="sort" />
        </IconMenuButton>

        <IconMenuButton
          bind:value={activeWindow}
          ariaLabel={`${pageData.title} feed time window`}
          defaultValue="all"
          options={windowOptions}
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
    {:else if filteredFeed.length === 0}
      <section class="info-card">
        <p>{pageData.emptyFeedText}</p>
      </section>
    {:else}
      {#each filteredFeed as item}
        <PublicFeedCard item={item} />
      {/each}
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
