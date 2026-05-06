<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import NotificationCard from '$lib/components/cards/inbox/NotificationCard.svelte';
  import { markAllNotificationsRead, markNotificationRead } from '$lib/services/queries/inbox';
  import type { NotificationsPageData } from '$lib/types/inbox';

  export let data: NotificationsPageData;

  async function readNotification(notificationId: string) {
    await markNotificationRead(notificationId);
    await invalidateAll();
  }

  async function readAll() {
    await markAllNotificationsRead();
    await invalidateAll();
  }
</script>

<section class="page">
  <section class="hero-card">
    <div class="hero-topline">
      <div>
        <h1>Notifications</h1>
        <p>Project activity and event invites now come from the shared mock state instead of page-local placeholders.</p>
      </div>

      <button class="secondary-button" type="button" on:click={readAll}>Mark all read</button>
    </div>
  </section>

  <div class="stack">
    {#each data.items as item}
      <NotificationCard item={item} on:read={() => readNotification(item.id)} />
    {/each}
  </div>
</section>

<style>
  .page,
  .stack {
    display: grid;
    gap: 12px;
  }

  .hero-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .hero-topline {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }

  h1 {
    font-size: 22px;
    letter-spacing: -0.02em;
    color: var(--brand-strong);
  }

  p {
    color: var(--text-soft);
    line-height: 1.45;
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