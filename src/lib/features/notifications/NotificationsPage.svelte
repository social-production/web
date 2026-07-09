<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import NotificationCard from '$lib/components/cards/inbox/NotificationCard.svelte';
  import PageHeader from '$lib/components/shared/PageHeader.svelte';
  import { acceptFollowRequest, rejectFollowRequest } from '$lib/services/queries/account';
  import { markAllNotificationsRead, markNotificationRead } from '$lib/services/queries/inbox';
  import type { NotificationItem, NotificationsPageData } from '$lib/types/inbox';
  import * as m from '$lib/paraglide/messages';

  export let data: NotificationsPageData;

  let followRequestPending = '';

  async function readNotification(notificationId: string) {
    await markNotificationRead(notificationId);
    await invalidateAll();
  }

  async function activateNotification(item: NotificationItem) {
    if (item.isUnread) {
      await markNotificationRead(item.id);
      await invalidateAll();
    }

    const isFollowKind =
      item.kind === 'follow-request' ||
      item.kind === 'new-follower' ||
      item.kind === 'follow-accepted';

    const profileHref = item.actorUsername ? `/profile/${item.actorUsername}` : null;
    const href = isFollowKind && profileHref ? profileHref : item.href?.trim() ?? '';

    if (!href || href === '#') {
      if (profileHref) {
        await goto(profileHref, { noScroll: true });
      }
      return;
    }

    await goto(href, { noScroll: href.includes('comment=') });
  }

  async function handleFollowRequest(username: string, action: 'accept' | 'reject', notificationId: string) {
    followRequestPending = username;

    try {
      if (action === 'accept') {
        await acceptFollowRequest(username);
      } else {
        await rejectFollowRequest(username);
      }
      await markNotificationRead(notificationId);
      await invalidateAll();
    } finally {
      followRequestPending = '';
    }
  }

  async function readAll() {
    await markAllNotificationsRead();
    await invalidateAll();
  }
</script>

<section class="page">
  <PageHeader description={m.notifications_page_intro()} title={m.notifications_page_title()}>
    <svelte:fragment slot="actions">
      <button class="secondary-button" type="button" on:click={readAll}>{m.notifications_mark_all_read()}</button>
    </svelte:fragment>
  </PageHeader>

  <div class="stack">
    {#each data.items as item}
      <NotificationCard
        item={item}
        {followRequestPending}
        onAcceptFollowRequest={(username) => handleFollowRequest(username, 'accept', item.id)}
        onRejectFollowRequest={(username) => handleFollowRequest(username, 'reject', item.id)}
        on:read={() => readNotification(item.id)}
        on:activate={() => activateNotification(item)}
      />
    {/each}
  </div>
</section>

<style>
  .page,
  .stack {
    display: grid;
    gap: 12px;
  }

  .stack {
    gap: 0;
  }

  .secondary-button {
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }
</style>
