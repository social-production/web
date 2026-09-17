<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import SurfaceTypeLabel from '$lib/components/cards/shared/SurfaceTypeLabel.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import type { NotificationItem } from '$lib/types/inbox';
  import { localizedNotificationBody } from '$lib/i18n/notifications';
  import * as m from '$lib/paraglide/messages';
  import ContentMetaRow from '$lib/components/shared/ContentMetaRow.svelte';
  import { surfaceTypeAccent } from '$lib/utils/surfaceType';

  export let item: NotificationItem;
  export let followRequestPending = '';
  export let onAcceptFollowRequest: ((username: string) => void) | undefined = undefined;
  export let onRejectFollowRequest: ((username: string) => void) | undefined = undefined;

  $: orderedTags = [...(item.channelTags ?? []), ...(item.communityTags ?? [])];
  $: isFollowRequest = item.kind === 'follow-request' && !!item.actorUsername;
  $: isSocialFollowNotice =
    item.kind === 'follow-request' || item.kind === 'follow-accepted' || item.kind === 'new-follower';
  $: showFollowRequestActions = isFollowRequest && item.isUnread;
  $: displayBody = localizedNotificationBody(item);

  const dispatch = createEventDispatcher<{ read: void; activate: void }>();

  function handleCardClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (target.closest('a, button')) {
      return;
    }

    dispatch('activate');
  }

  function handleCardKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    dispatch('activate');
  }
</script>

<FeedSurface
  interactive
  compact
  clampExcerpts={false}
  tone={item.surface === 'personal' ? 'personal' : 'public'}
  accent={isSocialFollowNotice ? null : surfaceTypeAccent(item.subjectKind, item.projectMode ?? 'productive')}
>
  <div
    class:unread={item.isUnread}
    class="notification-card"
    on:click={handleCardClick}
    on:keydown={handleCardKeydown}
    role="link"
    tabindex="0"
  >
    {#if isSocialFollowNotice && item.actorUsername}
      <div class="identity-row">
        {#if item.isUnread}
          <span class="unread-dot"></span>
        {/if}
        <AvatarBadge size="sm" username={item.actorUsername} imageUrl={item.actorProfileImageUrl ?? null} />
        <a class="name" href={`/profile/${item.actorUsername}`}>{item.actorUsername}</a>
      </div>
    {:else}
      <div class="kicker">
        {#if item.isUnread}
          <span class="unread-dot"></span>
        {/if}
        <SurfaceTypeLabel kind={item.subjectKind} projectMode={item.projectMode ?? 'productive'} />
        {#if item.actionLabel}
          <span class="action">{item.actionLabel}</span>
        {/if}
      </div>
    {/if}

    <div class="copy-row">
      <div class="copy">
        {#if !isSocialFollowNotice && item.title}
          <p class="title-text">{item.title}</p>
        {/if}

        {#if displayBody}
          <p class="body">{displayBody}</p>
        {/if}

        {#if !isSocialFollowNotice && !item.title && !displayBody && orderedTags.length > 0}
          <TagList tags={orderedTags} />
        {/if}
      </div>

      {#if !showFollowRequestActions && !item.isUnread}
        <div class="footer-meta">
          {#if isSocialFollowNotice}
            <ContentMetaRow timeOnly createdAt={item.createdAt} />
          {:else}
            <ContentMetaRow authorUsername={item.actorUsername ?? null} createdAt={item.createdAt} />
          {/if}
        </div>
      {/if}
    </div>

    {#if showFollowRequestActions || item.isUnread}
      <div class="meta-row">
        <div class="meta-actions">
          {#if showFollowRequestActions && item.actorUsername}
            <button
              class="accept-button"
              disabled={followRequestPending === item.actorUsername}
              type="button"
              on:click={() => onAcceptFollowRequest?.(item.actorUsername!)}
            >
              {m.notification_accept_follower()}
            </button>
            <button
              class="decline-button"
              disabled={followRequestPending === item.actorUsername}
              type="button"
              on:click={() => onRejectFollowRequest?.(item.actorUsername!)}
            >
              {m.notification_decline_follower()}
            </button>
          {/if}

          {#if item.isUnread}
            <button class="mark-read" type="button" on:click={() => dispatch('read')}>{m.notification_mark_read()}</button>
          {/if}
        </div>

        <div class="footer-meta">
          {#if isSocialFollowNotice}
            <ContentMetaRow timeOnly createdAt={item.createdAt} />
          {:else}
            <ContentMetaRow authorUsername={item.actorUsername ?? null} createdAt={item.createdAt} />
          {/if}
        </div>
      </div>
    {/if}
  </div>
</FeedSurface>

<style>
  .notification-card {
    display: grid;
    gap: 6px;
    cursor: pointer;
  }

  .identity-row,
  .kicker,
  .copy-row,
  .meta-row,
  .meta-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    min-width: 0;
  }

  .copy-row {
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
  }

  .identity-row {
    gap: 0.6rem;
  }

  .kicker {
    flex-wrap: wrap;
  }

  .copy {
    display: grid;
    gap: 2px;
    flex: 1 1 auto;
    min-width: 0;
  }

  .unread-dot {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: var(--brand);
    flex: 0 0 auto;
  }

  .name {
    min-width: 0;
    color: var(--text-main);
    font-weight: 800;
    text-decoration: none;
    overflow-wrap: anywhere;
  }

  .title-text {
    margin: 0;
    color: var(--text-main);
    font-size: 15px;
    font-weight: 700;
    line-height: 1.3;
  }

  .action,
  .body {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.4;
  }

  .action {
    font-size: 12px;
    font-weight: 700;
  }

  .meta-row {
    justify-content: space-between;
    gap: 12px;
    margin-top: 2px;
  }

  .meta-actions {
    flex: 1 1 auto;
    flex-wrap: wrap;
  }

  .footer-meta {
    margin-left: auto;
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    text-align: right;
    white-space: nowrap;
  }

  .mark-read {
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .mark-read:hover {
    color: var(--brand-strong);
  }

  .accept-button,
  .decline-button {
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

  .decline-button {
    border: 1px solid var(--panel-border);
    background: transparent;
    color: var(--text-main);
  }
</style>
