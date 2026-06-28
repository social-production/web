<script lang="ts">
  import { browser } from '$app/environment';
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import ReportComposerModal from '$lib/components/shared/ReportComposerModal.svelte';
  import ReportMenu from '$lib/components/shared/ReportMenu.svelte';
  import { addComment, setReportVote, submitReport } from '$lib/services/queries/details';
  import type { ContentReportSummary, DetailComment } from '$lib/types/detail';
  import { linkifyMessageBody } from '$lib/utils/linkifyMessageBody';
  import { scrollCenteredInContainer } from '$lib/utils/comment-scroll';
  import { tick } from 'svelte';

  type ChatMessage = {
    id: string;
    authorUsername: string;
    body: string;
    createdAt: string;
    isOwn?: boolean;
    report?: ContentReportSummary | null;
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

  type ReportReason = 'spam' | 'serious-harm';

  let draftMessage = '';
  let panelElement: HTMLElement | null = null;
  let chatLogElement: HTMLDivElement | null = null;
  let messageElements = new Map<string, HTMLElement>();
  let hasAutoScrolled = false;
  let lastHighlightedCommentId: string | null = null;
  let lastAutoScrollKey = '';
  let registeredMessageVersion = 0;
  let reportTargetMessage: ChatMessage | null = null;
  let reportReason: ReportReason = 'spam';
  let reportDetails = '';
  let reportPending = false;
  let revealedMessageIds = new Set<string>();

  function formatMessageTime(value: string) {
    const date = new Date(value);
    const deltaMs = Date.now() - date.getTime();

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    const minutes = Math.max(Math.round(deltaMs / 60000), 1);

    if (minutes < 60) {
      return `${minutes}m`;
    }

    const hours = Math.round(minutes / 60);

    if (hours < 24) {
      return `${hours}h`;
    }

    const days = Math.round(hours / 24);

    if (days < 7) {
      return `${days}d`;
    }

    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const year = `${date.getFullYear()}`;

    return `${month}/${day}/${year}`;
  }

  function openReportComposer(message: ChatMessage) {
    reportTargetMessage = message;
    reportReason = 'spam';
    reportDetails = '';
  }

  function closeReportComposer() {
    reportTargetMessage = null;
    reportReason = 'spam';
    reportDetails = '';
  }

  function supportsHiddenToggle(message: ChatMessage) {
    return message.report?.reason === 'serious-harm' || message.report?.resolution === 'hidden';
  }

  function messageBodyIsHidden(message: ChatMessage) {
    return supportsHiddenToggle(message) && !revealedMessageIds.has(message.id);
  }

  function revealMessageBody(messageId: string) {
    const nextIds = new Set(revealedMessageIds);

    if (nextIds.has(messageId)) {
      nextIds.delete(messageId);
    } else {
      nextIds.add(messageId);
    }

    revealedMessageIds = nextIds;
  }

  async function submitActiveReport() {
    if (!subjectId || !reportTargetMessage) {
      return;
    }

    reportPending = true;

    try {
      await submitReport(subjectId, reportTargetMessage.id, reportReason, reportDetails);
      closeReportComposer();
      await invalidateAll();
    } finally {
      reportPending = false;
    }
  }

  async function voteOnActiveReport(reportId: string, vote: 'yes' | 'no') {
    if (!reportId) {
      return;
    }

    reportPending = true;

    try {
      await setReportVote(reportId, vote);
      await invalidateAll();
    } finally {
      reportPending = false;
    }
  }

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

  async function scrollToHighlightedMessage() {
    if (!browser || !highlightedCommentId || hasAutoScrolled) {
      return;
    }

    hasAutoScrolled = true;
    await scrollCenteredInContainer(
      () => chatLogElement,
      () => messageElements.get(highlightedCommentId) ?? null
    );
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
        createdAt: item.createdAt,
        report: item.report ?? null
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
    void visibleMessages.length;
    void registeredMessageVersion;
    void scrollToHighlightedMessage();
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
    registeredMessageVersion += 1;

    if (browser && highlightedCommentId === messageId && !hasAutoScrolled) {
      void scrollToHighlightedMessage();
    }

    return {
      update(nextMessageId: string) {
        if (nextMessageId === messageId) {
          return;
        }

        messageElements.delete(messageId);
        messageId = nextMessageId;
        messageElements.set(messageId, node);
        registeredMessageVersion += 1;

        if (browser && highlightedCommentId === messageId && !hasAutoScrolled) {
          void scrollToHighlightedMessage();
        }
      },
      destroy() {
        messageElements.delete(messageId);
        registeredMessageVersion += 1;
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
              <div class="message-top-row">
                {#if message.showAuthor ?? true}
                  <a class="author-link" href={`/profile/${message.authorUsername}`}>{message.authorUsername}</a>
                {/if}
                {#if subjectId && variant !== 'message'}
                  <div class="message-actions" aria-label="Message actions">
                    <ReportMenu
                      blockedMessage={viewerUsername === message.authorUsername ? "You can't report yourself" : ''}
                      itemLabel="comment"
                      pending={reportPending}
                      report={message.report ?? null}
                      on:compose={() => openReportComposer(message)}
                      on:vote={(event) => voteOnActiveReport(message.report?.id ?? '', event.detail.vote)}
                    />
                  </div>
                {/if}
              </div>
              {#if supportsHiddenToggle(message)}
                <button
                  aria-expanded={revealedMessageIds.has(message.id)}
                  class="hidden-toggle"
                  type="button"
                  on:click={() => revealMessageBody(message.id)}
                >
                  <span class="hidden-plus">{revealedMessageIds.has(message.id) ? '−' : '+'}</span>
                  <span>{revealedMessageIds.has(message.id) ? 'Hide' : 'Hidden'}</span>
                </button>
              {/if}

              <p class:hidden-message-body={supportsHiddenToggle(message) && messageBodyIsHidden(message)}>
                {#if variant === 'message'}
                  {@html linkifyMessageBody(message.body)}
                {:else}
                  {message.body}
                {/if}
              </p>
            </div>
            <span class="message-time">{formatMessageTime(message.createdAt)}</span>
          </article>
        {/each}
      {/if}
    </div>
  </div>

  <ReportComposerModal
    bind:description={reportDetails}
    bind:reason={reportReason}
    itemLabel={variant === 'message' ? 'message' : 'comment'}
    open={!!reportTargetMessage}
    pending={reportPending}
    on:close={closeReportComposer}
    on:submit={submitActiveReport}
  />

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
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: end;
    padding: 0;
    border: none;
    border-radius: 0;
    scroll-margin-top: 84px;
    transition: background 140ms ease, box-shadow 140ms ease;
  }

  .message-copy {
    gap: 6px;
    width: fit-content;
    max-width: min(calc(100% - 4.75rem), 52rem);
    justify-self: start;
    padding: 7px 11px 8px;
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
    box-shadow: inset -2px 0 0 var(--brand);
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
    margin: 0;
    color: var(--text-main);
    white-space: pre-wrap;
  }

  .message-copy p :global(a) {
    color: var(--brand-strong);
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .message-copy p :global(a:hover) {
    color: var(--brand);
  }

  .hidden-message-body {
    display: none;
  }

  .message-top-row,
  .message-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .message-top-row {
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
  }

  .message-actions {
    margin-left: auto;
    justify-content: flex-end;
    flex-shrink: 0;
  }

  .composer-card {
    border-top: 1px solid var(--panel-border);
  }

  .message-time {
    align-self: end;
    justify-self: end;
    width: 10.75ch;
    min-width: 10.75ch;
    color: var(--text-soft);
    font-size: 11px;
    line-height: 1.2;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    padding-bottom: 2px;
    text-align: right;
  }

  .hidden-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--text-soft);
    font-size: 13px;
    font-weight: 700;
  }

  .hidden-plus {
    display: inline-grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border: 1px solid var(--panel-border);
    border-radius: 50%;
    font-size: 16px;
    line-height: 1;
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