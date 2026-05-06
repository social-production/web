<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import SubjectTablet from '$lib/components/cards/shared/SubjectTablet.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import type { NotificationItem } from '$lib/types/inbox';
  import { formatRelativeTime } from '$lib/utils/time';

  export let item: NotificationItem;

  const dispatch = createEventDispatcher<{ read: void }>();
</script>

<FeedSurface href={item.href} tone={item.surface === 'personal' ? 'personal' : 'public'}>
  <div class:unread={item.isUnread} class="notification-card">
    <div class="topline">
      {#if item.surface === 'personal'}
        <div class="identity-row">
          <div class="kind-row">
            {#if item.isUnread}
              <span class="unread-dot"></span>
            {/if}
            {#if item.actorUsername}
              <a class="actor-link" href={`/profile/${item.actorUsername}`}>{item.actorUsername}</a>
            {/if}
            {#if item.actionLabel}
              <span class="action">- {item.actionLabel}</span>
            {/if}
            <SubjectTablet kind={item.subjectKind} projectMode={item.projectMode ?? 'productive'} />
          </div>
        </div>
      {:else}
        <div class="kind-row">
          {#if item.isUnread}
            <span class="unread-dot"></span>
          {/if}
          <SubjectTablet kind={item.subjectKind} projectMode={item.projectMode ?? 'productive'} />
        </div>
      {/if}

      <div class="tag-stack">
        <TagList tags={item.channelTags} />
        <TagList tags={item.communityTags} />
      </div>
    </div>

    {#if item.title}
      <p class="title-text">{item.title}</p>
    {/if}

    {#if item.body}
      <p class="body">{item.body}</p>
    {/if}

    <div class="footer">
      <span class="time">{formatRelativeTime(item.createdAt)}</span>
      {#if item.isUnread}
        <button class="mark-read" type="button" on:click={() => dispatch('read')}>Mark read</button>
      {/if}
    </div>
  </div>
</FeedSurface>

<style>
  .notification-card,
  .tag-stack {
    display: grid;
    gap: 12px;
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
  .footer {
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

  .identity-row {
    min-width: 0;
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
  }

  @media (max-width: 760px) {
    .notification-card.unread::before {
      left: -12px;
    }

    .tag-stack {
      justify-items: start;
    }
  }
</style>