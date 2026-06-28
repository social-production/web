<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import SubjectTablet from '$lib/components/cards/shared/SubjectTablet.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import type { NotificationItem } from '$lib/types/inbox';
  import { localizedNotificationBody } from '$lib/i18n/notifications';
  import * as m from '$lib/paraglide/messages';
  import { formatRelativeTime } from '$lib/utils/time';

  export let item: NotificationItem;
  export let followRequestPending = '';
  export let onAcceptFollowRequest: ((username: string) => void) | undefined = undefined;
  export let onRejectFollowRequest: ((username: string) => void) | undefined = undefined;

  $: orderedTags = [...item.channelTags, ...item.communityTags];
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

<FeedSurface tone={item.surface === 'personal' ? 'personal' : 'public'}>
  <div
    class:unread={item.isUnread}
    class="notification-card"
    on:click={handleCardClick}
    on:keydown={handleCardKeydown}
    role="link"
    tabindex="0"
  >
    <div class="topline">
      <div class="kind-row">
        {#if item.isUnread}
          <span class="unread-dot"></span>
        {/if}
        {#if !isSocialFollowNotice}
          <SubjectTablet kind={item.subjectKind} projectMode={item.projectMode ?? 'productive'} />
        {/if}
        {#if item.actionLabel}
          <span class="action">- {item.actionLabel}</span>
        {/if}
      </div>

      <TagList tags={orderedTags} />
    </div>

    {#if item.title}
      <p class="title-text">{item.title}</p>
    {/if}

    {#if displayBody}
      <p class="body">{displayBody}</p>
    {/if}

    {#if showFollowRequestActions && item.actorUsername}
      <div class="follow-request-actions">
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
      </div>
    {/if}

    <div class="footer">
      {#if item.isUnread}
        <button class="mark-read" type="button" on:click={() => dispatch('read')}>{m.notification_mark_read()}</button>
      {/if}
      <div class="footer-meta">
        {#if item.actorUsername}
          <a class="actor-link" href={`/profile/${item.actorUsername}`}>{item.actorUsername}</a>
        {/if}
        <span class="time">{formatRelativeTime(item.createdAt)}</span>
      </div>
    </div>
  </div>
</FeedSurface>

<style>
  .notification-card,
  .footer-meta {
    display: grid;
    gap: 12px;
  }

  .notification-card {
    cursor: pointer;
  }

  .notification-card.unread {
    position: relative;
  }

  .notification-card.unread::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: -16px;
    width: 3px;
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
    background: var(--brand);
  }

  .topline,
  .kind-row,
  .footer,
  .footer-meta {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .topline,
  .footer {
    justify-content: space-between;
  }

  .topline {
    align-items: flex-start;
  }

  .unread-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--brand);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand) 18%, transparent);
  }

  .title-text {
    color: var(--text-main);
    font-size: 15px;
    font-weight: 800;
    line-height: 1.35;
  }

  .actor-link {
    color: var(--text-main);
    font-weight: 800;
  }

  .action,
  .body,
  .time {
    color: var(--text-soft);
    line-height: 1.45;
  }

  .mark-read {
    font-size: 12px;
    font-weight: 700;
  }

  .mark-read {
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-soft);
    transition: border-color 120ms ease, background-color 120ms ease, color 120ms ease;
  }

  .mark-read:hover {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .follow-request-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .accept-button,
  .decline-button {
    padding: 8px 12px;
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
    background: var(--panel-strong);
    color: var(--text-soft);
  }

  .footer-meta {
    margin-left: auto;
    justify-content: flex-end;
  }

  @media (max-width: 760px) {
    .notification-card.unread::before {
      left: -12px;
    }

    .footer-meta {
      margin-left: 0;
      justify-content: flex-start;
    }
  }
</style>
