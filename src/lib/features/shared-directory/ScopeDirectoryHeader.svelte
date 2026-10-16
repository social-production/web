<script lang="ts">
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import IconPopoverMenu from '$lib/components/shared/IconPopoverMenu.svelte';
  import CommunityInvitePanel from '$lib/features/communities/CommunityInvitePanel.svelte';
  import ScopeAvatar from '$lib/features/shared-directory/ScopeAvatar.svelte';
  import ScopeSettingsSheet from '$lib/features/shared-directory/ScopeSettingsSheet.svelte';
  import ScopeVoteSheet from '$lib/features/shared-directory/ScopeVoteSheet.svelte';
  import type { ScopePageData } from '$lib/types/scope';

  export let pageData: ScopePageData;
  export let membershipPending = false;
  export let showBoardPanel = false;
  export let showInvitePanel = false;
  export let inviteDraft = '';
  export let invitePending = false;
  export let inviteFeedback = '';
  export let inviteFeedbackTone: 'soft' | 'warning' = 'soft';
  export let onMembershipAction: () => void | Promise<void> = async () => {};
  export let onLeave: () => void | Promise<void> = async () => {};
  export let onInviteRedeem: () => void | Promise<void> = async () => {};
  export let onToggleBoardPanel: () => void = () => {};

  $: showRolePanel = pageData.kind === 'platform';
  // The Platform page is the "platform" channel underneath.
  $: settingsKind = (pageData.kind === 'community' ? 'community' : 'channel') as 'channel' | 'community';
  $: settingsSlug = pageData.kind === 'platform' ? 'platform' : pageData.slug;
  let showSettings = false;
  let showVotes = false;
  $: isInviteOnly = pageData.membership.joinPolicy === 'invite_only';
  $: isMember = pageData.membership.viewerIsMember;
  $: membershipDisabled =
    !isInviteOnly && (!pageData.membership.viewerCanToggleMembership || membershipPending);
</script>

