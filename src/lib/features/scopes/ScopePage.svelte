<script lang="ts">
  import { browser } from '$app/environment';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import { setVote } from '$lib/services/queries/feeds';
  import { redeemScopeInvite, toggleScopeMembership } from '$lib/services/queries/scopes';
  import PublicFeedCard from '$lib/components/cards/public-feed/PublicFeedCard.svelte';
  import type { VoteDirection } from '$lib/types/feed';
  import type { PublicFeedItem } from '$lib/types/feed';
  import type { ScopeMemberSummary, ScopePageData } from '$lib/types/scope';

  export let scope: ScopePageData;

  let activePanel: 'feed' | 'moderators' = 'feed';
  let activeFilter: 'all' | 'projects' | 'threads' | 'events' = 'all';
  let membershipPending = false;
  let inviteDraft = '';
  let invitePending = false;
  let inviteFeedback = '';
  let inviteFeedbackTone: 'soft' | 'warning' = 'soft';
  let lastInviteParam = '';

  $: filteredFeed = scope.feed.filter((item) => matchesFilter(item, activeFilter));
  $: shareInviteLink =
    scope.membership.inviteLink && browser && scope.membership.inviteLink.startsWith('/')
      ? `${window.location.origin}${scope.membership.inviteLink}`
      : scope.membership.inviteLink ?? '';
  $: {
    const inviteParam = $page.url.searchParams.get('invite') ?? '';

    if (inviteParam && inviteParam !== lastInviteParam && !scope.membership.viewerIsMember) {
      inviteDraft = inviteParam;
      inviteFeedback = '';
      inviteFeedbackTone = 'soft';
    }

    lastInviteParam = inviteParam;
  }

  function matchesFilter(item: PublicFeedItem, filter: typeof activeFilter) {
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

  function meetsConfidenceThreshold(member: ScopeMemberSummary) {
    return (member.confidenceRatio ?? 0) >= 70;
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
      await toggleScopeMembership(scope.kind, scope.slug);
      await invalidateAll();
    } finally {
      membershipPending = false;
    }
  }

  async function handleInviteRedeem() {
    if (!inviteDraft.trim()) {
      return;
    }

    invitePending = true;
    inviteFeedback = '';
    inviteFeedbackTone = 'soft';

    try {
      const joined = await redeemScopeInvite(scope.kind, scope.slug, inviteDraft);

      if (!joined) {
        inviteFeedback = 'That invite link does not unlock this closed community.';
        inviteFeedbackTone = 'warning';
        return;
      }

      inviteDraft = '';
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

<section class="scope-page">
  <section class="header-card">
    <div class="header-topline">
      <div class="badge-row">
        {#each scope.badges as badge}
          <span class="badge">{badge}</span>
        {/each}
      </div>
      <div class="membership-row">
        <span class="member-count">{scope.membership.memberCount} members</span>
        <button
          aria-label={scope.membership.viewerIsMember ? `Leave ${scope.title}` : `Join ${scope.title}`}
          class:active={scope.membership.viewerIsMember}
          class="membership-button"
          disabled={!scope.membership.viewerCanToggleMembership || membershipPending}
          type="button"
          on:click={handleMembershipToggle}
        >
          +
        </button>
      </div>
    </div>

    <div class="header-copy">
      <h1>{scope.title}</h1>
      <p>{scope.description}</p>
      {#if scope.note}
        <p class="note">{scope.note}</p>
      {/if}
    </div>

    {#if scope.membership.joinPolicy === 'invite_only'}
      <section class="invite-card">
        {#if scope.membership.viewerIsMember && shareInviteLink}
          <div class="invite-copy">
            <h2>Invite link</h2>
            <p>Share this link when you want to bring someone into this closed community.</p>
          </div>

          <div class="invite-actions">
            <input aria-label={`${scope.title} invite link`} readonly type="text" value={shareInviteLink} />
            <button class="tab-chip" type="button" on:click={copyInviteLink}>Copy link</button>
          </div>
        {:else}
          <div class="invite-copy">
            <h2>Use invite link</h2>
            <p>Paste a closed-community invite link or invite code to join and unlock the feed.</p>
          </div>

          <div class="invite-actions">
            <input
              aria-label={`${scope.title} invite link input`}
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

  <section class="toolbar-card">
    <div class="toolbar-block">
      <div class="chip-row">
        <button
          class:active={activeFilter === 'all'}
          class="tab-chip"
          type="button"
          on:click={() => {
            activePanel = 'feed';
            activeFilter = 'all';
          }}
        >
          All
        </button>
        <button
          class:active={activeFilter === 'projects'}
          class="tab-chip"
          type="button"
          on:click={() => {
            activePanel = 'feed';
            activeFilter = 'projects';
          }}
        >
          Projects
        </button>
        <button
          class:active={activeFilter === 'threads'}
          class="tab-chip"
          type="button"
          on:click={() => {
            activePanel = 'feed';
            activeFilter = 'threads';
          }}
        >
          Threads
        </button>
        <button
          class:active={activeFilter === 'events'}
          class="tab-chip"
          type="button"
          on:click={() => {
            activePanel = 'feed';
            activeFilter = 'events';
          }}
        >
          Events
        </button>
      </div>
    </div>

    <div class="toolbar-block align-end">
      <div class="chip-row">
        <button
          class:active={activePanel === 'moderators'}
          class="tab-chip"
          type="button"
          on:click={() => (activePanel = 'moderators')}
        >
          {scope.moderationLabel}
        </button>
      </div>
    </div>
  </section>

  {#if activePanel === 'feed'}
    <div class="stack">
      {#if !scope.membership.viewerCanSeeFeed}
        <section class="info-card">
          <p>{scope.membership.hiddenFeedCopy ?? 'This feed is only visible to members.'}</p>
        </section>
      {:else if filteredFeed.length === 0}
        <section class="info-card">
          <p>{scope.emptyFeedText}</p>
        </section>
      {:else}
        {#each filteredFeed as item}
          <PublicFeedCard item={item} />
        {/each}
      {/if}
    </div>
  {:else}
    <section class="people-card">
      <h2>{scope.moderationLabel}</h2>
      <p class="panel-copy">{scope.moderatorsNote}</p>

      <div class="people-stack">
        {#if scope.moderators.length === 0}
          <div class="person-row">
            <strong>No {scope.moderationLabel.toLowerCase()} listed yet.</strong>
          </div>
        {:else}
          {#each scope.moderators as member}
            <div class="person-row confidence-row">
              <div class="person-copy">
                <a class="person-link" href={`/profile/${member.username}`}>
                  <strong>{member.username}</strong>
                  <span>{member.bio ?? 'Profile details coming soon.'}</span>
                </a>
                {#if member.confidenceRatio !== undefined}
                  <div class="confidence-summary">
                    <span class:healthy={meetsConfidenceThreshold(member)} class:warning={!meetsConfidenceThreshold(member)}>
                      {member.confidenceRatio}% confidence
                    </span>
                    <span>{member.confidenceReviewCount} reviews</span>
                  </div>
                {/if}
              </div>

              {#if member.confidenceTargetId}
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
</section>

<style>
  .scope-page,
  .stack,
  .people-stack {
    display: grid;
  }

  .scope-page,
  .people-stack {
    gap: 12px;
  }

  .stack {
    gap: 0;
  }

  .header-card,
  .toolbar-card,
  .people-card,
  .info-card,
  .invite-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .info-card {
    border-radius: 0;
  }

  .header-topline,
  .chip-row,
  .toolbar-card,
  .membership-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .header-topline,
  .toolbar-card {
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
    background: var(--brand-soft);
    border-color: transparent;
    color: var(--brand-strong);
  }

  .membership-row {
    margin-left: auto;
    justify-content: flex-end;
  }

  .member-count {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .membership-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 16px;
    font-weight: 800;
    line-height: 1;
  }

  .membership-button.active {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .membership-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .header-copy {
    display: grid;
    gap: 6px;
    margin-top: 12px;
  }

  h1 {
    font-size: 22px;
    letter-spacing: -0.02em;
    color: var(--brand-strong);
  }

  .header-copy p,
  .panel-copy,
  .person-row span,
  .info-card p {
    color: var(--text-soft);
    line-height: 1.45;
  }

  .note {
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
  }

  .invite-card,
  .invite-copy {
    display: grid;
    gap: 8px;
  }

  .invite-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .invite-actions input {
    flex: 1 1 320px;
    min-width: 0;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-main);
  }

  .invite-feedback {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .invite-feedback.warning {
    color: var(--accent-warm-strong);
  }

  .align-end {
    margin-left: auto;
  }

  .person-row {
    display: block;
    padding: 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--panel-border);
    background: var(--panel-soft);
  }

  .confidence-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .person-copy,
  .person-link {
    display: grid;
    gap: 4px;
  }

  .person-link {
    color: inherit;
  }

  .confidence-summary {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.4;
  }

  .confidence-summary .healthy {
    color: var(--brand-strong);
  }

  .confidence-summary .warning {
    color: var(--accent-warm-strong);
  }

  .person-row strong,
  h2 {
    display: block;
    margin-bottom: 4px;
    font-size: 14px;
  }

  @media (max-width: 760px) {
    .toolbar-card,
    .header-topline {
      flex-direction: column;
      align-items: stretch;
    }

    .align-end {
      margin-left: 0;
    }

    .membership-row {
      margin-left: 0;
      justify-content: flex-start;
    }

    .invite-actions {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>