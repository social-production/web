<script lang="ts">
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import IconPopoverMenu from '$lib/components/shared/IconPopoverMenu.svelte';
  import CommunityInvitePanel from '$lib/features/communities/CommunityInvitePanel.svelte';
  import ScopeCreateMenu from '$lib/features/shared-directory/ScopeCreateMenu.svelte';
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
  $: isInviteOnly = pageData.membership.joinPolicy === 'invite_only';
  $: isMember = pageData.membership.viewerIsMember;
  $: membershipDisabled =
    !isInviteOnly && (!pageData.membership.viewerCanToggleMembership || membershipPending);
</script>

<section class="scope-header">
  <div class="title-row">
    <div class="title-block">
      <h1>{pageData.title}</h1>
    </div>

    <div class="action-row">
      {#each pageData.badges as badge}
        <span class="scope-badge">{badge}</span>
      {/each}

      <span aria-label={`${pageData.membership.memberCount} members`} class="member-chip">
        <FeedToolbarIcon name="people" />
        <span>{pageData.membership.memberCount}</span>
      </span>

      {#if isInviteOnly}
        <IconPopoverMenu
          bind:open={showInvitePanel}
          active={showInvitePanel}
          ariaLabel={isMember ? `Invite people to ${pageData.title}` : `Join ${pageData.title} with invite`}
          menuLabel={isMember ? 'Invite people' : 'Join with invite'}
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

        {#if isMember}
          <button
            aria-label={`Leave ${pageData.title}`}
            class="icon-action"
            class:menu-active={isMember}
            disabled={membershipPending}
            type="button"
            on:click={onLeave}
          >
            <FeedToolbarIcon name="person-check" />
          </button>
        {/if}
      {:else}
        <button
          aria-label={isMember ? `Leave ${pageData.title}` : `Join ${pageData.title}`}
          class="icon-action"
          class:menu-active={isMember}
          disabled={membershipDisabled}
          type="button"
          on:click={onMembershipAction}
        >
          <FeedToolbarIcon name={isMember ? 'person-check' : 'person-plus'} />
        </button>
      {/if}

      <ScopeCreateMenu {pageData} title={pageData.title} />

      {#if showRolePanel}
        <button
          aria-expanded={showBoardPanel}
          aria-label="Moderators"
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

<style>
  .scope-header {
    display: grid;
    gap: 10px;
    padding: 0 0 8px;
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
    min-width: 0;
    flex: 1 1 auto;
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
    border-radius: var(--radius-sm);
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
    flex: 0 0 auto;
  }

  .member-chip span {
    color: var(--text-main);
    font-size: 12px;
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
  }

  @media (max-width: 760px) {
    h1 {
      white-space: normal;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      overflow: hidden;
    }

    .action-row {
      max-width: 62%;
    }
  }
</style>