<section class="scope-header">
  <div class="title-row">
    <div class="title-block">
      <ScopeAvatar imageUrl={pageData.imageUrl} kind={settingsKind} size={40} />
      <h1>{pageData.title}</h1>
      {#each pageData.badges as badge}
        {#if badge === 'Private'}
          <span class="private-mark" title="Private: members only" aria-label="Private">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14">
              <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
            </svg>
          </span>
        {:else}
          <span class="scope-badge">{badge}</span>
        {/if}
      {/each}
    </div>

    <div class="action-row">

      {#if isInviteOnly}
        {#if !isMember}
          <IconPopoverMenu
            bind:open={showInvitePanel}
            active={showInvitePanel}
            chip
            ariaLabel={`Join ${pageData.title} with invite, ${pageData.membership.memberCount} members`}
            menuLabel="Join with invite"
            minWidth={300}
          >
            <svelte:fragment slot="icon">
              <FeedToolbarIcon name="person-plus" />
              <span>{pageData.membership.memberCount}</span>
            </svelte:fragment>
            <CommunityInvitePanel
              variant="popover"
              active={showInvitePanel}
              bind:inviteDraft
              bind:inviteFeedback
              bind:inviteFeedbackTone
              bind:invitePending
              {pageData}
              onRedeem={onInviteRedeem}
            />
          </IconPopoverMenu>
        {:else}
          <button
            aria-label={`Leave ${pageData.title}, ${pageData.membership.memberCount} members`} title={`Leave ${pageData.title}, ${pageData.membership.memberCount} members`}
            class="member-chip"
            class:menu-active={isMember}
            disabled={membershipPending}
            type="button"
            on:click={onLeave}
          >
            <FeedToolbarIcon name="person-check" />
            <span>{pageData.membership.memberCount}</span>
          </button>

          <IconPopoverMenu
            bind:open={showInvitePanel}
            active={showInvitePanel}
            ariaLabel={`Invite people to ${pageData.title}`}
            menuLabel="Invite people"
            minWidth={300}
          >
            <FeedToolbarIcon slot="icon" name="person-plus" />
            <CommunityInvitePanel
              variant="popover"
              active={showInvitePanel}
              bind:inviteDraft
              bind:inviteFeedback
              bind:inviteFeedbackTone
              bind:invitePending
              {pageData}
              onRedeem={onInviteRedeem}
            />
          </IconPopoverMenu>
        {/if}
      {:else}
        <button
          aria-label={isMember
            ? `Leave ${pageData.title}, ${pageData.membership.memberCount} members`
            : `Join ${pageData.title}, ${pageData.membership.memberCount} members`} title={isMember
            ? `Leave ${pageData.title}, ${pageData.membership.memberCount} members`
            : `Join ${pageData.title}, ${pageData.membership.memberCount} members`}
          class="member-chip"
          class:menu-active={isMember}
          disabled={membershipDisabled}
          type="button"
          on:click={onMembershipAction}
        >
          <FeedToolbarIcon name={isMember ? 'person-check' : 'person-plus'} />
          <span>{pageData.membership.memberCount}</span>
        </button>
      {/if}

      <button
        aria-label="Settings"
        title="Settings"
        class="icon-action"
        class:menu-active={showSettings}
        type="button"
        on:click={() => (showSettings = true)}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
          <path
            d="M10.3 2h3.4l.5 2.4c.5.2 1 .4 1.5.6l2.1-1.2 2.4 2.4-1.2 2.1c.2.5.4 1 .6 1.5L22 10.3v3.4l-2.4.5c-.2.5-.4 1-.6 1.5l1.2 2.1-2.4 2.4-2.1-1.2c-.5.2-1 .4-1.5.6L13.7 22h-3.4l-.5-2.4c-.5-.2-1-.4-1.5-.6l-2.1 1.2-2.4-2.4 1.2-2.1c-.2-.5-.4-1-.6-1.5L2 13.7v-3.4l2.4-.5c.2-.5.4-1 .6-1.5L3.8 6.2l2.4-2.4 2.1 1.2c.5-.2 1-.4 1.5-.6L10.3 2Zm1.7 6.2A3.8 3.8 0 1 0 12 15.8 3.8 3.8 0 0 0 12 8.2Z"
            fill="currentColor"
          ></path>
        </svg>
      </button>

      {#if showRolePanel}
        <button
          aria-expanded={showBoardPanel}
          aria-label="Moderators" title="Moderators"
          class="icon-action"
          class:menu-active={showBoardPanel}
          type="button"
          on:click={onToggleBoardPanel}
        >
          <FeedToolbarIcon name="shield" />
        </button>
      {/if}
    </div>
  </div>

  <div class="scope-intro-prose">
    <p>{pageData.description}</p>
  </div>
</section>

<ScopeSettingsSheet bind:open={showSettings} kind={settingsKind} slug={settingsSlug} />
<ScopeVoteSheet bind:open={showVotes} kind={settingsKind} slug={settingsSlug} />

{#if (pageData.openVotes ?? 0) > 0}
  <!-- Sits just left of the + button while a settings vote is waiting for this viewer. -->
  <button class="vote-fab" type="button" aria-label={`Vote (${pageData.openVotes} open)`} on:click={() => (showVotes = true)}>
    Vote
    <span class="vote-fab-count">{pageData.openVotes}</span>
  </button>
{/if}

<style>
  .scope-header {
    display: grid;
    gap: 10px;
    padding: 12px var(--page-gutter) 10px;
    border: none;
    border-bottom: 1px solid var(--panel-border);
    min-width: 0;
  }

  .title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-height: 48px;
    min-width: 0;
    flex-wrap: nowrap;
  }

  .title-block {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1 1 auto;
  }

  .vote-fab {
    position: fixed;
    right: calc(var(--right-width, 0px) + 12px + 52px + 10px);
    bottom: calc(var(--shell-bottom-nav-offset, 0px) + 12px);
    z-index: 56;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 52px;
    padding: 0 18px;
    border: 0;
    border-radius: 999px;
    background: var(--brand);
    color: var(--on-brand, #fff);
    font: inherit;
    font-weight: 800;
    box-shadow: 0 8px 20px color-mix(in srgb, black 24%, transparent);
    cursor: pointer;
  }

  .vote-fab-count {
    display: inline-grid;
    place-items: center;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    border-radius: 999px;
    background: color-mix(in srgb, white 85%, transparent);
    color: var(--brand-strong);
    font-size: 12px;
  }

  .private-mark {
    display: inline-grid;
    flex: 0 0 auto;
    place-items: center;
    color: var(--text-soft);
  }

  .scope-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 7px;
    border-radius: 999px;
    border: 1px solid var(--panel-border);
    color: var(--text-soft);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.02em;
    white-space: nowrap;
    flex: 0 0 auto;
  }

  h1 {
    margin: 0;
    font-size: 19px;
    line-height: 1.2;
    letter-spacing: -0.02em;
    color: var(--text-main);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .action-row {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    flex: 0 1 auto;
    flex-wrap: nowrap;
    max-width: 58%;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .action-row::-webkit-scrollbar {
    display: none;
  }

  .member-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 6px;
    min-height: 32px;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
    flex: 0 0 auto;
    cursor: pointer;
    transition: background-color 120ms ease, color 120ms ease, box-shadow 120ms ease;
  }

  .member-chip span {
    color: var(--text-main);
    font-size: 12px;
  }

  .member-chip :global(.toolbar-icon) {
    width: 18px;
    height: 18px;
  }

  .member-chip:hover:not(:disabled),
  .member-chip.menu-active {
    background: color-mix(in srgb, var(--panel-border) 42%, transparent);
    color: var(--text-main);
  }

  .member-chip.menu-active {
    box-shadow: inset 0 -2px 0 var(--text-soft);
  }

  .member-chip:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .icon-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-soft);
    flex: 0 0 auto;
    transition: background-color 120ms ease, color 120ms ease, box-shadow 120ms ease;
  }

  .icon-action:hover:not(:disabled),
  .icon-action.menu-active {
    background: color-mix(in srgb, var(--panel-border) 42%, transparent);
    color: var(--text-main);
  }

  .icon-action.menu-active {
    box-shadow: inset 0 -2px 0 var(--text-soft);
  }

  .icon-action:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .scope-intro-prose {
    max-width: 65ch;
  }

  .scope-intro-prose p {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.6;
    overflow-wrap: anywhere;
    word-break: break-word;
    white-space: pre-line;
  }

  @media (max-width: 760px) {
    h1 {
      font-size: clamp(15px, 4.2vw, 18px);
    }

    .action-row {
      max-width: none;
      flex: 0 0 auto;
    }
  }
</style>
