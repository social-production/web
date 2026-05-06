<script lang="ts">
  import type { DirectMessage } from '$lib/types/inbox';
  import { formatRelativeTime } from '$lib/utils/time';

  export let message: DirectMessage;
</script>

<div class:own={message.isOwn} class="bubble-row">
  <div class:own={message.isOwn} class="message-bubble">
    <p>{message.body}</p>
    <span>{formatRelativeTime(message.createdAt)}</span>
  </div>
</div>

<style>
  .bubble-row {
    display: flex;
  }

  .bubble-row.own {
    justify-content: flex-end;
  }

  .message-bubble {
    display: grid;
    gap: 8px;
    max-width: min(560px, 86%);
    padding: 12px 14px;
    border: 1px solid var(--panel-border);
    border-radius: 20px 20px 20px 8px;
    background: var(--panel);
    box-shadow: var(--shadow);
  }

  .message-bubble.own {
    border-color: color-mix(in srgb, var(--brand) 35%, var(--panel-border));
    border-radius: 20px 20px 8px 20px;
    background: color-mix(in srgb, var(--brand-soft) 75%, var(--panel));
  }

  p,
  span {
    margin: 0;
    line-height: 1.45;
  }

  span {
    color: var(--text-soft);
    font-size: 11px;
    justify-self: end;
  }
</style>