<script lang="ts">
  import { browser } from '$app/environment';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { addComment } from '$lib/services/queries/details';
  import type { DetailComment } from '$lib/types/detail';
  import { tick } from 'svelte';
  import { formatRelativeTime } from '$lib/utils/time';

  type ChatMessage = {
    id: string;
    authorUsername: string;
    body: string;
    createdAt: string;
    depth: number;
  };

  export let comments: DetailComment[] = [];
  export let subjectId: string;
  export let highlightedCommentId: string | null = null;
  export let title = 'Discussion';
  export let description = '';
  export let placeholder = 'Write a message...';
  export let submitLabel = 'Send message';
  export let emptyCopy = 'No chat messages yet.';

  let draftMessage = '';
  let chatLogElement: HTMLDivElement | null = null;
  let messageElements = new Map<string, HTMLElement>();
  let hasAutoScrolled = false;
  let lastAutoScrollKey = '';

  function flattenComments(items: DetailComment[], depth = 0): ChatMessage[] {
    const flattened: ChatMessage[] = [];

    for (const item of items) {
      flattened.push({
        id: item.id,
        authorUsername: item.authorUsername,
        body: item.body,
        createdAt: item.createdAt,
        depth
      });
      flattened.push(...flattenComments(item.replies, depth + 1));
    }

    return flattened;
  }

  $: messages = flattenComments(comments).sort(
    (left, right) => +new Date(left.createdAt) - +new Date(right.createdAt)
  );
  $: viewerUsername = $page.data.bootstrap?.viewer?.username ?? null;

  $: if (!highlightedCommentId) {
    hasAutoScrolled = false;
  }

  $: if (browser && highlightedCommentId && !hasAutoScrolled) {
    const target = messageElements.get(highlightedCommentId);

    if (target) {
      hasAutoScrolled = true;
      tick().then(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }

  $: autoScrollKey = `${subjectId}:${messages.length}`;

  $: if (browser && !highlightedCommentId && autoScrollKey !== lastAutoScrollKey) {
    lastAutoScrollKey = autoScrollKey;
    tick().then(() => {
      chatLogElement?.scrollTo({ top: chatLogElement.scrollHeight, behavior: 'auto' });
    });
  }

  async function submitMessage() {
    if (!draftMessage.trim()) {
      return;
    }

    await addComment(subjectId, draftMessage);
    draftMessage = '';
    await invalidateAll();
  }

  function handleComposerKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
  }

  function registerMessageElement(node: HTMLElement, messageId: string) {
    messageElements.set(messageId, node);

    return {
      update(nextMessageId: string) {
        if (nextMessageId === messageId) {
          return;
        }

        messageElements.delete(messageId);
        messageId = nextMessageId;
        messageElements.set(messageId, node);
      },
      destroy() {
        messageElements.delete(messageId);
      }
    };
  }
</script>

<section class="chat-panel">
  <div class="chat-header">
    <div>
      <h2>{title}</h2>
      {#if description}
        <p>{description}</p>
      {/if}
    </div>
  </div>

  <div bind:this={chatLogElement} class="chat-log">
    {#if messages.length === 0}
      <div class="empty-state">{emptyCopy}</div>
    {:else}
      {#each messages as message}
        <article
          id={`comment-${message.id}`}
          class:highlighted={highlightedCommentId === message.id}
          class:own={viewerUsername === message.authorUsername}
          class="chat-message"
          use:registerMessageElement={message.id}
        >
          <div class="message-copy">
            <a class="author-link" href={`/profile/${message.authorUsername}`}>{message.authorUsername}</a>
            <p>{message.body}</p>
          </div>
          <span class="message-time">{formatRelativeTime(message.createdAt)}</span>
        </article>
      {/each}
    {/if}
  </div>

  <div class="composer-card">
    <div class="composer-input-shell">
      <textarea
        bind:value={draftMessage}
        on:keydown={handleComposerKeydown}
        placeholder={placeholder}
        rows="3"
      ></textarea>
      <button class="primary-button" type="button" on:click={submitMessage}>{submitLabel}</button>
    </div>
  </div>
</section>

<style>
  .chat-panel,
  .message-copy,
  .composer-card,
  .composer-input-shell {
    display: grid;
    gap: 12px;
  }

  .chat-panel {
    grid-template-rows: auto minmax(0, 1fr) auto;
    height: clamp(440px, 64vh, 720px);
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    overflow: hidden;
    background: var(--panel);
  }

  .chat-header {
    display: grid;
    gap: 4px;
    padding: 16px;
    background: var(--panel);
  }

  .chat-log {
    min-height: 0;
    display: grid;
    gap: 6px;
    overflow-y: auto;
    background: var(--panel);
    padding: 12px 16px;
  }

  .chat-message {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: end;
    padding: 6px 0;
    border: none;
    border-radius: 0;
    scroll-margin-top: 84px;
    transition: background 140ms ease, box-shadow 140ms ease;
  }

  .chat-message.highlighted {
    background: var(--brand-soft);
    box-shadow: inset 0 0 0 1px var(--brand);
    padding: 8px 10px;
    border-radius: var(--radius-sm);
  }

  .chat-message.own .message-copy {
    text-align: right;
  }

  h2,
  .author-link {
    color: var(--text-main);
  }

  h2 {
    font-size: 14px;
  }

  p,
  span {
    color: var(--text-soft);
    line-height: 1.5;
  }

  .author-link {
    display: inline-block;
    font-weight: 800;
    margin-bottom: 2px;
  }

  .message-time {
    color: var(--text-soft);
    font-size: 11px;
    line-height: 1.2;
    white-space: nowrap;
  }

  textarea {
    width: 100%;
    min-height: 92px;
    padding: 12px 90px 12px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-main);
    resize: vertical;
  }

  .composer-input-shell {
    position: relative;
  }

  .composer-card {
    padding: 0 16px 16px;
    background: var(--panel);
  }

  .primary-button {
    position: absolute;
    right: 10px;
    bottom: 10px;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    background: var(--brand);
    color: var(--page-bg);
    font-size: 12px;
    font-weight: 700;
  }

  .empty-state {
    color: var(--text-soft);
  }

  @media (max-width: 780px) {
    .chat-panel {
      height: clamp(480px, 72vh, 760px);
    }
  }
</style>