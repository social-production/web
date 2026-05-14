<script lang="ts">
  import { browser } from '$app/environment';
  import { goto, invalidateAll } from '$app/navigation';
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
    isOwn?: boolean;
    showAuthor?: boolean;
  };

  export let comments: DetailComment[] = [];
  export let messages: ChatMessage[] = [];
  export let subjectId = '';
  export let highlightedCommentId: string | null = null;
  export let title = 'Discussion';
  export let description = '';
  export let placeholder = 'Write a message...';
  export let submitLabel = 'Send message';
  export let emptyCopy = 'No chat messages yet.';
  export let showHeader = true;
  export let embedded = false;
  export let fitViewport = false;
  export let variant: 'chat' | 'message' = 'chat';
  export let onSubmitMessage: ((body: string) => Promise<void> | void) | null = null;

  let draftMessage = '';
  let panelElement: HTMLElement | null = null;
  let chatLogElement: HTMLDivElement | null = null;
  let messageElements = new Map<string, HTMLElement>();
  let hasAutoScrolled = false;
  let lastHighlightedCommentId: string | null = null;
  let lastAutoScrollKey = '';

  function scrollChatLogToBottom() {
    chatLogElement?.scrollTo({ top: chatLogElement.scrollHeight, behavior: 'auto' });
  }

  function centerMessageInChatLog(messageId: string) {
    const target = messageElements.get(messageId);

    if (!chatLogElement || !target) {
      return;
    }

    const logBounds = chatLogElement.getBoundingClientRect();
    const targetBounds = target.getBoundingClientRect();
    const targetTop = targetBounds.top - logBounds.top + chatLogElement.scrollTop;
    const nextScrollTop = Math.max(targetTop - chatLogElement.clientHeight / 2 + targetBounds.height / 2, 0);

    chatLogElement.scrollTo({ top: nextScrollTop, behavior: 'smooth' });
  }

  async function clearHighlightedCommentTarget() {
    if (!browser || !highlightedCommentId) {
      return;
    }

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete('comment');

    if (nextUrl.hash.startsWith('#comment-')) {
      nextUrl.hash = '';
    }

    await goto(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`, {
      replaceState: true,
      noScroll: true,
      keepFocus: true
    });
  }

  function visibleTopOffset() {
    const topbarHeight = document.querySelector<HTMLElement>('.topbar')?.getBoundingClientRect().height ?? 0;
    return topbarHeight + 12;
  }

  function syncPanelHeight() {
    if (!browser || !panelElement || embedded || !fitViewport) {
      return;
    }

    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const topOffset = Math.max(panelElement.getBoundingClientRect().top, visibleTopOffset());
    const nextHeight = Math.max(viewportHeight - topOffset, 320);
    panelElement.style.setProperty('--chat-panel-height', `${Math.floor(nextHeight)}px`);

    if (!highlightedCommentId) {
      requestAnimationFrame(() => {
        scrollChatLogToBottom();
      });
    }
  }

  function flattenComments(items: DetailComment[]): ChatMessage[] {
    const flattened: ChatMessage[] = [];

    for (const item of items) {
      flattened.push({
        id: item.id,
        authorUsername: item.authorUsername,
        body: item.body,
        createdAt: item.createdAt
      });
      flattened.push(...flattenComments(item.replies));
    }

    return flattened;
  }

  $: flattenedComments = flattenComments(comments).sort(
    (left, right) => +new Date(left.createdAt) - +new Date(right.createdAt)
  );
  $: visibleMessages =
    messages.length > 0
      ? messages.slice().sort((left, right) => +new Date(left.createdAt) - +new Date(right.createdAt))
      : flattenedComments;
  $: viewerUsername = $page.data.bootstrap?.viewer?.username ?? null;

  $: if (highlightedCommentId !== lastHighlightedCommentId) {
    lastHighlightedCommentId = highlightedCommentId;
    hasAutoScrolled = false;
  }

  $: if (!highlightedCommentId) {
    hasAutoScrolled = false;
  }

  $: if (browser && highlightedCommentId && !hasAutoScrolled) {
    const target = messageElements.get(highlightedCommentId);

    if (target) {
      hasAutoScrolled = true;
      tick().then(() => {
        centerMessageInChatLog(highlightedCommentId);
      });
    }
  }

  $: autoScrollKey = `${subjectId || title}:${visibleMessages.length}`;

  $: if (browser && !highlightedCommentId && autoScrollKey !== lastAutoScrollKey) {
    lastAutoScrollKey = autoScrollKey;
    tick().then(() => {
      scrollChatLogToBottom();
    });
  }

  $: if (browser && panelElement && fitViewport && !embedded) {
    tick().then(() => {
      syncPanelHeight();
    });
  }

  async function submitMessage() {
    const body = draftMessage.trim();

    if (!body) {
      return;
    }

    if (onSubmitMessage) {
      await onSubmitMessage(body);
    } else if (subjectId) {
      await addComment(subjectId, body);
    } else {
      return;
    }

    draftMessage = '';
    await invalidateAll();

    if (highlightedCommentId) {
      await clearHighlightedCommentTarget();
      await tick();
      scrollChatLogToBottom();
    }
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

<svelte:window on:resize={syncPanelHeight} />

<section
  bind:this={panelElement}
  class:embedded
  class:fit-viewport={fitViewport && !embedded}
  class:headerless={!showHeader}
  class:message-variant={variant === 'message'}
  class="chat-panel"
>
  {#if showHeader}
    <div class="chat-header">
      <div>
        <h2>{title}</h2>
        {#if description}
          <p>{description}</p>
        {/if}
      </div>
    </div>
  {/if}

  <div bind:this={chatLogElement} class="chat-log">
    <div class="chat-log-stack">
      {#if visibleMessages.length === 0}
        <div class="empty-state">{emptyCopy}</div>
      {:else}
        {#each visibleMessages as message}
          <article
            id={`comment-${message.id}`}
            class:highlighted={highlightedCommentId === message.id}
            class:own={message.isOwn ?? viewerUsername === message.authorUsername}
            class="chat-message"
            use:registerMessageElement={message.id}
          >
            <div class="message-copy">
              {#if message.showAuthor ?? true}
                <a class="author-link" href={`/profile/${message.authorUsername}`}>{message.authorUsername}</a>
              {/if}
              <p>{message.body}</p>
            </div>
            <span class="message-time">{formatRelativeTime(message.createdAt)}</span>
          </article>
        {/each}
      {/if}
    </div>
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
    height: min(780px, max(460px, calc(100dvh - 208px)));
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    overflow: hidden;
    background: var(--panel);
  }

  .chat-panel.embedded {
    height: 100%;
    min-height: 0;
    border: none;
    border-radius: 0;
  }

  .chat-panel.fit-viewport {
    height: var(--chat-panel-height, calc(100dvh - 32px));
    min-height: var(--chat-panel-height, 320px);
  }

  .chat-panel.headerless {
    grid-template-rows: minmax(0, 1fr) auto;
  }

  .chat-header {
    display: grid;
    gap: 4px;
    padding: 16px;
    background: var(--panel);
    border-bottom: 1px solid var(--panel-border);
  }

  .chat-log {
    min-height: 0;
    overflow-y: auto;
    background: var(--panel);
    padding: 16px 16px 10px;
  }

  .chat-log-stack {
    min-height: 100%;
    display: grid;
    gap: 4px;
    align-content: end;
  }

  .chat-message {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 86px;
    gap: 6px;
    align-items: end;
    padding: 0;
    border: none;
    border-radius: 0;
    scroll-margin-top: 84px;
    transition: background 140ms ease, box-shadow 140ms ease;
  }

  .message-copy {
    gap: 2px;
    width: fit-content;
    max-width: min(80%, 52rem);
    justify-self: start;
    padding: 8px 11px;
    border: 1px solid color-mix(in srgb, var(--panel-border) 72%, transparent);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--panel-strong) 84%, white 16%);
  }

  .chat-message.own .message-copy {
    justify-self: end;
    background: color-mix(in srgb, var(--brand-soft) 72%, white 28%);
    border-color: color-mix(in srgb, var(--brand) 52%, var(--panel-border));
  }

  .chat-message.highlighted .message-copy {
    box-shadow: inset 0 0 0 1px var(--brand);
  }

  .chat-message.own .message-copy {
    text-align: right;
  }

  .chat-panel.message-variant .author-link {
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 0;
    text-decoration: none;
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
    font-size: 12px;
    font-weight: 800;
    margin-bottom: 0;
  }

  .message-copy p {
    color: var(--text-main);
  }

  .composer-card {
    border-top: 1px solid var(--panel-border);
  }

  .message-time {
    color: var(--text-soft);
    font-size: 11px;
    line-height: 1.2;
    width: 86px;
    min-width: 86px;
    align-self: end;
    padding-bottom: 8px;
    white-space: nowrap;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  textarea {
    width: 100%;
    min-height: 104px;
    padding: 12px 90px 12px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-main);
    resize: none;
  }

  .composer-input-shell {
    position: relative;
  }

  .composer-card {
    padding: 12px 16px 16px;
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
      height: min(720px, max(420px, calc(100dvh - 168px)));
    }

    .chat-panel.fit-viewport {
      height: var(--chat-panel-height, calc(100dvh - 24px));
      min-height: var(--chat-panel-height, 320px);
    }
  }
</style>