<script lang="ts">
  import { createEventDispatcher } from 'svelte';
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
    <div class="copy">
      {#if item.isUnread || item.actionLabel || !isSocialFollowNotice}
        <div class="kicker">
          {#if item.isUnread}
            <span class="unread-dot"></span>
          {/if}
          {#if !isSocialFollowNotice}
            <SurfaceTypeLabel kind={item.subjectKind} projectMode={item.projectMode ?? 'productive'} />
          {/if}
          {#if item.actionLabel}
            <span class="action">{item.actionLabel}</span>
          {/if}
        </div>
      {/if}

      {#if item.title}
        <p class="title-text">{item.title}</p>
      {/if}

      {#if displayBody}
        <p class="body">{displayBody}</p>
      {/if}

      {#if !item.title && !displayBody && orderedTags.length > 0}
        <TagList tags={orderedTags} />
      {/if}
    </div>

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

    <div class="meta-row">
      <div class="footer-meta">
        {#if item.actorUsername}
          <a class="actor-link" href={`/profile/${item.actorUsername}`}>{item.actorUsername}</a>
        {/if}
        <ContentMetaRow timeOnly createdAt={item.createdAt} />
      </div>
      {#if item.isUnread}
        <button class="mark-read" type="button" on:click={() => dispatch('read')}>{m.notification_mark_read()}</button>
      {/if}
    </div>
  </div>
</FeedSurface>

<style>
  .notification-card {
    display: grid;
    gap: 8px;
    cursor: pointer;
  }

  .copy {
    display: grid;
    gap: 4px;
  }

  .kicker,
  .meta-row,
  .footer-meta,
  .follow-request-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  .meta-row {
    justify-content: space-between;
  }

  .unread-dot {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: var(--brand);
  }

  .title-text {
    margin: 0;
    color: var(--text-main);
    font-size: 15px;
    font-weight: 700;
    line-height: 1.3;
  }

  .actor-link {
    color: var(--text-main);
    font-weight: 700;
    text-decoration: none;
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
