<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import type { MessageThread } from '$lib/types/inbox';
  import { formatRelativeTime } from '$lib/utils/time';

  export let thread: MessageThread;
  export let active = false;

  const dispatch = createEventDispatcher<{ select: void }>();
</script>

<button class:active class="thread-card" type="button" on:click={() => dispatch('select')}>
  <AvatarBadge size="md" username={thread.participant.username} />

  <div class="thread-copy">
    <div class="thread-topline">
      <strong>{thread.participant.username}</strong>
      <span>{formatRelativeTime(thread.lastMessageAt)}</span>
    </div>

    <p>{thread.preview}</p>
  </div>

  {#if thread.unreadCount > 0}
    <span class="count-badge">{thread.unreadCount}</span>
  {/if}
</button>

<style>
  .thread-card {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 12px;
    align-items: start;
    width: 100%;
    padding: 12px;
    border: 1px solid transparent;
    border-radius: 18px;
    background: transparent;
    text-align: left;
  }

  .thread-card.active {
    background: color-mix(in srgb, var(--brand-soft) 65%, var(--panel));
    border-color: color-mix(in srgb, var(--brand) 45%, var(--panel-border));
  }

  .thread-copy {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  .thread-topline {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: baseline;
  }

  strong {
    font-size: 14px;
  }

  span,
  p {
    color: var(--text-soft);
    line-height: 1.4;
  }

  p {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .count-badge {
    display: inline-grid;
    place-items: center;
    min-width: 24px;
    height: 24px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--brand);
    color: var(--page-bg);
    font-size: 11px;
    font-weight: 800;
  }
</style>