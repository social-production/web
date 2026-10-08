<script lang="ts">
  import { browser } from '$app/environment';
  import { goto, invalidate } from '$app/navigation';
  import { onDestroy, onMount } from 'svelte';
  import { syncChatImmersive } from '$lib/stores/chatChrome';
  import { get } from 'svelte/store';
  import { placeDirectCall } from '$lib/calls/session';
  import LiveChatPanel from '$lib/components/chat/LiveChatPanel.svelte';
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import ComposeMessageSheet from '$lib/components/shared/ComposeMessageSheet.svelte';
  import CountBadge from '$lib/components/shared/CountBadge.svelte';
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import ProjectMembersPanel from '$lib/features/projects/detail/ProjectMembersPanel.svelte';
  import PageHeader from '$lib/components/shared/PageHeader.svelte';
  import { portal } from '$lib/utils/portal';
  import { unreadCounts } from '$lib/stores/unreadCounts';
  import { getProject } from '$lib/services/queries/details';
  import type { ProjectPageData } from '$lib/types/detail';
  import { addComment } from '$lib/services/commands/shared';
  import { registerEntityType, registerCommentIds } from '$lib/services/governanceEntityRegistry';
  import {
    ChatSendError,
    createOptimisticComment,
    mergeDiscussion,
    pruneOptimisticComments,
  } from '$lib/utils/discussionState';
  import {
    getConversationMessages,
    getLinkedChats,
    getMessageContacts,
    getMessages,
    getSubjectComments,
  } from '$lib/services/queries/inbox';
  import {
    addGroupConversationMember,
    markConversationRead,
    markLinkedChatRead,
    deleteMessage,
    editMessage,
    pinMessage,
    removeGroupConversationMember,
    renameGroupConversation,
    sendMessage,
    setConversationListPreferences,
    setLinkedChatListPreferences,
    unpinMessage,
  } from '$lib/services/commands/inbox';
  import type {
    ConversationPin,
    DirectMessage,
    MessageLinkedChat,
    MessagesPageData,
  } from '$lib/types/inbox';
  import type { ViewerSummary } from '$lib/types/bootstrap';
  import type { DetailComment } from '$lib/types/detail';
  import { tick } from 'svelte';
  import { formatRelativeTimeCompact } from '$lib/utils/time';
  import { startVisibilityPoll } from '$lib/utils/visibilityPoll';
  import { isInboxRealtimeEnabled, subscribeToViewerInbox } from '$lib/api/drivers/supabase/realtime';

  export let data: MessagesPageData;
  export let openConversationId: string | null = null;
  export let composeToUsername: string | null = null;

  let activeConversationId: string | null = null;
  let activeLinkedChatId: string | null = null;
  let activeListTab: 'personal' | 'public' = 'personal';
  let linkedChats: MessageLinkedChat[] = data.linkedChats ?? [];
  let linkedChatsLoading = false;
  let linkedChatsHydrated = false;
  let conversations = data.conversations;
  let lastLoaderConversations = data.conversations;
  let showComposer = false;
  let groupMemberDraft = '';
  let composerError = '';
  let conversationLoadError = '';
  let showGroupOptions = false;
  let showAddMembers = false;
  let showRemoveMembers = false;
  let projectMembersData: ProjectPageData | null = null;
  let showProjectMembers = false;
  let projectMembersChatId = '';
  let projectMembersRequest = 0;
  let chatMenu: {
    kind: 'conversation' | 'linked';
    id: string;
    x: number;
    y: number;
    placement: 'list' | 'header';
  } | null = null;
  let suppressRowOpen = false;
  let rowHoldTimer: ReturnType<typeof setTimeout> | null = null;
  let rowHoldOrigin = { x: 0, y: 0 };
  let renameDraft = '';
  let groupSettingsFeedback = '';
  let groupSettingsTone: 'success' | 'warning' = 'success';
  let titleSyncKey = '';
  let messagesShellElement: HTMLElement | null = null;
  let linkedChatComments: DetailComment[] = [];
  let linkedChatCommentsLoading = false;
  let linkedChatOptimisticComments: DetailComment[] = [];
  let linkedChatDiscussion: DetailComment[] = [];
  let conversationMessagesById: Record<string, DirectMessage[]> = {};
  let pinsByConversationId: Record<string, ConversationPin[]> = {};
  let canPinByConversationId: Record<string, boolean> = {};
  let highlightedMessageId: string | null = null;
  let pinError = '';
  const fastapiMessaging =
    (import.meta.env.VITE_BACKEND ?? '').trim().toLowerCase() === 'fastapi';
  let messagesLoadingById: Record<string, boolean> = {};
  let contactSuggestions: ViewerSummary[] = [];
  let contactSearchKey = '';
  let contactSearchRequestId = 0;

  const THREAD_POLL_MS = 5_000;
  const INBOX_REFRESH_MS = 8_000;
  const INBOX_FOCUS_REFRESH_COOLDOWN_MS = 3_000;

  let lastKnownUnreadMessages = 0;
  let lastInboxRefreshAt = 0;
  let inboxRefreshInFlight: Promise<void> | null = null;
  let shellHeightFrame: number | null = null;
  let cachedBottomNavPx = 0;
  let cachedBottomNavOffsetRaw = '';
  let cachedTopbarPx = 0;

  $: linkedChatDiscussion = mergeDiscussion(linkedChatComments, linkedChatOptimisticComments);
  $: if (data.conversations !== lastLoaderConversations) {
    lastLoaderConversations = data.conversations;
    conversations = data.conversations;
  }
  $: if (data.linkedChats?.length) {
    linkedChats = data.linkedChats;
    linkedChatsHydrated = true;
  }
  $: activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) ?? null;
  let chatHold = 0;
  $: chatHold = syncChatImmersive(Boolean(activeConversation || activeLinkedChat), chatHold);
  onDestroy(() => {
    chatHold = syncChatImmersive(false, chatHold);
    if (rowHoldTimer) {
      clearTimeout(rowHoldTimer);
    }
  });
  $: activeLinkedChat = linkedChats.find((chat) => chat.id === activeLinkedChatId) ?? null;
  function byPinnedThenRecent<T extends { pinned?: boolean; lastMessageAt: string }>(items: T[]) {
    return [...items].sort((left, right) => {
      const pinDelta = Number(Boolean(right.pinned)) - Number(Boolean(left.pinned));
      if (pinDelta !== 0) {
        return pinDelta;
      }
      return Date.parse(right.lastMessageAt) - Date.parse(left.lastMessageAt);
    });
  }
  $: personalChats = byPinnedThenRecent(conversations);
  $: publicChats = byPinnedThenRecent(linkedChats);
  $: personalUnreadTotal = conversations.reduce(
    (sum, conversation) => sum + conversation.unreadCount,
    0
  );
  $: publicUnreadTotal = linkedChats.reduce((sum, chat) => sum + chat.unreadCount, 0);
  $: activeConversationMessagesLoading = activeConversationId
    ? (messagesLoadingById[activeConversationId] ?? false)
    : false;
  $: activePins = activeConversationId ? (pinsByConversationId[activeConversationId] ?? []) : [];
  $: canPinActiveConversation = activeConversationId
    ? Boolean(canPinByConversationId[activeConversationId])
    : false;
  $: activeConversationMessages = activeConversationId
    ? (conversationMessagesById[activeConversationId] ?? []).map((message) => ({
        id: message.id,
        authorUsername: message.sender.username,
        body: message.body,
        createdAt: message.createdAt,
        isOwn: message.isOwn,
        report: message.report ?? null,
        moderationState: message.moderationState,
        showAuthor: !message.isOwn,
        attachments: message.attachments ?? [],
        pinned: activePins.some((pin) => pin.messageId === message.id),
        editedAt: message.editedAt ?? null,
        replyAuthor: message.replyAuthor ?? null,
        replyPreview: message.replyPreview ?? null,
      }))
    : [];
  $: directConversationPartner =
    activeConversation?.kind === 'direct'
      ? (activeConversation.participants.find((participant) => participant.id !== data.viewer.id) ??
        activeConversation.participants[0] ??
        null)
      : null;
  $: activeDirectAvatarImageUrl = directConversationPartner?.profileImageUrl ?? null;
  $: normalizedGroupQuery = groupMemberDraft.trim().toLowerCase();
  $: if (browser && showAddMembers) {
    void updateContactSuggestions(groupMemberDraft);
  }
  $: addableGroupMembers =
    activeConversation?.kind === 'group'
      ? contactSuggestions.filter(
          (contact) =>
            contact.id !== data.viewer.id &&
            !activeConversation.participants.some((participant) => participant.id === contact.id) &&
            (normalizedGroupQuery
              ? contact.username.toLowerCase().includes(normalizedGroupQuery)
              : true)
        )
      : [];
  $: removableGroupMembers =
    activeConversation?.kind === 'group'
      ? activeConversation.participants.filter((participant) => participant.id !== data.viewer.id)
      : [];

  $: if (activeConversation?.kind === 'group') {
    const nextKey = `${activeConversation.id}:${activeConversation.title}`;

    if (nextKey !== titleSyncKey) {
      renameDraft = activeConversation.title;
      titleSyncKey = nextKey;
    }
  } else if (titleSyncKey) {
    titleSyncKey = '';
    renameDraft = '';
    showGroupOptions = false;
    showAddMembers = false;
    showRemoveMembers = false;
    groupMemberDraft = '';
    groupSettingsFeedback = '';
  }

  function linkedChatAuthorUsername(authorUsername: string, authorId: string | null) {
    if (authorUsername) {
      return authorUsername;
    }

    if (authorId === data.viewer.id) {
      return data.viewer.username;
    }

    return 'unknown';
  }

  function remapLinkedChatAuthor(comment: DetailComment): DetailComment {
    registerEntityType(comment.id, 'comment');
    return {
      ...comment,
      authorUsername: linkedChatAuthorUsername(comment.authorUsername, null),
      replies: (comment.replies ?? []).map(remapLinkedChatAuthor),
    };
  }

  function linkedChatEntityType(kind: MessageLinkedChat['kind']) {
    if (kind === 'event') {
      return 'event';
    }

    if (kind === 'help_request') {
      return 'help_request';
    }

    return 'project';
  }

  function memberCountLabel(count: number) {
    return `${count} ${count === 1 ? 'member' : 'members'}`;
  }

  async function openProjectMembers(chat: MessageLinkedChat) {
    if (showProjectMembers && projectMembersChatId === chat.id) {
      showProjectMembers = false;
      return;
    }

    const slug = chat.href.split('/').filter(Boolean).pop();
    if (!slug) {
      return;
    }

    const request = ++projectMembersRequest;
    projectMembersChatId = chat.id;
    const project = await getProject(slug);
    if (request !== projectMembersRequest || !project) {
      return;
    }

    projectMembersData = project;
    showProjectMembers = true;
  }

  function linkedChatMeta(chat: MessageLinkedChat) {
    if (chat.kind === 'help_request') {
      return `Help request chat · ${chat.meta}`;
    }

    return `${chat.kind === 'project' ? 'Project chat' : 'Event chat'} · ${chat.meta}`;
  }

  function linkedChatEmptyCopy(chat: MessageLinkedChat) {
    if (chat.kind === 'help_request') {
      return 'No help request chat yet.';
    }

    return chat.kind === 'project' ? 'No project chat yet.' : 'No event chat yet.';
  }

  function linkedChatPlaceholder(chat: MessageLinkedChat) {
    if (chat.kind === 'help_request') {
      return 'Write a message...';
    }

    return chat.kind === 'project' ? 'Message the project...' : 'Message members...';
  }

  async function updateContactSuggestions(query: string) {
    const normalized = query.trim();
    const lookupKey = `add:${normalized}`;

    if (lookupKey === contactSearchKey) {
      return;
    }

    contactSearchKey = lookupKey;

    if (!normalized) {
      contactSuggestions =
        activeConversation?.participants.filter(
          (participant) => participant.id !== data.viewer.id
        ) ?? [];
      return;
    }

    const requestId = ++contactSearchRequestId;

    try {
      const results = await getMessageContacts(normalized, 8);

      if (requestId !== contactSearchRequestId) {
        return;
      }

      contactSuggestions = results;
    } catch {
      if (requestId === contactSearchRequestId) {
        contactSuggestions = [];
      }
    }
  }

  function tabAriaLabel(label: string, unreadTotal: number) {
    return unreadTotal > 0 ? `${label}, ${unreadTotal} unread` : label;
  }

  async function hydrateLinkedChats(options: { force?: boolean } = {}) {
    if (!browser) return;
    if (options.force && document.visibilityState !== 'visible') return;
    if (linkedChatsLoading) return;
    if (linkedChatsHydrated && !options.force) return;

    linkedChatsLoading = true;
    try {
      linkedChats = await getLinkedChats();
      linkedChatsHydrated = true;
    } catch {
      if (!linkedChatsHydrated) {
        linkedChats = [];
      }
    } finally {
      linkedChatsLoading = false;
    }
  }

  async function refreshMessagesInbox(options: { force?: boolean } = {}) {
    if (!browser || document.visibilityState !== 'visible') {
      return;
    }

    const now = Date.now();
    if (!options.force && now - lastInboxRefreshAt < INBOX_FOCUS_REFRESH_COOLDOWN_MS) {
      return;
    }

    if (inboxRefreshInFlight) {
      return inboxRefreshInFlight;
    }

    lastInboxRefreshAt = now;
    inboxRefreshInFlight = (async () => {
      try {
        const page = await getMessages();
        if (page) {
          conversations = Array.isArray(page.conversations) ? page.conversations : [];
        }
      } catch {
        // Keep the current inbox until the next successful refresh.
      }
    })().finally(() => {
      inboxRefreshInFlight = null;
    });
    return inboxRefreshInFlight;
  }

  async function refreshActiveThread() {
    if (!browser || document.visibilityState !== 'visible') {
      return;
    }

    if (activeConversationId && activeConversation) {
      await loadConversationMessages(activeConversationId, { silent: true });
      return;
    }

    if (activeLinkedChatId && activeLinkedChat) {
      await loadLinkedChatComments(activeLinkedChat, { silent: true });
    }
  }

  function handleVisibilityOrFocus() {
    if (document.visibilityState !== 'visible') {
      return;
    }

    void refreshActiveThread();
    void refreshMessagesInbox();
    void hydrateLinkedChats();
  }

  onMount(() => {
    lastKnownUnreadMessages = get(unreadCounts)?.messages ?? 0;
    const hydrateLinked = () => {
      void hydrateLinkedChats();
    };
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(hydrateLinked, { timeout: 400 });
    } else {
      window.setTimeout(hydrateLinked, 0);
    }
    const realtimeEnabled = isInboxRealtimeEnabled();

    const stopThreadPolling = realtimeEnabled
      ? () => {}
      : startVisibilityPoll(refreshActiveThread, {
          activeMs: THREAD_POLL_MS,
          idleMs: 60_000,
        });
    const stopInboxPolling = realtimeEnabled
      ? () => {}
      : startVisibilityPoll(
          async () => {
            await refreshMessagesInbox({ force: true });
            await hydrateLinkedChats({ force: true });
          },
          {
            activeMs: INBOX_REFRESH_MS,
            idleMs: INBOX_REFRESH_MS * 3,
          }
        );
    const stopRealtime = subscribeToViewerInbox(() => {
      void refreshActiveThread();
      void refreshMessagesInbox({ force: true });
      void hydrateLinkedChats({ force: true });
    });

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    const viewport = window.visualViewport;
    const onViewportChange = () => {
      scheduleMessagesShellHeightSync();
    };
    viewport?.addEventListener('resize', onViewportChange);
    viewport?.addEventListener('scroll', onViewportChange);
    scheduleMessagesShellHeightSync();

    const unsubscribeUnreadCounts = unreadCounts.subscribe((counts) => {
      if (!counts) {
        return;
      }

      if (counts.messages === lastKnownUnreadMessages) {
        return;
      }

      lastKnownUnreadMessages = counts.messages;
      void Promise.all([
        refreshActiveThread(),
        refreshMessagesInbox({ force: true }),
        hydrateLinkedChats({ force: true }),
      ]);
    });

    return () => {
      stopThreadPolling();
      stopInboxPolling();
      stopRealtime();

      if (shellHeightFrame !== null) {
        window.cancelAnimationFrame(shellHeightFrame);
      }

      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      viewport?.removeEventListener('resize', onViewportChange);
      viewport?.removeEventListener('scroll', onViewportChange);
      unsubscribeUnreadCounts();
    };
  });

  async function loadConversationMessages(
    conversationId: string,
    options: { silent?: boolean } = {}
  ) {
    const conversation = conversations.find((item) => item.id === conversationId);

    if (!conversation) {
      return false;
    }

    if (!options.silent) {
      messagesLoadingById = {
        ...messagesLoadingById,
        [conversationId]: true,
      };
    }

    try {
      const thread = await getConversationMessages(
        conversationId,
        data.viewer.id,
        conversation.participants
      );
      conversationMessagesById = {
        ...conversationMessagesById,
        [conversationId]: thread.messages,
      };
      pinsByConversationId = {
        ...pinsByConversationId,
        [conversationId]: thread.pins,
      };
      canPinByConversationId = {
        ...canPinByConversationId,
        [conversationId]: thread.canPin,
      };
      conversationLoadError = '';
      return true;
    } catch (error) {
      console.error('Could not load conversation messages', error);
      return false;
    } finally {
      if (!options.silent) {
        messagesLoadingById = {
          ...messagesLoadingById,
          [conversationId]: false,
        };
      }
    }
  }

  function directConversationAvatarImage(conversation: MessagesPageData['conversations'][number]) {
    if (conversation.kind !== 'direct') {
      return null;
    }

    const partner =
      conversation.participants.find((participant) => participant.id !== data.viewer.id) ??
      conversation.participants[0] ??
      null;

    return partner?.profileImageUrl ?? null;
  }

  function conversationDisplayTitle(conversation: MessagesPageData['conversations'][number]) {
    if (conversation.title?.trim()) {
      return conversation.title.trim();
    }
    if (conversation.kind === 'direct') {
      const partner =
        conversation.participants.find((participant) => participant.id !== data.viewer.id) ??
        conversation.participants[0] ??
        null;
      return partner?.username ?? 'Direct message';
    }
    return 'Group chat';
  }

  function findScrollContainer(node: HTMLElement) {
    let parent = node.parentElement;

    while (parent) {
      const styles = getComputedStyle(parent);
      const canScrollY =
        /auto|scroll/.test(styles.overflowY) && parent.scrollHeight > parent.clientHeight;

      if (canScrollY) {
        return parent;
      }

      parent = parent.parentElement;
    }

    return null;
  }

  function visibleTopOffset() {
    const topbarHeight =
      document.querySelector<HTMLElement>('.topbar')?.getBoundingClientRect().height ?? 0;
    return topbarHeight + 12;
  }

  function scrollConversationShellIntoView() {
    if (!browser || !messagesShellElement) {
      return;
    }

    const scrollContainer = findScrollContainer(messagesShellElement);

    if (scrollContainer) {
      const containerTop = scrollContainer.getBoundingClientRect().top;
      const shellTop = messagesShellElement.getBoundingClientRect().top;
      scrollContainer.scrollTo({
        top: Math.max(scrollContainer.scrollTop + shellTop - containerTop - 12, 0),
        behavior: 'auto',
      });
      return;
    }

    const shellTop = messagesShellElement.getBoundingClientRect().top;
    window.scrollTo({
      top: Math.max(window.scrollY + shellTop - visibleTopOffset(), 0),
      behavior: 'auto',
    });
  }

  function scheduleMessagesShellHeightSync() {
    if (!browser) return;
    if (shellHeightFrame !== null) return;
    shellHeightFrame = window.requestAnimationFrame(() => {
      shellHeightFrame = null;
      syncMessagesShellHeight();
    });
  }

  function syncMessagesShellHeight() {
    if (!browser || !messagesShellElement) {
      return;
    }

    const vv = window.visualViewport;
    const viewportHeight = vv?.height ?? window.innerHeight;
    const viewportOffsetTop = vv?.offsetTop ?? 0;
    const keyboardOpen = Boolean(
      vv &&
      window.innerHeight - vv.height > 120 &&
      (document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement instanceof HTMLInputElement ||
        (document.activeElement instanceof HTMLElement && document.activeElement.isContentEditable))
    );
    const topbar = document.querySelector<HTMLElement>('.topbar');
    const measuredTopbar = topbar?.getBoundingClientRect().height ?? 0;
    if (measuredTopbar > 0) {
      cachedTopbarPx = measuredTopbar;
    }
    const topbarPx = cachedTopbarPx;

    if (keyboardOpen) {
      // Pin the shell to the visible viewport so the full composer sits above the keyboard.
      const top = Math.max(
        viewportOffsetTop + (topbarCollapsedHeight(topbarPx) || 0),
        viewportOffsetTop
      );
      const bottomGap = Math.max(0, window.innerHeight - viewportOffsetTop - viewportHeight);
      messagesShellElement.style.position = 'fixed';
      messagesShellElement.style.left = '0';
      messagesShellElement.style.right = '0';
      messagesShellElement.style.top = `${Math.floor(top)}px`;
      messagesShellElement.style.bottom = `${Math.floor(bottomGap)}px`;
      messagesShellElement.style.width = '100%';
      messagesShellElement.style.height = 'auto';
      messagesShellElement.style.minHeight = '0';
      messagesShellElement.style.zIndex = '40';
      messagesShellElement.style.setProperty(
        '--messages-shell-height',
        `${Math.floor(Math.max(viewportHeight - (top - viewportOffsetTop), 200))}px`
      );
      return;
    }

    messagesShellElement.style.position = '';
    messagesShellElement.style.left = '';
    messagesShellElement.style.right = '';
    messagesShellElement.style.top = '';
    messagesShellElement.style.bottom = '';
    messagesShellElement.style.width = '';
    messagesShellElement.style.height = '';
    messagesShellElement.style.minHeight = '';
    messagesShellElement.style.zIndex = '';

    const topOffset = Math.max(
      messagesShellElement.getBoundingClientRect().top,
      visibleTopOffset()
    );
    const offsetRaw = getComputedStyle(messagesShellElement)
      .getPropertyValue('--shell-bottom-nav-offset')
      .trim();
    let bottomPx = cachedBottomNavPx;
    if (offsetRaw !== cachedBottomNavOffsetRaw) {
      cachedBottomNavOffsetRaw = offsetRaw;
      bottomPx = 0;
      if (offsetRaw && offsetRaw !== '0px') {
        const probe = document.createElement('div');
        probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;height:${offsetRaw}`;
        document.body.appendChild(probe);
        bottomPx = probe.getBoundingClientRect().height;
        probe.remove();
      }
      cachedBottomNavPx = bottomPx;
    }
    const scrollParent = messagesShellElement.closest('.main-content');
    const padBottom = scrollParent
      ? parseFloat(getComputedStyle(scrollParent).paddingBottom) || 0
      : 0;
    const nextHeight = Math.max(viewportHeight - topOffset - bottomPx - padBottom, 320);
    messagesShellElement.style.setProperty(
      '--messages-shell-height',
      `${Math.floor(nextHeight)}px`
    );
  }

  function topbarCollapsedHeight(measured: number) {
    // When the keyboard is open the shell chrome collapses; don't reserve a dead top band.
    const topbar = document.querySelector<HTMLElement>('.topbar');
    if (!topbar || topbar.classList.contains('chrome-collapsed')) {
      return 0;
    }
    return measured;
  }

  async function focusConversationShell() {
    if (!browser) {
      return;
    }

    await tick();
    scrollConversationShellIntoView();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await tick();
    scheduleMessagesShellHeightSync();
  }

  $: shellLayoutKey = [
    activeListTab,
    activeConversation?.id ?? 'no-conversation',
    activeLinkedChat?.id ?? 'no-linked-chat',
    showGroupOptions ? 'group-options-open' : 'group-options-closed',
  ].join(':');

  $: if (browser && messagesShellElement && shellLayoutKey) {
    tick().then(() => {
      scheduleMessagesShellHeightSync();
    });
  }

  async function openConversation(conversationId: string, unreadCount: number) {
    const conversation = conversations.find((item) => item.id === conversationId);

    if (!conversation) {
      return false;
    }

    activeLinkedChatId = null;
    showComposer = false;
    composerError = '';
    if (suppressRowOpen) {
      suppressRowOpen = false;
      return false;
    }

    showGroupOptions = false;
    groupSettingsFeedback = '';

    activeConversationId = conversationId;
    conversationLoadError = '';
    highlightedMessageId = null;
    pinError = '';

    const loaded = await loadConversationMessages(conversationId);

    if (!loaded) {
      conversationLoadError = 'Could not load messages.';
    }

    if (browser) {
      void goto(`/messages?conversation=${encodeURIComponent(conversationId)}`, {
        replaceState: true,
        keepFocus: true,
        noScroll: true
      });
    }

    if (loaded && unreadCount > 0) {
      await markConversationRead(conversationId, unreadCount);
      await refreshMessagesInbox();
      await loadConversationMessages(conversationId, { silent: true });
    }

    await focusConversationShell();
    return loaded;
  }

  async function retryActiveConversation() {
    if (!activeConversationId) {
      return;
    }

    conversationLoadError = '';
    const loaded = await loadConversationMessages(activeConversationId);
    if (!loaded) {
      conversationLoadError = 'Could not load messages.';
    }
  }

  let handledOpenConversationId: string | null = null;
  let deepLinkRefreshAttempted = false;
  let lastDeepLinkParam: string | null = null;

  $: if (openConversationId !== lastDeepLinkParam) {
    lastDeepLinkParam = openConversationId;
    handledOpenConversationId = null;
    deepLinkRefreshAttempted = false;
  }

  async function tryOpenDeepLinkConversation() {
    if (!browser || !openConversationId || openConversationId === handledOpenConversationId) {
      return;
    }

    const conversation = conversations.find((item) => item.id === openConversationId);

    if (!conversation) {
      if (!deepLinkRefreshAttempted) {
        deepLinkRefreshAttempted = true;
        await invalidate('inbox:messages');
      }
      return;
    }

    const opened = await openConversation(conversation.id, conversation.unreadCount);

    if (opened) {
      handledOpenConversationId = openConversationId;
    }
  }

  $: if (browser && openConversationId && openConversationId !== handledOpenConversationId) {
    void tryOpenDeepLinkConversation();
  }

  let handledComposeToUsername: string | null = null;

  $: if (
    browser &&
    composeToUsername &&
    composeToUsername !== handledComposeToUsername &&
    !activeConversation &&
    !activeLinkedChat
  ) {
    handledComposeToUsername = composeToUsername;
    activeListTab = 'personal';
    showComposer = true;
    composerError = '';
  }

  async function loadLinkedChatComments(
    chat: MessageLinkedChat,
    options: { silent?: boolean } = {}
  ) {
    registerEntityType(chat.subjectId, linkedChatEntityType(chat.kind));

    if (!options.silent) {
      linkedChatCommentsLoading = true;
    }

    try {
      linkedChatComments = (await getSubjectComments(chat.kind, chat.subjectId)).map(
        remapLinkedChatAuthor
      );
      linkedChatOptimisticComments = pruneOptimisticComments(
        linkedChatComments,
        linkedChatOptimisticComments
      );
      return true;
    } catch {
      return false;
    } finally {
      if (!options.silent) {
        linkedChatCommentsLoading = false;
      }
    }
  }

  async function openLinkedChat(chatId: string) {
    const chat = linkedChats.find((item) => item.id === chatId);

    if (!chat) {
      return false;
    }

    if (suppressRowOpen) {
      suppressRowOpen = false;
      return false;
    }

    activeConversationId = null;
    showComposer = false;
    composerError = '';
    showGroupOptions = false;
    groupSettingsFeedback = '';
    linkedChatComments = [];
    linkedChatOptimisticComments = [];

    const loaded = await loadLinkedChatComments(chat);

    if (!loaded) {
      return false;
    }

    activeLinkedChatId = chatId;

    if (chat.unreadCount > 0) {
      await markLinkedChatRead(chat.kind, chat.subjectId, chat.unreadCount);
      linkedChats = linkedChats.map((item) =>
        item.id === chat.id ? { ...item, unreadCount: 0 } : item
      );
      await Promise.all([
        refreshMessagesInbox({ force: true }),
        hydrateLinkedChats({ force: true }),
      ]);
      await loadLinkedChatComments(chat, { silent: true });
    }

    await focusConversationShell();
    return true;
  }

  async function submitConversationMessage(
    body: string,
    files?: File[],
    options?: { replyToId?: string | null }
  ) {
    if (!activeConversation) {
      return;
    }

    const conversationId = activeConversation.id;
    const optimisticId = `pending-${Date.now()}`;
    const previewUrls = (files ?? [])
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => URL.createObjectURL(file));
    let previewIndex = 0;
    const optimisticMessage: DirectMessage = {
      id: optimisticId,
      body,
      createdAt: new Date().toISOString(),
      isOwn: true,
      sender: {
        id: data.viewer.id,
        username: data.viewer.username,
        profileImageUrl: data.viewer.profileImageUrl,
      },
      report: null,
      attachments: (files ?? []).map((file, index) => ({
        id: `${optimisticId}-${index}`,
        kind: file.type.startsWith('image/') ? 'image' : 'file',
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        byteSize: file.size,
        url: file.type.startsWith('image/') ? previewUrls[previewIndex++] : '',
      })),
      replyAuthor: options?.replyToId
        ? (conversationMessagesById[conversationId] ?? []).find((item) => item.id === options.replyToId)
            ?.sender.username ?? null
        : null,
      replyPreview: options?.replyToId
        ? (conversationMessagesById[conversationId] ?? []).find((item) => item.id === options.replyToId)
            ?.body.slice(0, 140) ?? null
        : null,
    };

    conversationMessagesById = {
      ...conversationMessagesById,
      [conversationId]: [...(conversationMessagesById[conversationId] ?? []), optimisticMessage],
    };

    composerError = '';
    try {
      await sendMessage(conversationId, body, files, options?.replyToId);
      await loadConversationMessages(conversationId, { silent: true });
      void refreshMessagesInbox();
    } catch (err) {
      conversationMessagesById = {
        ...conversationMessagesById,
        [conversationId]: (conversationMessagesById[conversationId] ?? []).filter(
          (message) => message.id !== optimisticId
        ),
      };

      const detail = (err as { body?: { detail?: unknown } }).body?.detail;
      if (typeof detail === 'string') {
        composerError = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        const first = detail[0] as { msg?: string };
        composerError = first.msg ?? 'Could not send message';
      } else if (err instanceof Error && err.message.trim()) {
        composerError = err.message;
      } else {
        composerError = 'Could not send message';
      }
      throw new ChatSendError(composerError);
    } finally {
      for (const previewUrl of previewUrls) {
        URL.revokeObjectURL(previewUrl);
      }
    }
  }

  async function focusPinnedMessage(messageId: string) {
    if (highlightedMessageId === messageId) {
      highlightedMessageId = null;
      await tick();
    }

    highlightedMessageId = messageId;
  }

  async function toggleConversationPin(messageId: string, pinned: boolean) {
    if (!activeConversationId) {
      return;
    }

    composerError = '';
    pinError = '';

    try {
      if (pinned) {
        await unpinMessage(activeConversationId, messageId);
      } else {
        await pinMessage(activeConversationId, messageId);
      }

      await loadConversationMessages(activeConversationId, { silent: true });
    } catch (err) {
      composerError = err instanceof Error ? err.message : 'Could not update the pin';
      pinError = composerError;
    }
  }

  async function submitLinkedChatMessage(body: string, files?: File[]) {
    if (!activeLinkedChat) {
      return;
    }

    const optimistic = createOptimisticComment(data.viewer.username, body, files);
    linkedChatOptimisticComments = [...linkedChatOptimisticComments, optimistic];

    registerEntityType(activeLinkedChat.subjectId, linkedChatEntityType(activeLinkedChat.kind));

    try {
      await addComment(
        {
          id: activeLinkedChat.subjectId,
          type: linkedChatEntityType(activeLinkedChat.kind),
        },
        body,
        undefined,
        files
      );
    } catch {
      linkedChatOptimisticComments = linkedChatOptimisticComments.filter(
        (comment) => comment.id !== optimistic.id
      );
      throw new ChatSendError();
    }

    try {
      linkedChatComments = (
        await getSubjectComments(activeLinkedChat.kind, activeLinkedChat.subjectId)
      ).map(remapLinkedChatAuthor);
      linkedChatOptimisticComments = pruneOptimisticComments(
        linkedChatComments,
        linkedChatOptimisticComments
      );
    } catch {
      // Comment was saved; keep optimistic row until the next refresh succeeds.
    }
    await hydrateLinkedChats({ force: true });
  }

  function handleAddMemberKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && addableGroupMembers.length > 0) {
      event.preventDefault();
      void addMemberToGroup(addableGroupMembers[0].username);
    }
  }

  function startDirectCall() {
    if (!activeConversation || activeConversation.kind !== 'direct') {
      return;
    }
    void placeDirectCall(activeConversation.id, conversationDisplayTitle(activeConversation));
  }

  function closeActiveChat() {
    activeConversationId = null;
    activeLinkedChatId = null;
    showGroupOptions = false;
    groupSettingsFeedback = '';
    chatMenu = null;
    scheduleMessagesShellHeightSync();

    if (browser) {
      void goto('/messages');
    }
  }

  function publicChatKind(chat: MessageLinkedChat) {
    if (chat.kind === 'help_request') {
      return 'Help request';
    }

    return chat.kind === 'project' ? 'Project' : 'Event';
  }

  function selectListTab(tab: 'personal' | 'public') {
    activeListTab = tab;
    closeActiveChat();

    if (tab === 'public') {
      showComposer = false;
      void hydrateLinkedChats();
    }
  }

  function handleComposeTrigger() {
    if (activeListTab !== 'personal') {
      activeListTab = 'personal';
      showComposer = true;
      return;
    }

    showComposer = !showComposer;
  }

  async function handleComposerSent(event: CustomEvent<{ conversationId: string }>) {
    showComposer = false;
    activeConversationId = event.detail.conversationId;
    activeLinkedChatId = null;
    await invalidate('inbox:messages');

    if (activeConversationId) {
      if (browser) {
        await goto(`/messages?conversation=${encodeURIComponent(activeConversationId)}`, {
          replaceState: true,
          keepFocus: true,
          noScroll: true
        });
      }
      await loadConversationMessages(activeConversationId);
    }
  }

  function closeChatMenu() {
    chatMenu = null;
  }

  function onChatMenuOutside(event: PointerEvent) {
    const target = event.target;
    if (target instanceof Element && target.closest('.chat-row-menu')) {
      return;
    }
    closeChatMenu();
  }

  async function openChatMenu(
    target: { kind: 'conversation' | 'linked'; id: string },
    x: number,
    y: number,
    placement: 'list' | 'header' = 'list'
  ) {
    chatMenu = {
      ...target,
      placement,
      x: Math.min(x, window.innerWidth - 196),
      y: Math.min(y, window.innerHeight - 220)
    };
    await tick();
    window.addEventListener('pointerdown', onChatMenuOutside, { once: true });
  }

  function startRowHold(event: PointerEvent, target: { kind: 'conversation' | 'linked'; id: string }) {
    if (event.button !== 0) {
      return;
    }
    rowHoldOrigin = { x: event.clientX, y: event.clientY };
    if (rowHoldTimer) {
      clearTimeout(rowHoldTimer);
    }
    rowHoldTimer = setTimeout(() => {
      suppressRowOpen = true;
      void openChatMenu(target, rowHoldOrigin.x, rowHoldOrigin.y);
    }, 450);
  }

  function moveRowHold(event: PointerEvent) {
    if (!rowHoldTimer) {
      return;
    }
    if (Math.hypot(event.clientX - rowHoldOrigin.x, event.clientY - rowHoldOrigin.y) > 8) {
      clearTimeout(rowHoldTimer);
      rowHoldTimer = null;
    }
  }

  function endRowHold() {
    if (rowHoldTimer) {
      clearTimeout(rowHoldTimer);
      rowHoldTimer = null;
    }
  }

  function openHeaderMenu(event: MouseEvent) {
    const x = event.clientX;
    const y = event.clientY;
    if (activeConversation) {
      void openChatMenu({ kind: 'conversation', id: activeConversation.id }, x, y, 'header');
      return;
    }
    if (activeLinkedChat) {
      void openChatMenu({ kind: 'linked', id: activeLinkedChat.id }, x, y, 'header');
    }
  }

  async function applyChatMenuPreference(preferences: { pinned?: boolean; muted?: boolean; hidden?: boolean }) {
    const menu = chatMenu;
    closeChatMenu();
    if (!menu) {
      return;
    }

    if (menu.kind === 'conversation') {
      await setConversationListPreferences(menu.id, preferences);
      if (preferences.hidden && activeConversationId === menu.id) {
        closeActiveChat();
      }
      await refreshMessagesInbox({ force: true });
      return;
    }

    const chat = linkedChats.find((item) => item.id === menu.id);
    if (!chat) {
      return;
    }
    await setLinkedChatListPreferences(chat.kind, chat.subjectId, preferences);
    if (preferences.hidden && activeLinkedChatId === menu.id) {
      closeActiveChat();
    }
    await hydrateLinkedChats({ force: true });
  }

  async function openChatInfoFromMenu() {
    const menu = chatMenu;
    closeChatMenu();
    if (!menu || menu.kind !== 'conversation') {
      return;
    }
    suppressRowOpen = false;
    if (activeConversationId !== menu.id) {
      await openConversation(menu.id, 0);
    }
    showAddMembers = false;
    showRemoveMembers = false;
    groupSettingsFeedback = '';
    showGroupOptions = true;
  }

  async function editConversationMessage(messageId: string, body: string) {
    if (!activeConversationId) {
      return;
    }
    composerError = '';
    try {
      await editMessage(activeConversationId, messageId, body);
      await loadConversationMessages(activeConversationId, { silent: true });
    } catch (err) {
      composerError = err instanceof Error ? err.message : 'Could not edit message';
      throw err;
    }
  }

  async function deleteConversationMessage(messageId: string) {
    if (!activeConversationId) {
      return;
    }
    composerError = '';
    try {
      await deleteMessage(activeConversationId, messageId);
      await loadConversationMessages(activeConversationId, { silent: true });
    } catch (err) {
      composerError = err instanceof Error ? err.message : 'Could not delete message';
      throw err;
    }
  }

  async function saveGroupName() {
    if (!activeConversation || activeConversation.kind !== 'group') {
      return;
    }

    const result = await renameGroupConversation(activeConversation.id, renameDraft);

    groupSettingsTone = result.ok ? 'success' : 'warning';
    groupSettingsFeedback = result.ok
      ? 'Group name updated.'
      : (result.error ?? 'The group name could not be updated.');

    if (result.ok) {
      await invalidate('inbox:messages');
      if (activeConversationId) {
        await loadConversationMessages(activeConversationId);
      }
    }
  }

  async function addMemberToGroup(username: string) {
    if (!activeConversation || activeConversation.kind !== 'group') {
      return;
    }

    const result = await addGroupConversationMember(activeConversation.id, username);

    groupSettingsTone = result.ok ? 'success' : 'warning';
    groupSettingsFeedback = result.ok
      ? `${username} joined the group chat.`
      : (result.error ?? 'That member could not be added.');

    if (result.ok) {
      groupMemberDraft = '';
      await invalidate('inbox:messages');
      if (activeConversationId) {
        await loadConversationMessages(activeConversationId);
      }
    }
  }

  async function removeMemberFromGroup(username: string) {
    if (!activeConversation || activeConversation.kind !== 'group') {
      return;
    }

    const result = await removeGroupConversationMember(activeConversation.id, username);

    groupSettingsTone = result.ok ? 'success' : 'warning';
    groupSettingsFeedback = result.ok
      ? `${username} was removed from the group chat.`
      : (result.error ?? 'That member could not be removed.');

    if (result.ok) {
      await invalidate('inbox:messages');
      if (activeConversationId) {
        await loadConversationMessages(activeConversationId);
      }
    }
  }
</script>

<svelte:window on:resize={scheduleMessagesShellHeightSync} />

{#snippet muteMark()}
  <span class="muted-mark header-mute" aria-label="Muted" title="Muted">
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
      <path d="m16 9 5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
  </span>
{/snippet}

<section class:conversation-page={!!activeConversation || !!activeLinkedChat} class="page">
  {#if !activeConversation && !activeLinkedChat}
    <div class="desktop-only-header">
      <PageHeader
        title="Messages"
        description="Direct messages, group chats, and the same project or event chat rooms you already use elsewhere."
      />
    </div>
  {/if}

  <section
    bind:this={messagesShellElement}
    class:conversation-view={!!activeConversation || !!activeLinkedChat}
    class:list-view={!activeConversation && !activeLinkedChat}
    class="messages-shell"
  >
    {#if activeConversation || activeLinkedChat}
      <header class="chat-header" class:with-call={activeConversation?.kind === 'direct'}>
        <button class="back-button" type="button" on:click={closeActiveChat}>Back</button>

        {#if activeConversation}
          <div class="chat-identity">
            {#if activeConversation.kind === 'group'}
              <button
                aria-expanded={!!chatMenu}
                class="identity-trigger"
                type="button"
                on:click={openHeaderMenu}
              >
                <div>
                  <h2>
                    <span class="identity-title">{conversationDisplayTitle(activeConversation)}</span>
                    {#if activeConversation.muted}
                      {@render muteMark()}
                    {/if}
                  </h2>
                  <p class="identity-note">Group</p>
                </div>

                <AvatarBadge size="md" username={conversationDisplayTitle(activeConversation)} />
              </button>
            {:else}
              <button
                aria-expanded={!!chatMenu}
                class="identity-trigger"
                type="button"
                on:click={openHeaderMenu}
              >
                <div>
                  <h2>
                    <span class="identity-title">{conversationDisplayTitle(activeConversation)}</span>
                    {#if activeConversation.muted}
                      {@render muteMark()}
                    {/if}
                  </h2>
                </div>

                <AvatarBadge
                  size="md"
                  username={conversationDisplayTitle(activeConversation)}
                  imageUrl={activeDirectAvatarImageUrl}
                />
              </button>
            {/if}
          </div>
          {#if activeConversation.kind === 'direct'}
            <button
              class="call-button"
              type="button"
              aria-label={`Call ${conversationDisplayTitle(activeConversation)}`}
              on:click={startDirectCall}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"
                />
              </svg>
            </button>
          {/if}
        {:else if activeLinkedChat}
          <div class="chat-identity">
            <div class="identity-trigger">
              <div>
                <button
                  aria-expanded={!!chatMenu}
                  class="title-hit"
                  type="button"
                  on:click={openHeaderMenu}
                >
                  <h2>
                    <span class="identity-title">{activeLinkedChat.title}</span>
                    {#if activeLinkedChat.muted}
                      {@render muteMark()}
                    {/if}
                  </h2>
                </button>
                <p class="identity-note">
                  {#if activeLinkedChat.kind === 'project'}
                    Project chat ·
                    <button
                      aria-expanded={showProjectMembers}
                      class="members-link"
                      type="button"
                      on:click={() => openProjectMembers(activeLinkedChat)}
                    >
                      {memberCountLabel(activeLinkedChat.memberCount ?? 0)}
                    </button>
                  {:else}
                    {linkedChatMeta(activeLinkedChat)}
                  {/if}
                </p>
              </div>

              <button class="avatar-hit" type="button" aria-label="Chat options" on:click={openHeaderMenu}>
                <AvatarBadge size="md" username={activeLinkedChat.title} />
              </button>
            </div>
          </div>
        {/if}

        {#if activePins.length}
          <div class="pin-bar" aria-label="Pinned messages">
            {#each activePins as pin (pin.messageId)}
              <div class="pin-chip">
                <button class="pin-jump" type="button" on:click={() => focusPinnedMessage(pin.messageId)}>
                  {pin.preview || 'Pinned message'}
                </button>
                {#if canPinActiveConversation}
                  <button
                    aria-label={`Unpin ${pin.preview || 'message'}`}
                    class="pin-remove"
                    type="button"
                    on:click={() => toggleConversationPin(pin.messageId, true)}
                  >
                    Unpin
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        {/if}

        {#if pinError}
          <p class="pin-error" role="alert">{pinError}</p>
        {/if}
      </header>

      <OverlaySheet
        open={activeConversation?.kind === 'group' && showGroupOptions}
        title="Chat info"
        on:close={() => (showGroupOptions = false)}
      >
        <section class="group-settings-card">
          <label class="composer-field">
            <span>Group name</span>
            <div class="inline-field">
              <input bind:value={renameDraft} placeholder="Rename group chat" type="text" />
              <button class="secondary-button" type="button" on:click={saveGroupName}>Save</button>
            </div>
          </label>

          <div class="composer-field">
            <span>Members</span>
            <div class="member-links">
              {#each removableGroupMembers as member}
                <a class="member-link" href={`/profile/${member.username}`}>{member.username}</a>
              {/each}
            </div>
          </div>

          <div class="contact-list">
            <button
              class:active={showAddMembers}
              class="contact-chip"
              type="button"
              on:click={() => {
                showAddMembers = !showAddMembers;
                showRemoveMembers = false;
                groupSettingsFeedback = '';
              }}
            >
              Add member
            </button>
            <button
              class:active={showRemoveMembers}
              class="contact-chip"
              type="button"
              on:click={() => {
                showRemoveMembers = !showRemoveMembers;
                showAddMembers = false;
                groupSettingsFeedback = '';
              }}
            >
              Remove member
            </button>
          </div>

          {#if showAddMembers}
            <div class="composer-field">
              <span>Add someone</span>
              <input
                bind:value={groupMemberDraft}
                list="message-contacts"
                on:keydown={handleAddMemberKeydown}
                placeholder="Type a username"
                type="text"
              />
              <datalist id="message-contacts">
                {#each contactSuggestions as contact}
                  <option value={contact.username}></option>
                {/each}
              </datalist>
              {#if addableGroupMembers.length > 0}
                <div class="contact-list">
                  {#each addableGroupMembers as member}
                    <button
                      class="contact-chip"
                      type="button"
                      on:click={() => addMemberToGroup(member.username)}
                    >
                      {member.username}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}

          {#if showRemoveMembers}
            <div class="composer-field">
              <span>Remove someone</span>
              <div class="contact-list">
                {#each removableGroupMembers as member}
                  <button
                    class="contact-chip"
                    type="button"
                    on:click={() => removeMemberFromGroup(member.username)}
                  >
                    {member.username}
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          {#if groupSettingsFeedback}
            <p class:success={groupSettingsTone === 'success'} class="composer-feedback">
              {groupSettingsFeedback}
            </p>
          {/if}
        </section>
      </OverlaySheet>

      {#if activeConversation}
        {#if conversationLoadError}
          <div class="conversation-load-error" role="alert">
            <p>{conversationLoadError}</p>
            <button type="button" on:click={retryActiveConversation}>Try again</button>
          </div>
        {/if}
        <LiveChatPanel
          allowAttachments={fastapiMessaging}
          embedded={true}
          emptyCopy={activeConversationMessagesLoading
            ? 'Loading messages...'
            : conversationLoadError
              ? ''
              : 'No messages yet.'}
          highlightedCommentId={highlightedMessageId}
          messages={activeConversationMessages}
          onModerated={refreshActiveThread}
          conversationActions={true}
          onDeleteMessage={deleteConversationMessage}
          onEditMessage={editConversationMessage}
          onSubmitMessage={submitConversationMessage}
          onTogglePin={fastapiMessaging && canPinActiveConversation ? toggleConversationPin : null}
          placeholder="Write a message..."
          reportTargetType="message"
          showHeader={false}
          subjectId={activeConversation.id}
          submitLabel="Send"
          variant="message"
        />
      {:else if activeLinkedChat}
        <LiveChatPanel
          allowAttachments={fastapiMessaging}
          comments={linkedChatDiscussion}
          embedded={true}
          emptyCopy={linkedChatCommentsLoading
            ? 'Loading messages...'
            : linkedChatEmptyCopy(activeLinkedChat)}
          onModerated={refreshActiveThread}
          onSubmitMessage={submitLinkedChatMessage}
          placeholder={linkedChatPlaceholder(activeLinkedChat)}
          reportTargetType="comment"
          showHeader={false}
          subjectId={activeLinkedChat.subjectId}
          submitLabel="Send"
          variant="message"
        />
      {/if}
    {:else}
      <div class="surface-tabs" role="tablist" aria-label="Messages tabs">
        <div class="surface-tab-list">
          <button
            aria-label={tabAriaLabel('Personal', personalUnreadTotal)}
            class:active={activeListTab === 'personal'}
            class="surface-tab"
            role="tab"
            type="button"
            on:click={() => selectListTab('personal')}
          >
            <span class="surface-tab-label">Personal</span>
            {#if personalUnreadTotal > 0}
              <CountBadge count={personalUnreadTotal} />
            {/if}
          </button>
          <button
            aria-label={tabAriaLabel('Public', publicUnreadTotal)}
            class:active={activeListTab === 'public'}
            class="surface-tab"
            role="tab"
            type="button"
            on:click={() => selectListTab('public')}
          >
            <span class="surface-tab-label">Public</span>
            {#if publicUnreadTotal > 0}
              <CountBadge count={publicUnreadTotal} />
            {/if}
          </button>
        </div>
      </div>

      <ComposeMessageSheet
        bind:open={showComposer}
        prefillUsername={composeToUsername}
        on:close={() => (showComposer = false)}
        on:sent={handleComposerSent}
      />

      <div class="conversation-list">
        {#if activeListTab === 'personal'}
          {#if personalChats.length === 0}
            <div class="empty-state">No personal messages yet.</div>
          {:else}
            {#each personalChats as conversation}
              <button
                class:unread={conversation.unreadCount > 0}
                class="conversation-row"
                type="button"
                on:click={() => openConversation(conversation.id, conversation.unreadCount)}
                on:contextmenu={(event) => {
                  event.preventDefault();
                  suppressRowOpen = true;
                  void openChatMenu(
                    { kind: 'conversation', id: conversation.id },
                    event.clientX,
                    event.clientY
                  );
                }}
                on:pointerdown={(event) =>
                  startRowHold(event, { kind: 'conversation', id: conversation.id })}
                on:pointermove={moveRowHold}
                on:pointerup={endRowHold}
                on:pointercancel={endRowHold}
              >
                <AvatarBadge
                  size="sm"
                  username={conversationDisplayTitle(conversation)}
                  imageUrl={directConversationAvatarImage(conversation)}
                />
                <div class="conversation-copy">
                  <div class="conversation-topline">
                    {#if conversation.pinned}
                      <span class="pin-mark" aria-label="Pinned">
                        <svg aria-hidden="true" viewBox="0 0 24 24">
                          <path
                            d="M16 3l5 5-1.5 1.5-2.2-.7-3.1 3.1.8 3.6L12 13.5 8.2 17.3 6.7 15.8l3.8-3.8-2.1-3.1 3.1-3.1L11 3.5 16 3z"
                            fill="currentColor"
                          />
                        </svg>
                      </span>
                    {/if}
                    <strong>{conversationDisplayTitle(conversation)}</strong>
                    {#if conversation.muted}
                      <span class="muted-mark" aria-label="Muted" title="Muted">
                        <svg aria-hidden="true" viewBox="0 0 24 24">
                          <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
                          <path d="m16 9 5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                        </svg>
                      </span>
                    {/if}
                    <span class="conversation-time"
                      >{formatRelativeTimeCompact(conversation.lastMessageAt)}</span
                    >
                  </div>
                  <p class="conversation-preview">{conversation.preview}</p>
                </div>
                {#if conversation.unreadCount > 0}
                  <span class="unread-pill">{conversation.unreadCount}</span>
                {/if}
              </button>
            {/each}
          {/if}
        {:else if publicChats.length === 0}
          <div class="empty-state">No public chats yet.</div>
        {:else}
          {#each publicChats as chat}
            <button
              class:unread={chat.unreadCount > 0}
              class="conversation-row"
              type="button"
              on:click={() => openLinkedChat(chat.id)}
              on:contextmenu={(event) => {
                event.preventDefault();
                suppressRowOpen = true;
                void openChatMenu({ kind: 'linked', id: chat.id }, event.clientX, event.clientY);
              }}
              on:pointerdown={(event) => startRowHold(event, { kind: 'linked', id: chat.id })}
              on:pointermove={moveRowHold}
              on:pointerup={endRowHold}
              on:pointercancel={endRowHold}
            >
              <AvatarBadge size="sm" username={chat.title} />
              <div class="conversation-copy">
                <div class="conversation-topline">
                  {#if chat.pinned}
                    <span class="pin-mark" aria-label="Pinned">
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path
                          d="M16 3l5 5-1.5 1.5-2.2-.7-3.1 3.1.8 3.6L12 13.5 8.2 17.3 6.7 15.8l3.8-3.8-2.1-3.1 3.1-3.1L11 3.5 16 3z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                  {/if}
                  <strong>{chat.title}</strong>
                  {#if chat.muted}
                    <span class="muted-mark" aria-label="Muted" title="Muted">
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
                        <path d="m16 9 5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                      </svg>
                    </span>
                  {/if}
                  <span class="chat-kind">{publicChatKind(chat)}</span>
                  <span class="conversation-time">{formatRelativeTimeCompact(chat.lastMessageAt)}</span>
                </div>
                <p class="conversation-preview">{chat.preview}</p>
              </div>
              {#if chat.unreadCount > 0}
                <span class="unread-pill">{chat.unreadCount}</span>
              {/if}
            </button>
          {/each}
        {/if}
      </div>

      <button class="message-fab" type="button" aria-label="New message" on:click={handleComposeTrigger}>
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
        </svg>
      </button>
    {/if}
  </section>

  {#if projectMembersData}
    <ProjectMembersPanel
      data={projectMembersData}
      open={showProjectMembers}
      on:close={() => (showProjectMembers = false)}
    />
  {/if}

  {#if chatMenu}
    {@const menu = chatMenu}
    {@const menuConversation =
      menu.kind === 'conversation' ? conversations.find((item) => item.id === menu.id) : null}
    {@const menuLinked =
      menu.kind === 'linked' ? linkedChats.find((item) => item.id === menu.id) : null}
    {@const menuPinned = Boolean(menuConversation?.pinned || menuLinked?.pinned)}
    {@const menuMuted = Boolean(menuConversation?.muted || menuLinked?.muted)}
    {@const menuPartner =
      menuConversation?.kind === 'direct'
        ? (menuConversation.participants.find((person) => person.id !== data.viewer.id) ??
          menuConversation.participants[0] ??
          null)
        : null}
    <div
      class="chat-row-menu"
      role="menu"
      style="left: {chatMenu.x}px; top: {chatMenu.y}px"
      use:portal={'body'}
    >
      {#if menu.kind === 'linked' && menu.placement === 'header'}
        {#if menuLinked}
          <a role="menuitem" href={menuLinked.href} on:click={closeChatMenu}>Open page</a>
        {/if}
        <button type="button" role="menuitem" on:click={() => applyChatMenuPreference({ muted: !menuMuted })}>
          {menuMuted ? 'Unmute' : 'Mute'}
        </button>
      {:else}
        {#if menuPartner}
          <a role="menuitem" href={`/profile/${menuPartner.username}`} on:click={closeChatMenu}>View profile</a>
        {/if}
        {#if menuLinked}
          <a role="menuitem" href={menuLinked.href} on:click={closeChatMenu}>Open page</a>
        {/if}
        <button type="button" role="menuitem" on:click={() => applyChatMenuPreference({ pinned: !menuPinned })}>
          {menuPinned ? 'Unpin' : 'Pin'}
        </button>
        <button type="button" role="menuitem" on:click={() => applyChatMenuPreference({ muted: !menuMuted })}>
          {menuMuted ? 'Unmute' : 'Mute'}
        </button>
        {#if menuConversation?.kind === 'group'}
          <button type="button" role="menuitem" on:click={openChatInfoFromMenu}>Chat info</button>
        {/if}
        <button type="button" role="menuitem" on:click={() => applyChatMenuPreference({ hidden: true })}>
          Delete
        </button>
      {/if}
    </div>
  {/if}
</section>

<style>
  .page {
    display: grid;
    gap: 12px;
    min-height: 0;
    grid-template-rows: auto minmax(0, 1fr);
    align-content: start;
  }

  .page.conversation-page {
    gap: 0;
    grid-template-rows: minmax(0, 1fr);
  }

  .messages-shell {
    border: 1px solid var(--panel-border);
    border-radius: 0;
    overflow: hidden;
    background: var(--panel);
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    height: var(--messages-shell-height, min(720px, calc(100dvh - 32px)));
    min-height: var(--messages-shell-height, min(520px, calc(100dvh - 32px)));
  }

  .messages-shell.list-view {
    grid-template-rows: auto auto minmax(0, 1fr);
  }

  .messages-shell.conversation-view {
    grid-template-rows: auto minmax(0, 1fr);
    height: var(--messages-shell-height, calc(100dvh - 32px));
    min-height: var(--messages-shell-height, calc(100dvh - 32px));
  }

  .messages-shell.conversation-view > :global(.chat-panel) {
    min-height: 0;
    height: 100%;
  }

  .chat-header,
  .group-settings-card {
    padding: 14px 16px;
    background: color-mix(in srgb, var(--panel-strong) 38%, var(--panel));
    border-bottom: 1px solid var(--panel-border);
  }

  .chat-header {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 12px;
    align-items: center;
  }

  .chat-header.with-call {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  .call-button {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
    color: var(--text-main);
    cursor: pointer;
  }

  .call-button svg {
    width: 18px;
    height: 18px;
  }

  .call-button:hover {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .pin-bar {
    grid-column: 1 / -1;
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-top: 4px;
  }

  .pin-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 0 0 auto;
    max-width: 240px;
    padding: 4px 8px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel);
  }

  .pin-jump,
  .pin-remove {
    border: none;
    background: transparent;
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
  }

  .pin-jump {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pin-remove {
    color: var(--text-soft);
  }

  .pin-error {
    grid-column: 1 / -1;
    margin: 0;
    color: var(--danger);
    font-size: 13px;
  }

  .chat-identity,
  .conversation-copy,
  .composer-field,
  .group-settings-card {
    display: grid;
    gap: 8px;
  }

  .chat-identity {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    justify-self: end;
    text-align: right;
  }

  .surface-tabs {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px 12px;
    background: color-mix(in srgb, var(--panel-strong) 38%, var(--panel));
    border-bottom: 1px solid var(--panel-border);
  }

  .surface-tab-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    flex: 1 1 auto;
    min-width: 0;
  }

  .surface-tab {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 0;
    min-height: 44px;
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 15px;
    font-weight: 800;
  }

  .surface-tab-label {
    white-space: nowrap;
  }

  .message-fab {
    position: fixed;
    right: calc(var(--right-width, 0px) + 16px);
    bottom: calc(var(--shell-bottom-nav-offset, 0px) + 16px);
    z-index: 56;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    padding: 0;
    border: none;
    border-radius: 999px;
    background: var(--brand);
    color: #fff;
    box-shadow: 0 8px 24px color-mix(in srgb, var(--brand) 35%, transparent);
    cursor: pointer;
  }

  .message-fab svg {
    width: 22px;
    height: 22px;
  }

  .chat-kind {
    flex: 0 1 auto;
    min-width: 0;
    max-width: 42%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
  }

  .chat-identity h2,
  .identity-trigger h2 {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .identity-title {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .title-hit,
  .avatar-hit {
    padding: 0;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
    text-align: inherit;
  }

  .title-hit {
    display: block;
    min-width: 0;
    width: 100%;
  }

  .surface-tab.active {
    border-color: transparent;
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .identity-trigger {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    width: 100%;
    padding: 0;
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
    text-align: inherit;
  }

  button.identity-trigger:hover h2,
  button.identity-trigger:hover .identity-note,
  .identity-trigger:has(.title-hit:hover) h2,
  .identity-trigger:has(.avatar-hit:hover) h2 {
    color: var(--brand-strong);
  }

  div.identity-trigger {
    cursor: default;
  }

  .members-link {
    display: inline-flex;
    align-items: center;
    margin: 0;
    padding: 0 6px;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-main);
    font: inherit;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.6;
    cursor: pointer;
  }

  .members-link:hover,
  .members-link[aria-expanded='true'] {
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .identity-note,
  .conversation-time,
  .empty-state {
    color: var(--text-soft);
    font-size: 12px;
  }

  .inline-field,
  .contact-list,
  .member-links {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .inline-field {
    align-items: stretch;
  }

  .inline-field input {
    flex: 1 1 220px;
  }

  .composer-field input {
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-main);
    padding: 10px 12px;
  }

  .contact-chip,
  .member-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .contact-chip:hover,
  .contact-chip.active,
  .member-link:hover {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .conversation-load-error {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 0;
    padding: 10px 16px;
    background: var(--panel-strong);
    color: var(--text-main);
    font-size: 13px;
    font-weight: 700;
  }

  .conversation-load-error p {
    margin: 0;
  }

  .conversation-load-error button {
    flex: 0 0 auto;
    padding: 6px 10px;
    border: 0;
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .composer-feedback {
    color: var(--accent-warm-strong);
    font-size: 12px;
    font-weight: 700;
  }

  .composer-feedback.success {
    color: var(--brand-strong);
  }

  .conversation-list {
    justify-self: stretch;
    text-align: left;
  }

  .conversation-list {
    grid-template-columns: minmax(0, 1fr);
    overflow-y: auto;
    display: grid;
    grid-auto-rows: min-content;
    align-content: start;
    gap: 0;
    padding: 0 0 76px;
    min-height: 0;
  }

  .conversation-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    width: 100%;
    padding: 12px 14px;
    border: none;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 70%, transparent);
    border-radius: 0;
    background: transparent;
    color: var(--text-main);
    text-align: left;
    touch-action: manipulation;
  }

  .pin-mark,
  .muted-mark {
    flex: 0 0 auto;
    display: inline-flex;
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
  }

  .pin-mark {
    color: var(--brand-strong);
  }

  .pin-mark svg,
  .muted-mark svg {
    width: 14px;
    height: 14px;
  }

  .chat-row-menu {
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

  .chat-row-menu a,
  .chat-row-menu button {
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    text-decoration: none;
    padding: 8px 10px;
    border-radius: 8px;
    cursor: pointer;
  }

  .chat-row-menu a:hover,
  .chat-row-menu button:hover {
    background: color-mix(in srgb, var(--accent, #3d6b4f) 12%, transparent);
  }

  .conversation-list > .empty-state {
    padding: 20px 14px;
    border: none;
    border-radius: 0;
    background: transparent;
    color: color-mix(in srgb, var(--text-soft) 88%, transparent);
    text-align: center;
  }

  .conversation-row.unread {
    background: color-mix(in srgb, var(--brand-soft) 28%, var(--panel));
    box-shadow: inset 3px 0 0 var(--brand);
  }

  .conversation-row.unread .conversation-topline strong {
    font-weight: 800;
    color: var(--text-main);
  }

  .conversation-row.unread .conversation-copy p {
    color: color-mix(in srgb, var(--text-main) 82%, var(--text-soft));
    font-weight: 600;
  }

  .conversation-row:hover {
    border-color: color-mix(in srgb, var(--brand) 35%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 22%, var(--panel));
  }

  .conversation-row.unread:hover {
    background: color-mix(in srgb, var(--brand-soft) 38%, var(--panel));
  }

  .conversation-copy {
    min-width: 0;
    overflow: hidden;
  }

  .conversation-topline {
    display: flex;
    gap: 8px;
    align-items: baseline;
    min-width: 0;
    overflow: hidden;
  }

  .conversation-time {
    flex: 0 0 auto;
    margin-left: auto;
    white-space: nowrap;
  }

  .conversation-topline strong {
    flex: 1 1 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .conversation-copy p {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.35;
  }

  .conversation-preview {
    display: -webkit-box;
    overflow: hidden;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }

  .unread-pill {
    display: inline-grid;
    place-items: center;
    align-self: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--brand);
    color: var(--page-background);
    font-size: 11px;
    font-weight: 800;
    line-height: 1;
  }

  input {
    width: 100%;
  }

  .empty-state {
    padding: 12px;
  }

  .back-button,
  .secondary-button {
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
  }

  .back-button:hover,
  .secondary-button:hover {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  @media (max-width: 900px) {
    .chat-header {
      grid-template-columns: auto minmax(0, 1fr);
      gap: 8px;
      align-items: center;
    }

    .chat-identity :global(.identity-trigger > div) {
      min-width: 0;
    }

    .chat-identity h2 {
      min-width: 0;
    }

    .back-button {
      width: auto;
      flex-shrink: 0;
      padding: 6px 10px;
      font-size: 11px;
    }

    .conversation-row {
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
      padding: 12px;
    }

    .inline-field {
      grid-template-columns: 1fr;
      display: grid;
    }
  }

  @media (max-width: 1080px) {
    .page.conversation-page {
      margin: 0 -12px;
      width: calc(100% + 24px);
    }

    .page.conversation-page .messages-shell {
      border-left: none;
      border-right: none;
    }

    .page.conversation-page .chat-header {
      padding-top: calc(10px + var(--shell-safe-top, 0px));
    }

    .page.conversation-page .messages-shell.conversation-view {
      position: fixed;
      left: 0;
      right: 0;
      top: var(--topbar-height);
      bottom: var(--shell-bottom-nav-offset);
      width: 100%;
      height: auto;
      min-height: 0;
      z-index: 15;
    }
  }

  @media (max-width: 760px) {
    .desktop-only-header {
      display: none;
    }

    .page:not(.conversation-page) .messages-shell.list-view {
      position: fixed;
      left: 0;
      right: 0;
      top: var(--topbar-height);
      bottom: var(--shell-bottom-nav-offset);
      width: 100%;
      height: auto;
      min-height: 0;
      z-index: 12;
      border-left: none;
      border-right: none;
    }

    .messages-shell {
      height: var(--messages-shell-height, min(640px, calc(100dvh - 24px)));
      min-height: var(--messages-shell-height, min(420px, calc(100dvh - 24px)));
    }

    .messages-shell.conversation-view {
      height: var(--messages-shell-height, calc(100dvh - 24px));
      min-height: var(--messages-shell-height, calc(100dvh - 24px));
    }

    .surface-tabs {
      padding: 10px;
    }

    .conversation-list {
      padding-bottom: 76px;
    }

    .conversation-row.unread {
      box-shadow: none;
    }

    .conversation-row.unread .conversation-topline strong {
      font-weight: 800;
    }

    .unread-pill {
      min-width: 18px;
      height: 18px;
      font-size: 10px;
    }
  }
</style>
