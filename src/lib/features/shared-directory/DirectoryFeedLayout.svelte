<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import PublicFeedCard from '$lib/components/cards/public-feed/PublicFeedCard.svelte';
  import CommunityInvitePanel from '$lib/features/communities/CommunityInvitePanel.svelte';
  import PlatformBoardPanel from '$lib/features/platform/board/PlatformBoardPanel.svelte';
  import { setVote } from '$lib/services/queries/feeds';
  import { redeemScopeInvite, toggleScopeMembership, castModeratorVote } from '$lib/services/queries/scopes';
  import { parseInviteToken } from '$lib/utils/invite-token';
  import type { PublicFeedItem, VoteDirection } from '$lib/types/feed';
  import type { ScopeMemberSummary, ScopePageData } from '$lib/types/scope';

  export let pageData: ScopePageData;

  type DirectoryFilter = 'all' | 'projects' | 'threads' | 'events';
  type FeedSort = 'popular' | 'recent';
  type FeedWindow = '12h' | '1d' | '7d' | '1m' | '1y' | 'all';

  let activeFilter: 'all' | 'projects' | 'threads' | 'events' = 'all';
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
  $: inviteButtonActive =
    pageData.membership.joinPolicy === 'invite_only'
      ? showInvitePanel
      : pageData.membership.viewerIsMember;
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
      await toggleScopeMembership(pageData.kind, pageData.slug);
    } catch (err) {
      console.error('Failed to toggle membership:', err);
    } finally {
      membershipPending = false;
      await invalidateAll();
    }
  }

  async function handleHeaderAction() {
    if (pageData.membership.joinPolicy === 'invite_only') {
      showInvitePanel = !showInvitePanel;
      inviteFeedback = '';
      inviteFeedbackTone = 'soft';
      return;
    }

    await handleMembershipToggle();
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
  <section class="header-card">
    <div class="header-topline">
      <div class="badge-row">
        {#each pageData.badges as badge}
          <span class="badge">{badge}</span>
        {/each}
      </div>
      <div class="membership-row">
        <span class="member-count">{pageData.membership.memberCount} members</span>
        {#if pageData.membership.joinPolicy === 'invite_only' && pageData.membership.viewerIsMember}
          <button
            class="tab-chip"
            disabled={membershipPending}
            type="button"
            on:click={handleMembershipToggle}
          >
            Leave
          </button>
        {/if}
        <button
          aria-label={
            pageData.membership.joinPolicy === 'invite_only'
              ? showInvitePanel
                ? `Hide invite panel for ${pageData.title}`
                : `Open invite panel for ${pageData.title}`
              : pageData.membership.viewerIsMember
                ? `Leave ${pageData.title}`
                : `Join ${pageData.title}`
          }
          class:active={inviteButtonActive}
          class="membership-button"
          disabled={
            pageData.membership.joinPolicy === 'invite_only'
              ? false
              : !pageData.membership.viewerCanToggleMembership || membershipPending
          }
          type="button"
          on:click={handleHeaderAction}
        >
          +
        </button>
      </div>
    </div>

    <div class="header-copy">
      <h1>{pageData.title}</h1>
      <p>{pageData.description}</p>
      {#if pageData.note}
        <p class="note">{pageData.note}</p>
      {/if}
    </div>

    {#if showRolePanel}
      <div class="header-actions">
        <button
          class:active={showBoardPanel}
          class="tab-chip"
          type="button"
          on:click={() => (showBoardPanel = !showBoardPanel)}
        >
          Moderators
        </button>
      </div>
    {/if}

    {#if pageData.membership.joinPolicy === 'invite_only' && showInvitePanel}
      <CommunityInvitePanel
        active={showInvitePanel}
        bind:inviteDraft
        bind:inviteFeedback
        bind:inviteFeedbackTone
        bind:invitePending
        {pageData}
        onRedeem={handleInviteRedeem}
      />
    {/if}
  </section>

  {#if pageData.membership.viewerCanSeeFeed}
    <section class="toolbar-card">
      <div class="controls-row">
        <select aria-label={`Filter ${pageData.title} feed`} bind:value={activeFilter}>
          <option value="all">All items</option>
          <option value="projects">Projects</option>
          <option value="threads">Threads</option>
          <option value="events">Events</option>
        </select>

        <select aria-label={`Sort ${pageData.title} feed by`} bind:value={activeSort}>
          <option value="popular">Most popular</option>
          <option value="recent">Most recent</option>
        </select>

        <select aria-label={`${pageData.title} feed time window`} bind:value={activeWindow}>
          <option value="12h">Last 12 hours</option>
          <option value="1d">1 day</option>
          <option value="7d">7 days</option>
          <option value="1m">1 month</option>
          <option value="1y">1 year</option>
          <option value="all">All time</option>
        </select>
      </div>
    </section>
  {/if}

  {#if showRolePanel && showBoardPanel}
    <PlatformBoardPanel
      {pageData}
      {boardStatusLabel}
      {meetsConfidenceThreshold}
      onVote={handleConfidenceVote}
    />
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
  }

  .header-card {
    display: grid;
    gap: 12px;
  }

  .header-card,
  .toolbar-card,
  .info-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .info-card {
    border-radius: 0;
  }

  .header-topline,
  .membership-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .header-topline {
    justify-content: space-between;
  }

  .badge-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .badge,
  .tab-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 7px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--panel-border);
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .tab-chip.active {
    border-color: transparent;
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .header-actions {
    display: flex;
    justify-content: flex-end;
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

  .header-copy {
    display: grid;
    gap: 6px;
  }

  .header-copy h1 {
    font-size: 22px;
    letter-spacing: -0.02em;
  }

  .header-copy p,
  .member-count,
  .note,
  .info-card p {
    color: var(--text-soft);
    line-height: 1.5;
  }

  .membership-button {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    border: 1px solid var(--panel-border);
    background: var(--panel-strong);
    color: var(--brand-strong);
    font-size: 18px;
    font-weight: 800;
  }

  .membership-button.active,
  .membership-button:hover:not(:disabled) {
    border-color: var(--brand);
    background: var(--brand-soft);
  }

  @media (max-width: 760px) {
    .toolbar-card,
    .header-topline {
      align-items: stretch;
      flex-direction: column;
    }

    .membership-row,
    .badge-row {
      width: 100%;
    }

    .header-actions {
      justify-content: flex-start;
    }

    .controls-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      width: 100%;
    }

    .controls-row select {
      height: 32px;
      font-size: 11px;
    }
  }
</style>