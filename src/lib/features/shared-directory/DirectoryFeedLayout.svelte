<script lang="ts">
  import { browser } from '$app/environment';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import PublicFeedCard from '$lib/components/cards/public-feed/PublicFeedCard.svelte';
  import { setVote } from '$lib/services/queries/feeds';
  import { redeemScopeInvite, toggleScopeMembership } from '$lib/services/queries/scopes';
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

  $: showRolePanel = pageData.kind === 'platform' && (pageData.boardMembers?.length ?? 0) > 0;
  $: if (!showRolePanel && showBoardPanel) {
    showBoardPanel = false;
  }
  $: referenceTime = pageData.feed.reduce((max, item) => Math.max(max, itemTimestamp(item)), 0);
  $: filteredFeed = pageData.feed
    .filter((item) => matchesFilter(item, activeFilter))
    .filter((item) => matchesWindow(item, activeWindow, referenceTime))
    .slice()
    .sort((left, right) => compareItems(left, right, activeSort));
  $: shareInviteLink =
    pageData.membership.inviteLink && browser && pageData.membership.inviteLink.startsWith('/')
      ? `${window.location.origin}${pageData.membership.inviteLink}`
      : pageData.membership.inviteLink ?? '';
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
    return (member.confidenceRatio ?? 0) >= 70;
  }

  function boardStatusLabel(member: ScopeMemberSummary) {
    if (member.confidenceRatio === undefined) {
      return 'Recorded board seat';
    }

    return meetsConfidenceThreshold(member) ? 'Above threshold' : 'Under review';
  }

  async function handleConfidenceVote(member: ScopeMemberSummary, event: CustomEvent<{ vote: VoteDirection }>) {
    if (!member.confidenceTargetId) {
      return;
    }

    await setVote(member.confidenceTargetId, event.detail.vote);
    await invalidateAll();
  }

  async function handleMembershipToggle() {
    membershipPending = true;

    try {
      await toggleScopeMembership(pageData.kind, pageData.slug);
      await invalidateAll();
    } finally {
      membershipPending = false;
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
    if (!inviteDraft.trim()) {
      return;
    }

    invitePending = true;
    inviteFeedback = '';
    inviteFeedbackTone = 'soft';

    try {
      const joined = await redeemScopeInvite(pageData.kind, pageData.slug, inviteDraft);

      if (!joined) {
        inviteFeedback = 'That invite link does not unlock this closed community.';
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

  async function copyInviteLink() {
    if (!shareInviteLink) {
      return;
    }

    if (!browser || !navigator.clipboard) {
      inviteFeedback = 'Copy the invite link manually from the field below.';
      inviteFeedbackTone = 'soft';
      return;
    }

    await navigator.clipboard.writeText(shareInviteLink);
    inviteFeedback = 'Invite link copied.';
    inviteFeedbackTone = 'soft';
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
          Board members
        </button>
      </div>
    {/if}

    {#if pageData.membership.joinPolicy === 'invite_only' && showInvitePanel}
      <section class="invite-card">
        {#if pageData.membership.viewerIsMember && shareInviteLink}
          <div class="invite-copy">
            <h2>Invite link</h2>
            <p>Share this link when you want to bring someone into this closed community.</p>
          </div>

          <div class="invite-actions">
            <input aria-label={`${pageData.title} invite link`} readonly type="text" value={shareInviteLink} />
            <button class="tab-chip" type="button" on:click={copyInviteLink}>Copy link</button>
          </div>
        {:else}
          <div class="invite-copy">
            <h2>Use invite link</h2>
            <p>Paste a closed-community invite link or invite code to join and unlock the feed.</p>
          </div>

          <div class="invite-actions">
            <input
              aria-label={`${pageData.title} invite link input`}
              bind:value={inviteDraft}
              placeholder="Paste invite link or invite code"
              type="text"
            />
            <button
              class="tab-chip"
              disabled={!inviteDraft.trim() || invitePending}
              type="button"
              on:click={handleInviteRedeem}
            >
              Join with invite
            </button>
          </div>
        {/if}

        {#if inviteFeedback}
          <p class:warning={inviteFeedbackTone === 'warning'} class="invite-feedback">{inviteFeedback}</p>
        {/if}
      </section>
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
    <section class="people-card">
      <h2>Board members</h2>
      <p class="panel-copy">{pageData.boardNote}</p>

      <div class="role-rules-card">
        <h3>How board roles work</h3>
        <ul>
          <li>
            Board members oversee platform-tagged work and the eventual conversion of completed collective funds into real nonprofit-held assets.
          </li>
          <li>Confidence voting stays visible on every role holder so members can see whether the role remains above the 70% threshold.</li>
          <li>Roles below threshold stay visible as under review until the scope renews or replaces them.</li>
        </ul>
      </div>

      <div class="people-stack">
        {#if !pageData.boardMembers || pageData.boardMembers.length === 0}
          <div class="person-row">
            <strong>No board members listed yet.</strong>
          </div>
        {:else}
          {#each pageData.boardMembers as member}
            <div class="person-row confidence-row">
              <div class="person-copy">
                <a class="person-link" href={`/profile/${member.username}`}>
                  <strong>{member.username}</strong>
                  <span>{member.bio ?? 'Profile details coming soon.'}</span>
                </a>
                {#if member.confidenceRatio !== undefined}
                  <div class="confidence-summary">
                    <span class={`status-chip ${meetsConfidenceThreshold(member) ? 'healthy' : 'warning'}`}>
                      {boardStatusLabel(member)}
                    </span>
                    <span class:healthy={meetsConfidenceThreshold(member)} class:warning={!meetsConfidenceThreshold(member)}>
                      {member.confidenceRatio}% confidence
                    </span>
                    <span>{member.confidenceReviewCount} reviews</span>
                  </div>
                {/if}
              </div>

              {#if member.confidenceTargetId && showRolePanel}
                <VoteStrip
                  activeVote={member.confidenceActiveVote ?? 0}
                  count={member.confidenceVoteCount ?? 0}
                  on:vote={(event) => handleConfidenceVote(member, event)}
                />
              {/if}
            </div>
          {/each}
        {/if}
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
  .stack,
  .people-stack,
  .role-rules-card {
    display: grid;
  }

  .directory-page,
  .people-stack,
  .role-rules-card {
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
  .people-card,
  .info-card,
  .invite-card,
  .role-rules-card {
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

  .header-copy,
  .person-copy,
  .invite-copy {
    display: grid;
    gap: 6px;
  }

  .header-copy h1,
  .people-card h2,
  .invite-copy h2 {
    font-size: 22px;
    letter-spacing: -0.02em;
  }

  .people-card h2,
  .invite-copy h2 {
    font-size: 16px;
  }

  .header-copy p,
  .panel-copy,
  .invite-copy p,
  .invite-feedback,
  .person-copy span,
  .confidence-summary span,
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

  .invite-actions,
  .confidence-summary,
  .person-row,
  .confidence-row {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .invite-actions input {
    flex: 1 1 280px;
  }

  .people-stack {
    margin-top: 10px;
  }

  .person-row {
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
  }

  .person-link {
    display: grid;
    gap: 3px;
  }

  .healthy {
    color: var(--brand-strong);
  }

  .warning {
    color: var(--accent-warm-strong);
  }

  .role-rules-card h3 {
    font-size: 14px;
    color: var(--text-main);
  }

  .role-rules-card ul {
    margin: 0;
    padding-left: 18px;
    color: var(--text-soft);
    line-height: 1.5;
  }

  .status-chip {
    padding: 4px 8px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
  }

  .status-chip.healthy {
    background: color-mix(in srgb, var(--brand-soft) 75%, var(--panel));
    color: var(--brand-strong);
  }

  .status-chip.warning {
    background: color-mix(in srgb, var(--accent-warm) 18%, var(--panel));
    color: var(--accent-warm-strong);
  }

  @media (max-width: 760px) {
    .toolbar-card,
    .header-topline,
    .person-row,
    .confidence-row,
    .invite-actions {
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
      grid-template-columns: repeat(1, minmax(0, 1fr));
      width: 100%;
    }
  }
</style>