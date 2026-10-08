<script lang="ts">
  import { apiAssetUrl } from '$lib/api/drivers/fastapi/client';
  import { createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import ReportComposerModal from '$lib/components/shared/ReportComposerModal.svelte';
  import { portal } from '$lib/utils/portal';
  import { addComment, setReportVote, submitReport } from '$lib/services/commands/shared';
  import type { ContentReportSummary, DetailComment, ModerationState } from '$lib/types/detail';
  import type { CommentSubjectType, ReportTargetType } from '$lib/types/governance';
  import { linkifyMessageBody } from '$lib/utils/linkifyMessageBody';
  import { moderatedPlaceholder, shouldHideModeratedBody } from '$lib/utils/moderation';
  import { invalidateAfterReport } from '$lib/utils/reportInvalidation';
  import { scrollCenteredInContainer } from '$lib/utils/comment-scroll';
  import { requireViewer } from '$lib/utils/requireViewer';
  import PhotoViewer from '$lib/components/shared/PhotoViewer.svelte';
  import type { MessageAttachment } from '$lib/types/inbox';
  import { compressChatPhoto, rejectOutgoingAttachment } from '$lib/features/messages/attachmentLimits';
  import { onMount, tick } from 'svelte';

  type ChatMessage = {
    id: string;
    authorUsername: string;
    body: string;
    createdAt: string;
    isOwn?: boolean;
    report?: ContentReportSummary | null;
    moderationState?: ModerationState;
    showAuthor?: boolean;
    attachments?: MessageAttachment[];
    pinned?: boolean;
    editedAt?: string | null;
    replyAuthor?: string | null;
    replyPreview?: string | null;
  };

  export let comments: DetailComment[] = [];
  export let messages: ChatMessage[] = [];
  export let subjectId = '';
  export let subjectType: CommentSubjectType | undefined = undefined;
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
  export let reportTargetType: ReportTargetType | undefined = undefined;
  export let onSubmitMessage:
    | ((
        body: string,
        files?: File[],
        options?: { replyToId?: string | null }
      ) => Promise<void> | void)
    | null = null;
  export let onEditMessage: ((messageId: string, body: string) => Promise<void> | void) | null = null;
  export let onDeleteMessage: ((messageId: string) => Promise<void> | void) | null = null;
  export let conversationActions = false;
  export let onModerated: (() => Promise<void> | void) | null = null;
  export let allowAttachments = false;
  export let onTogglePin: ((messageId: string, pinned: boolean) => Promise<void> | void) | null = null;

  const dispatch = createEventDispatcher<{ moderated: void }>();

  type ReportReason = 'spam' | 'serious-harm';

  let draftMessage = '';
  let panelElement: HTMLElement | null = null;
  let chatLogElement: HTMLDivElement | null = null;
  let messageElements = new Map<string, HTMLElement>();
  let hasAutoScrolled = false;
  let lastHighlightedCommentId: string | null = null;
  let registeredMessageVersion = 0;
  let reportTargetMessage: ChatMessage | null = null;
  let reportReason: ReportReason = 'spam';
  let reportDetails = '';
  let reportPending = false;
  let revealedMessageIds = new Set<string>();
  let submitPending = false;
  let lastScrollSubjectKey = '';
  let lastAutoScrollKey = '';
  let keyboardOpen = false;
  let pendingAttachments: Array<{ id: string; file: File; previewUrl: string }> = [];
  let attachmentError = '';
  let photoInput: HTMLInputElement | null = null;
  let fileInput: HTMLInputElement | null = null;
  let messageMenu: { message: ChatMessage; x: number; y: number } | null = null;
  let replyTarget: ChatMessage | null = null;
  let editingMessage: ChatMessage | null = null;
  const maxPendingAttachments = 10;

  function closeMessageMenu() {
    messageMenu = null;
  }

  function onMessageMenuOutside(event: PointerEvent) {
    const target = event.target;
    if (target instanceof Element && target.closest('.bubble-menu')) {
      return;
    }
    closeMessageMenu();
  }

  async function openMessageMenu(message: ChatMessage, event: MouseEvent) {
    const target = event.target;
    if (target instanceof Element && target.closest('a, button, input, textarea, label')) {
      return;
    }

    messageMenu = {
      message,
      x: Math.min(event.clientX, window.innerWidth - 196),
      y: Math.min(event.clientY, window.innerHeight - 280)
    };
    await tick();
    window.addEventListener('pointerdown', onMessageMenuOutside, { once: true });
  }

  function beginReply(message: ChatMessage) {
    editingMessage = null;
    replyTarget = message;
    closeMessageMenu();
  }

  function beginEdit(message: ChatMessage) {
    replyTarget = null;
    editingMessage = message;
    draftMessage = message.body;
    closeMessageMenu();
  }

  function clearComposerContext() {
    replyTarget = null;
    editingMessage = null;
  }

  async function copyMessage(message: ChatMessage) {
    closeMessageMenu();
    try {
      await navigator.clipboard.writeText(message.body);
    } catch {
      attachmentError = 'Could not copy that message';
    }
  }

  async function runMessagePin(message: ChatMessage) {
    closeMessageMenu();
    await onTogglePin?.(message.id, Boolean(message.pinned));
  }

  async function runMessageDelete(message: ChatMessage) {
    closeMessageMenu();
    if (!onDeleteMessage) {
      return;
    }
    await onDeleteMessage(message.id);
  }

  function reportFromMenu(message: ChatMessage) {
    closeMessageMenu();
    if (viewerUsername === message.authorUsername) {
      return;
    }
    openReportComposer(message);
  }

  function formatByteSize(bytes: number) {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function releasePendingAttachment(id?: string) {
    const dropping = id
      ? pendingAttachments.filter((item) => item.id === id)
      : pendingAttachments;

    for (const item of dropping) {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    }

    pendingAttachments = id ? pendingAttachments.filter((item) => item.id !== id) : [];
  }

  function rememberAttachment(file: File, previewUrl = '') {
    if (pendingAttachments.length >= maxPendingAttachments) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      attachmentError = `You can attach up to ${maxPendingAttachments} files`;
      return;
    }

    pendingAttachments = [
      ...pendingAttachments,
      {
        id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl
      }
    ];
    attachmentError = '';
  }

  async function choosePhoto(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const files = [...(input.files ?? [])];
    input.value = '';

    for (const file of files) {
      const rejection = rejectOutgoingAttachment(file);

      if (rejection) {
        attachmentError = rejection;
        continue;
      }

      try {
        const compressed = await compressChatPhoto(file);
        rememberAttachment(compressed, URL.createObjectURL(compressed));
      } catch (err) {
        attachmentError = err instanceof Error ? err.message : 'Could not process image.';
      }
    }
  }

  function chooseFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const files = [...(input.files ?? [])];
    input.value = '';

    for (const file of files) {
      const rejection = rejectOutgoingAttachment(file);

      if (rejection) {
        attachmentError = rejection;
        continue;
      }

      rememberAttachment(file);
    }
  }

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

  function isModeratedAway(message: ChatMessage) {
    return shouldHideModeratedBody({
      body: message.body,
      report: message.report,
      moderationState: message.moderationState
    });
  }

  function messageDisplayBody(message: ChatMessage) {
    if (isModeratedAway(message)) {
      return moderatedPlaceholder(message.report, message.body);
    }

    return message.body;
  }

  function supportsHiddenToggle(message: ChatMessage) {
    return (
      !isModeratedAway(message) &&
      (message.report?.reason === 'serious-harm' ||
        message.report?.resolution === 'hidden' ||
        message.moderationState === 'hidden')
    );
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
    const targetType =
      reportTargetType ?? (messages.length > 0 || comments.length === 0 ? 'message' : 'comment');

    try {
      await submitReport(
        subjectId,
        { id: reportTargetMessage.id, type: targetType },
        reportReason,
        reportDetails
      );
      closeReportComposer();
      await invalidateAfterReport($page.url.pathname);
      dispatch('moderated');
      await onModerated?.();
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
      await invalidateAfterReport($page.url.pathname);
      dispatch('moderated');
      await onModerated?.();
    } finally {
      reportPending = false;
    }
  }

  let viewerPhoto: { url: string; filename: string } | null = null;
  let viewerReturnFocus: HTMLElement | null = null;

  function scrollChatLogToBottom() {
    const log = chatLogElement;
    if (!log) {
      return;
    }
    const apply = () => {
      log.scrollTop = log.scrollHeight;
    };
    apply();
    requestAnimationFrame(apply);
  }

  function watchChatMedia(node: HTMLElement) {
    const onLoad = (event: Event) => {
      if (event.target instanceof HTMLImageElement) {
        scrollChatLogToBottom();
      }
    };
    node.addEventListener('load', onLoad, true);
    return {
      destroy() {
        node.removeEventListener('load', onLoad, true);
      }
    };
  }

  function openPhotoViewer(url: string, filename: string, event: MouseEvent) {
    viewerReturnFocus = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
    viewerPhoto = { url, filename };
  }

  function closePhotoViewer() {
    viewerPhoto = null;
    viewerReturnFocus?.focus();
    viewerReturnFocus = null;
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

  function clearPinnedPanelStyles() {
    if (!panelElement) {
      return;
    }
    panelElement.style.position = '';
    panelElement.style.left = '';
    panelElement.style.right = '';
    panelElement.style.top = '';
    panelElement.style.bottom = '';
    panelElement.style.height = '';
    panelElement.style.maxHeight = '';
    panelElement.style.zIndex = '';
  }

  function syncPanelHeight() {
    if (!browser || !panelElement) {
      return;
    }

    const vv = window.visualViewport;
    const viewportHeight = vv?.height ?? window.innerHeight;
    const viewportOffsetTop = vv?.offsetTop ?? 0;
    keyboardOpen = Boolean(
      vv &&
        window.innerHeight - vv.height > 120 &&
        (document.activeElement instanceof HTMLTextAreaElement ||
          document.activeElement instanceof HTMLInputElement ||
          (document.activeElement instanceof HTMLElement && document.activeElement.isContentEditable))
    );

    if (embedded) {
      // MessagesPage pins the shell above the keyboard; keep the panel filling it.
      clearPinnedPanelStyles();
      return;
    }

    if (fitViewport) {
      if (keyboardOpen) {
        const topbarPx =
          document.querySelector<HTMLElement>('.topbar')?.getBoundingClientRect().height ?? 0;
        const top = Math.max(viewportOffsetTop + topbarPx, viewportOffsetTop);
        const bottomGap = Math.max(0, window.innerHeight - viewportOffsetTop - viewportHeight);
        panelElement.style.position = 'fixed';
        panelElement.style.left = '0';
        panelElement.style.right = '0';
        panelElement.style.top = `${Math.floor(top)}px`;
        panelElement.style.bottom = `${Math.floor(bottomGap)}px`;
        panelElement.style.height = 'auto';
        panelElement.style.maxHeight = 'none';
        panelElement.style.zIndex = '40';
        panelElement.style.setProperty(
          '--chat-panel-height',
          `${Math.floor(Math.max(viewportHeight - topbarPx, 240))}px`
        );
        return;
      }

      clearPinnedPanelStyles();
    }

    if (!fitViewport) {
      panelElement.style.removeProperty('--chat-panel-height');
      return;
    }

    const topOffset = Math.max(panelElement.getBoundingClientRect().top, visibleTopOffset());
    const nextHeight = Math.max(viewportHeight - topOffset, 320);
    panelElement.style.setProperty('--chat-panel-height', `${Math.floor(nextHeight)}px`);
  }

  function flattenComments(items: DetailComment[]): ChatMessage[] {
    const flattened: ChatMessage[] = [];

    for (const item of items) {
      flattened.push({
        id: item.id,
        authorUsername: item.authorUsername,
        body: item.body,
        createdAt: item.createdAt,
        report: item.report ?? null,
        moderationState: item.moderationState,
        attachments: item.attachments?.map((attachment) => ({
          ...attachment,
          url: attachment.url || apiAssetUrl(`/governance/attachments/${attachment.id}`)
        }))
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
  $: viewerSignedIn = Boolean($page.data.bootstrap?.viewer);

  $: scrollSubjectKey = `${subjectId || title}`;
  $: autoScrollKey = highlightedCommentId
    ? ''
    : `${scrollSubjectKey}:${visibleMessages.length}`;

  $: if (browser && autoScrollKey && autoScrollKey !== lastAutoScrollKey) {
    lastAutoScrollKey = autoScrollKey;
    tick().then(() => {
      scrollChatLogToBottom();
    });
  }

  $: if (scrollSubjectKey !== lastScrollSubjectKey) {
    lastScrollSubjectKey = scrollSubjectKey;
    lastAutoScrollKey = '';
  }

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

  $: if (browser && panelElement && fitViewport && !embedded) {
    tick().then(() => {
      syncPanelHeight();
    });
  }

  function promptChatSignIn() {
    requireViewer($page.data.bootstrap?.viewer, 'Sign in to send a message.');
  }

  async function submitMessage() {
    if (!viewerSignedIn) {
      promptChatSignIn();
      return;
    }
    const body = draftMessage.trim();
    const files = pendingAttachments.map((item) => item.file);

    if ((!body && files.length === 0) || submitPending) {
      return;
    }

    draftMessage = '';
    submitPending = true;

    try {
      if (editingMessage && onEditMessage) {
        if (!body) {
          draftMessage = body;
          return;
        }
        await onEditMessage(editingMessage.id, body);
        editingMessage = null;
      } else if (onSubmitMessage) {
        await onSubmitMessage(body, files.length ? files : undefined, {
          replyToId: replyTarget?.id ?? null
        });
        replyTarget = null;
      } else if (subjectId && subjectType) {
        await addComment({ id: subjectId, type: subjectType }, body);
        await invalidateAll();
      } else {
        draftMessage = body;
        return;
      }

      releasePendingAttachment();
      attachmentError = '';

      if (highlightedCommentId) {
        await clearHighlightedCommentTarget();
        await tick();
      }

      await tick();
      scrollChatLogToBottom();
      window.setTimeout(scrollChatLogToBottom, 180);
      window.setTimeout(scrollChatLogToBottom, 600);
    } catch (err) {
      draftMessage = body;

      if (err instanceof Error && err.message) {
        attachmentError = err.message;
      }
    } finally {
      submitPending = false;
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

  onMount(() => {
    const viewport = window.visualViewport;
    const onViewportChange = () => syncPanelHeight();
    viewport?.addEventListener('resize', onViewportChange);
    viewport?.addEventListener('scroll', onViewportChange);
    syncPanelHeight();
    return () => {
      viewport?.removeEventListener('resize', onViewportChange);
      viewport?.removeEventListener('scroll', onViewportChange);
    };
  });
</script>

<svelte:window on:resize={syncPanelHeight} />

<section
  bind:this={panelElement}
  class:embedded
  class:fit-viewport={fitViewport && !embedded}
  class:headerless={!showHeader}
  class:message-variant={variant === 'message'}
  class:keyboard-open={keyboardOpen}
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

  <div bind:this={chatLogElement} class="chat-log" use:watchChatMedia>
    <div class="chat-log-stack">
      {#if visibleMessages.length === 0}
        <div class="empty-state">{emptyCopy}</div>
      {:else}
        {#each visibleMessages as message (message.id)}
          {@const photos = (message.attachments ?? []).filter((item) => item.kind === 'image' && item.url)}
          {@const files = (message.attachments ?? []).filter((item) => item.kind !== 'image')}
          {@const caption = !messageBodyIsHidden(message) && Boolean(message.body.trim())}
          <article
            id={`comment-${message.id}`}
            class:highlighted={highlightedCommentId === message.id}
            class:own={message.isOwn ?? viewerUsername === message.authorUsername}
            class="chat-message"
            use:registerMessageElement={message.id}
            on:click={(event) => openMessageMenu(message, event)}
          >
            <div
              class="message-copy"
              class:captionless={photos.length > 0 && !caption}
              class:has-caption={photos.length > 0 && caption}
              class:photo-stack={photos.length > 0}
              class:multi-photo={photos.length > 1}
            >
              {#if message.showAuthor ?? true}
                <a class="author-link" href={`/profile/${message.authorUsername}`}>{message.authorUsername}</a>
              {/if}
              {#if message.replyAuthor || message.replyPreview}
                <div class="reply-quote">
                  <strong>{message.replyAuthor || 'Message'}</strong>
                  <span>{message.replyPreview || ''}</span>
                </div>
              {/if}
              {#if supportsHiddenToggle(message)}
                <button
                  aria-expanded={revealedMessageIds.has(message.id)}
                  class="hidden-toggle"
                  type="button"
                  on:click={() => revealMessageBody(message.id)}
                >
                  <span class="hidden-plus">{revealedMessageIds.has(message.id) ? '−' : '+'}</span>
                  <span
                    >{revealedMessageIds.has(message.id)
                      ? 'Hide again'
                      : 'Hidden for serious harm report — reveal to read'}</span
                  >
                </button>
              {/if}

              {#if photos.length > 0}
                <div class="photo-row">
                  {#each photos as photo (photo.id)}
                    <button
                      class="photo-button"
                      type="button"
                      aria-label={`View ${photo.filename}`}
                      on:click={(event) => openPhotoViewer(photo.url ?? '', photo.filename, event)}
                    >
                      <img class="message-photo" alt={photo.filename} src={photo.url} />
                    </button>
                  {/each}
                </div>
              {/if}

              {#if !messageBodyIsHidden(message) && files.length > 0}
                <div class="file-row">
                  {#each files as attachment, fileIndex (attachment.id)}
                    <div class="message-file-bubble">
                      {#if attachment.url}
                        <a class="message-file" href={attachment.url} download={attachment.filename}>
                          <span class="message-file-name">{attachment.filename}</span>
                          <span class="message-file-size">{formatByteSize(attachment.byteSize)}</span>
                        </a>
                      {:else}
                        <span class="message-file-name">{attachment.filename}</span>
                      {/if}
                      {#if !caption && photos.length === 0 && fileIndex === files.length - 1}
                        <span class="message-footer">
                          <span class="message-time">{formatMessageTime(message.createdAt)}</span>
                          {#if message.editedAt}
                            <span class="edited-mark">edited</span>
                          {/if}
                        </span>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}

              {#if caption}
                <div class="caption-block" class:caption-bubble={photos.length > 0 && caption}>
                  {#if !messageBodyIsHidden(message) && caption}
                    <p class:moderated={isModeratedAway(message)}>
                      {#if !isModeratedAway(message)}
                        {@html linkifyMessageBody(messageDisplayBody(message))}
                      {:else}
                        {messageDisplayBody(message)}
                      {/if}
                      {#if photos.length === 0}
                      <span class="message-footer">
                        <span class="message-time">{formatMessageTime(message.createdAt)}</span>
                        {#if message.editedAt}
                          <span class="edited-mark">edited</span>
                        {/if}
                      </span>
                      {/if}
                    </p>
                  {/if}
                </div>
              {/if}

              {#if photos.length > 0 || (!caption && files.length === 0)}
                <div class="message-footer photo-footer">
                  <span class="message-time">{formatMessageTime(message.createdAt)}</span>
                  {#if message.editedAt}
                    <span class="edited-mark">edited</span>
                  {/if}
                </div>
              {/if}
            </div>
          </article>
        {/each}
      {/if}
    </div>
  </div>

  {#if messageMenu}
    {@const menuMessage = messageMenu.message}
    {@const menuOwn = menuMessage.isOwn ?? viewerUsername === menuMessage.authorUsername}
    <div
      class="bubble-menu"
      role="menu"
      style="left: {messageMenu.x}px; top: {messageMenu.y}px"
      use:portal={'body'}
    >
      {#if conversationActions && onSubmitMessage}
        <button type="button" role="menuitem" on:click={() => beginReply(menuMessage)}>Reply</button>
      {/if}
      <button type="button" role="menuitem" on:click={() => copyMessage(menuMessage)}>Copy</button>
      {#if onTogglePin}
        <button type="button" role="menuitem" on:click={() => runMessagePin(menuMessage)}>
          {menuMessage.pinned ? 'Unpin' : 'Pin'}
        </button>
      {/if}
      {#if conversationActions && menuOwn && onEditMessage}
        <button type="button" role="menuitem" on:click={() => beginEdit(menuMessage)}>Edit</button>
      {/if}
      {#if conversationActions && menuOwn && onDeleteMessage}
        <button type="button" role="menuitem" on:click={() => runMessageDelete(menuMessage)}>Delete</button>
      {/if}
      {#if !menuOwn && subjectId}
        <button type="button" role="menuitem" on:click={() => reportFromMenu(menuMessage)}>Report</button>
      {/if}
      {#if menuMessage.report && menuMessage.report.resolution !== 'removed' && menuMessage.report.resolution !== 'dismissed'}
        <button
          type="button"
          role="menuitem"
          on:click={() => {
            void voteOnActiveReport(menuMessage.report?.id ?? '', 'yes');
            closeMessageMenu();
          }}>Vote to remove</button
        >
        <button
          type="button"
          role="menuitem"
          on:click={() => {
            void voteOnActiveReport(menuMessage.report?.id ?? '', 'no');
            closeMessageMenu();
          }}>Vote to keep</button
        >
      {/if}
    </div>
  {/if}

  <PhotoViewer
    url={viewerPhoto?.url ?? null}
    alt={viewerPhoto?.filename ?? 'Photo'}
    on:close={closePhotoViewer}
  />

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
    {#if replyTarget}
      <div class="composer-context">
        <div>
          <strong>Reply to {replyTarget.authorUsername}</strong>
          <p>{replyTarget.body}</p>
        </div>
        <button type="button" on:click={clearComposerContext}>Close</button>
      </div>
    {:else if editingMessage}
      <div class="composer-context">
        <strong>Edit message</strong>
        <button
          type="button"
          on:click={() => {
            clearComposerContext();
            draftMessage = '';
          }}>Close</button
        >
      </div>
    {/if}
    {#if allowAttachments && viewerSignedIn}
      <div class="attach-row">
        <button aria-label="Add a photo" class="attach-button" type="button" on:click={() => photoInput?.click()}>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14">
            <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2" />
            <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
            <path d="M21 16l-5-5-8 8" fill="none" stroke="currentColor" stroke-width="2" />
          </svg>
        </button>
        <button aria-label="Add a file" class="attach-button" type="button" on:click={() => fileInput?.click()}>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14">
            <path
              d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.82-2.83l8.48-8.48"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            />
          </svg>
        </button>
        {#each pendingAttachments as item (item.id)}
          <div class="attach-preview">
            {#if item.previewUrl}
              <img alt="" src={item.previewUrl} />
            {:else}
              <span>{item.file.name}</span>
            {/if}
            <button aria-label="Remove attachment" type="button" on:click={() => releasePendingAttachment(item.id)}>
              Remove
            </button>
          </div>
        {/each}
      </div>
      <input
        bind:this={photoInput}
        accept="image/jpeg,image/png,image/webp"
        aria-hidden="true"
        class="attach-input"
        multiple
        tabindex="-1"
        type="file"
        on:change={choosePhoto}
      />
      <input
        bind:this={fileInput}
        aria-hidden="true"
        class="attach-input"
        multiple
        tabindex="-1"
        type="file"
        on:change={chooseFile}
      />
    {/if}
    {#if attachmentError}
      <p class="attach-error" role="alert">{attachmentError}</p>
    {/if}
    <div class="composer-input-shell">
      <textarea
        bind:value={draftMessage}
        on:focus={syncPanelHeight}
        on:keydown={handleComposerKeydown}
        placeholder={placeholder}
        rows="3"
      ></textarea>
      {#if viewerSignedIn}
        <button class="primary-button" disabled={submitPending} type="button" on:click={submitMessage}
          >{editingMessage ? 'Save' : submitLabel}</button
        >
      {:else}
        <button class="primary-button" type="button" on:click={promptChatSignIn}>Sign in</button>
      {/if}
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
    height: min(780px, max(320px, calc(100dvh - var(--topbar-height, 56px) - 168px)));
    max-height: calc(100dvh - var(--topbar-height, 56px) - 80px);
    min-height: 0;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    overflow: hidden;
    background: var(--panel);
  }

  .chat-panel.embedded {
    height: 100%;
    min-height: 0;
    max-height: 100%;
    border: none;
    border-radius: 0;
  }

  .chat-panel.embedded.fit-viewport {
    height: 100%;
    min-height: 0;
    max-height: 100%;
  }

  .chat-panel.fit-viewport:not(.embedded) {
    height: var(--chat-panel-height, calc(100dvh - 32px));
    min-height: var(--chat-panel-height, 320px);
    max-height: var(--chat-panel-height, calc(100dvh - 32px));
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
    container-type: size;
    container-name: chat-log;
  }

  .chat-log-stack {
    display: grid;
    gap: 4px;
    align-content: end;
    min-height: 100%;
  }

  .chat-message {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
    align-items: end;
    padding: 0;
    border: none;
    border-radius: 0;
    scroll-margin-top: 12px;
    scroll-margin-bottom: 16px;
    cursor: pointer;
    transition: background 140ms ease, box-shadow 140ms ease;
  }

  .reply-quote {
    display: grid;
    gap: 2px;
    margin-bottom: 6px;
    padding: 6px 8px;
    border-left: 3px solid var(--accent, #3d6b4f);
    border-radius: 6px;
    background: color-mix(in srgb, var(--panel, #fff) 70%, transparent);
    max-width: 100%;
    overflow: hidden;
  }

  .reply-quote strong,
  .reply-quote span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .reply-quote span {
    color: var(--muted, #667);
    font-size: 0.85em;
  }

  .edited-mark {
    color: var(--muted, #667);
    font-size: 0.75em;
  }

  .bubble-menu {
    position: fixed;
    z-index: 80;
    display: grid;
    min-width: 148px;
    padding: 6px;
    border: 1px solid var(--panel-border);
    border-radius: 12px;
    background: var(--panel);
    box-shadow: 0 12px 32px rgb(0 0 0 / 18%);
  }

  .bubble-menu button {
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    padding: 8px 10px;
    border-radius: 8px;
    cursor: pointer;
  }

  .bubble-menu button:hover {
    background: color-mix(in srgb, var(--accent, #3d6b4f) 12%, transparent);
  }

  .composer-context {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 10px;
    border-left: 3px solid var(--accent, #3d6b4f);
    border-radius: 8px;
    background: color-mix(in srgb, var(--panel, #fff) 80%, var(--accent, #3d6b4f));
  }

  .composer-context p {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 36ch;
  }

  .composer-context button {
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  .message-copy {
    gap: 6px;
    width: fit-content;
    max-width: min(100%, 52rem);
    justify-self: start;
    padding: 7px 11px 8px;
    border: 1px solid color-mix(in srgb, var(--panel-border) 72%, transparent);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--panel-strong) 84%, white 16%);
  }

  .chat-message.own .message-copy {
    justify-self: end;
    background: var(--chat-bubble-own-bg);
    border-color: var(--chat-bubble-own-border);
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

  h2 {
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
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 800;
    margin-bottom: 0;
  }

  .message-copy p {
    margin: 0;
    color: var(--text-main);
    white-space: pre-wrap;
  }

  .message-copy.photo-stack,
  .chat-message.own .message-copy.photo-stack,
  .chat-message.highlighted .message-copy.photo-stack {
    display: grid;
    justify-items: start;
    width: max-content;
    max-width: min(100%, 240px);
    padding: 0;
    gap: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
  }

  .message-copy.photo-stack.multi-photo {
    max-width: min(100%, 488px);
  }

  .message-copy.photo-stack:has(.file-row) {
    max-width: min(100%, 320px);
  }

  .message-copy.photo-stack.multi-photo:has(.file-row) {
    max-width: min(100%, 488px);
  }

  .chat-message.own .message-copy.photo-stack {
    justify-self: end;
    justify-items: end;
  }

  .message-copy.photo-stack .author-link,
  .chat-message.own .message-copy.photo-stack .author-link {
    justify-self: start;
  }

  .photo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .chat-message.own .photo-row {
    justify-content: flex-end;
  }

  .message-copy.captionless {
    background: transparent;
    border: 0;
    box-shadow: none;
  }

  .photo-button {
    display: block;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: zoom-in;
    line-height: 0;
  }

  .message-photo {
    display: block;
    width: auto;
    max-width: min(240px, 100%);
    height: auto;
    max-height: min(360px, calc(100dvh - 360px));
    max-height: min(360px, calc(100cqh - 28px));
    object-fit: contain;
    border-radius: 12px;
  }

  .message-copy.has-caption .message-photo {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  .caption-block {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .caption-bubble {
    width: 100%;
    max-width: 240px;
    padding: 6px 10px 4px;
    border: 1px solid color-mix(in srgb, var(--panel-border) 72%, transparent);
    border-top: 0;
    border-radius: 0 0 12px 12px;
    background: color-mix(in srgb, var(--panel-strong) 84%, white 16%);
  }

  .chat-message.own .caption-bubble {
    background: var(--chat-bubble-own-bg);
    border-color: var(--chat-bubble-own-border);
  }

  .message-copy.photo-stack:has(.file-row) .caption-bubble {
    max-width: min(100%, 280px);
    margin-top: 4px;
    border-top: 1px solid color-mix(in srgb, var(--panel-border) 72%, transparent);
    border-radius: 12px;
  }

  .file-row {
    display: grid;
    gap: 4px;
    width: max-content;
    max-width: min(100%, 280px);
    margin-top: 4px;
  }

  .message-copy:not(.photo-stack) .file-row {
    margin-top: 0;
  }

  .message-file-bubble {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 6px 8px;
    width: max-content;
    max-width: 100%;
  }

  .message-copy.photo-stack .message-file-bubble {
    padding: 6px 10px;
    border: 1px solid color-mix(in srgb, var(--panel-border) 72%, transparent);
    border-radius: 12px;
    background: color-mix(in srgb, var(--panel-strong) 84%, white 16%);
  }

  .chat-message.own .message-copy.photo-stack .message-file-bubble {
    background: var(--chat-bubble-own-bg);
    border-color: var(--chat-bubble-own-border);
  }

  .message-file {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
    color: var(--text-main);
    font-weight: 700;
    text-decoration: underline;
  }

  .message-file-name {
    color: var(--text-main);
    font-weight: 700;
  }

  .message-file-size {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 600;
  }

  .attach-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 2px;
    min-height: 36px;
    padding: 4px 8px;
    border-bottom: 1px solid var(--panel-border);
  }

  .attach-button {
    display: inline-grid;
    place-items: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--text-soft);
  }

  .attach-preview {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    color: var(--text-main);
    font-size: 13px;
  }

  .attach-preview img {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 8px;
  }

  .attach-preview button {
    border: none;
    background: transparent;
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .attach-input {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .attach-error {
    margin: 0;
    color: var(--danger);
    font-size: 13px;
  }

  .message-copy p.moderated {
    color: var(--text-soft);
    font-style: italic;
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

  .message-footer,
  .message-actions {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .message-footer {
    display: inline-flex;
    justify-content: flex-end;
    width: max-content;
    max-width: 100%;
    margin-left: 8px;
    min-width: 0;
    vertical-align: baseline;
    white-space: nowrap;
  }

  .message-footer.photo-footer {
    display: flex;
    width: 100%;
    justify-content: flex-end;
    margin-top: 4px;
    margin-left: 0;
  }

  .message-actions {
    flex-shrink: 0;
  }

  .message-footer :global(.report-trigger) {
    padding: 0 2px;
    min-height: 0;
  }

  .composer-card {
    position: sticky;
    bottom: 0;
    z-index: 2;
    gap: 0;
    border-top: 1px solid var(--panel-border);
    padding: 0 0 8px;
    background: var(--panel);
  }

  .message-time {
    color: var(--text-soft);
    font-size: 11px;
    line-height: 1.2;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
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
    min-height: 72px;
    padding: 8px 84px 8px 4px;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--text-main);
    resize: none;
  }

  textarea:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--brand) 55%, transparent);
    outline-offset: 2px;
  }

  .composer-input-shell {
    position: relative;
    padding: 0 10px;
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

  @media (max-width: 760px) {
    .chat-panel.keyboard-open .composer-card {
      padding: 8px 12px;
    }

    .chat-panel.keyboard-open textarea {
      min-height: 64px;
      padding: 10px 88px 10px 10px;
    }
  }

  .empty-state {
    color: var(--text-soft);
  }

  @media (max-width: 780px) {
    .chat-panel:not(.embedded) {
      height: min(720px, max(420px, calc(100dvh - 168px)));
    }

    .chat-panel.fit-viewport:not(.embedded) {
      height: var(--chat-panel-height, calc(100dvh - 24px));
      min-height: var(--chat-panel-height, 320px);
      max-height: var(--chat-panel-height, calc(100dvh - 24px));
    }
  }

  @media (max-width: 760px) {
    .message-time {
      font-size: 10px;
    }

    .message-copy {
      max-width: min(100%, 52rem);
    }
  }
</style>