<script lang="ts">
  import { browser } from '$app/environment';
  import { goto, invalidate, invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import LiveChatPanel from '$lib/components/chat/LiveChatPanel.svelte';
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import CountBadge from '$lib/components/shared/CountBadge.svelte';
  import PageHeader from '$lib/components/shared/PageHeader.svelte';
  import RoundPlusButton from '$lib/components/shared/RoundPlusButton.svelte';
  import { unreadCounts } from '$lib/stores/unreadCounts';
  import { addComment } from '$lib/services/queries/details';
  import { fetchComments } from '$lib/api/drivers/fastapi/domains/content';
  import { registerEntityType, registerCommentIds } from '$lib/api/drivers/fastapi/typeRegistry';
  import {
    ChatSendError,
    createOptimisticComment,
    mergeDiscussion,
    pruneOptimisticComments
  } from '$lib/utils/discussionState';
  import {
    addGroupConversationMember,
    createGroupConversation,
    getConversationMessages,
    getMessageContacts,
    markConversationRead,
    markLinkedChatRead,
    removeGroupConversationMember,
    renameGroupConversation,
    sendMessage,
    startDirectMessage
  } from '$lib/services/queries/inbox';
  import type { DirectMessage, MessageLinkedChat, MessagesPageData } from '$lib/types/inbox';
  import type { ViewerSummary } from '$lib/types/bootstrap';
  import type { DetailComment } from '$lib/types/detail';
  import type { VoteDirection } from '$lib/types/feed';
  import { tick } from 'svelte';
  import { formatRelativeTime } from '$lib/utils/time';

  export let data: MessagesPageData;
  export let openConversationId: string | null = null;
  export let composeToUsername: string | null = null;

  let activeConversationId: string | null = null;
  let activeLinkedChatId: string | null = null;
  let activeListTab: 'messages' | 'linked-chats' | 'help-request-chats' = 'messages';
  let showComposer = false;
  let composerMode: 'direct' | 'group' = 'direct';
  let recipientDraft = '';
  let groupTitleDraft = '';
  let groupMemberDraft = '';
  let selectedGroupMembers: string[] = [];
  let composerDraft = '';
  let composerError = '';
  let showGroupOptions = false;
  let showAddMembers = false;
  let showRemoveMembers = false;
  let showDirectOptions = false;
  let renameDraft = '';
  let groupSettingsFeedback = '';
  let groupSettingsTone: 'success' | 'warning' = 'success';
  let directOptionsFeedback = '';
  let titleSyncKey = '';
  let messagesShellElement: HTMLElement | null = null;
  let linkedChatComments: DetailComment[] = [];
  let linkedChatCommentsLoading = false;
  let linkedChatOptimisticComments: DetailComment[] = [];
  let linkedChatDiscussion: DetailComment[] = [];
  let conversationMessagesById: Record<string, DirectMessage[]> = {};
  let messagesLoadingById: Record<string, boolean> = {};
  let contactSuggestions: ViewerSummary[] = [];
  let contactSearchKey = '';
  let contactSearchRequestId = 0;

  const THREAD_POLL_MS = 8_000;
  const INBOX_REFRESH_MS = 30_000;

  let lastKnownUnreadMessages = 0;
  let threadPollTimer: number | null = null;
  let inboxRefreshTimer: number | null = null;

  $: linkedChatDiscussion = mergeDiscussion(linkedChatComments, linkedChatOptimisticComments);
  $: activeConversation =
    data.conversations.find((conversation) => conversation.id === activeConversationId) ?? null;
  $: activeLinkedChat = data.linkedChats.find((chat) => chat.id === activeLinkedChatId) ?? null;
  $: projectEventLinkedChats = data.linkedChats.filter(
    (chat) => chat.kind === 'project' || chat.kind === 'event'
  );
  $: helpRequestLinkedChats = data.linkedChats.filter((chat) => chat.kind === 'help_request');
  $: directGroupUnreadTotal = data.conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0);
  $: projectEventUnreadTotal = projectEventLinkedChats.reduce((sum, chat) => sum + chat.unreadCount, 0);
  $: helpRequestUnreadTotal = helpRequestLinkedChats.reduce((sum, chat) => sum + chat.unreadCount, 0);
  $: activeConversationMessagesLoading =
    activeConversationId ? (messagesLoadingById[activeConversationId] ?? false) : false;
  $: activeConversationMessages = activeConversationId
    ? (conversationMessagesById[activeConversationId] ?? []).map((message) => ({
        id: message.id,
        authorUsername: message.sender.username,
        body: message.body,
        createdAt: message.createdAt,
        isOwn: message.isOwn,
        report: message.report ?? null,
        showAuthor: activeConversation?.kind === 'group'
      }))
    : [];
  $: directConversationPartner =
    activeConversation?.kind === 'direct'
      ? activeConversation.participants.find((participant) => participant.id !== data.viewer.id) ??
        activeConversation.participants[0] ??
        null
      : null;
  $: activeDirectAvatarImageUrl = directConversationPartner?.profileImageUrl ?? null;
  $: normalizedRecipientQuery = recipientDraft.trim().toLowerCase();
  $: normalizedGroupQuery = groupMemberDraft.trim().toLowerCase();
  $: activeContactQuery =
    showComposer && composerMode === 'direct'
      ? recipientDraft
      : (showComposer && composerMode === 'group') || showAddMembers
        ? groupMemberDraft
        : '';
  $: if (browser && (showComposer || showAddMembers)) {
    void updateContactSuggestions(activeContactQuery);
  }
  $: directSuggestions = contactSuggestions.filter(
    (contact) =>
      contact.id !== data.viewer.id &&
      (normalizedRecipientQuery
        ? contact.username.toLowerCase().includes(normalizedRecipientQuery)
        : true)
  );
  $: groupSuggestions = contactSuggestions.filter(
    (contact) =>
      contact.id !== data.viewer.id &&
      !selectedGroupMembers.includes(contact.username) &&
      (normalizedGroupQuery ? contact.username.toLowerCase().includes(normalizedGroupQuery) : true)
  );
  $: addableGroupMembers =
    activeConversation?.kind === 'group'
      ? contactSuggestions.filter(
          (contact) =>
            contact.id !== data.viewer.id &&
            !activeConversation.participants.some((participant) => participant.id === contact.id) &&
            (normalizedGroupQuery ? contact.username.toLowerCase().includes(normalizedGroupQuery) : true)
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
    showDirectOptions = false;
    groupMemberDraft = '';
    groupSettingsFeedback = '';
    directOptionsFeedback = '';
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

  type RawLinkedChatComment = {
    id: string;
    author_id: string | null;
    author_username: string;
    body: string;
    created_at: string;
    vote_count: number;
    active_vote?: number;
    replies?: RawLinkedChatComment[];
  };

  function mapLinkedChatComment(c: RawLinkedChatComment): DetailComment {
    registerEntityType(c.id, 'comment');
    return {
      id: c.id,
      authorUsername: linkedChatAuthorUsername(c.author_username, c.author_id),
      body: c.body,
      createdAt: c.created_at,
      voteCount: c.vote_count,
      activeVote: (c.active_vote ?? 0) as VoteDirection,
      report: null,
      replies: (c.replies ?? []).map((reply) => {
        registerEntityType(reply.id, 'comment');
        return {
          id: reply.id,
          authorUsername: linkedChatAuthorUsername(reply.author_username, reply.author_id),
          body: reply.body,
          createdAt: reply.created_at,
          voteCount: reply.vote_count,
          activeVote: (reply.active_vote ?? 0) as VoteDirection,
          replies: [],
        };
      }),
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
    const lookupKey = `${showAddMembers ? 'add' : composerMode}:${normalized}`;

    if (lookupKey === contactSearchKey) {
      return;
    }

    contactSearchKey = lookupKey;

    if (!normalized) {
      if (showAddMembers) {
        contactSuggestions =
          activeConversation?.participants.filter((participant) => participant.id !== data.viewer.id) ?? [];
        return;
      }

      if (showComposer) {
        const requestId = ++contactSearchRequestId;

        try {
          const results = await getMessageContacts('', 8);

          if (requestId !== contactSearchRequestId) {
            return;
          }

          contactSuggestions = results;
        } catch {
          if (requestId === contactSearchRequestId) {
            contactSuggestions = [];
          }
        }
      } else {
        contactSuggestions = [];
      }

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

  async function refreshMessagesInbox() {
    if (!browser || document.visibilityState !== 'visible') {
      return;
    }

    await invalidate('inbox:messages');
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
  }

  onMount(() => {
    lastKnownUnreadMessages = get(unreadCounts)?.messages ?? 0;

    threadPollTimer = window.setInterval(() => {
      void refreshActiveThread();
    }, THREAD_POLL_MS);

    inboxRefreshTimer = window.setInterval(() => {
      void refreshMessagesInbox();
    }, INBOX_REFRESH_MS);

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    const unsubscribeUnreadCounts = unreadCounts.subscribe((counts) => {
      if (!counts) {
        return;
      }

      if (counts.messages === lastKnownUnreadMessages) {
        return;
      }

      lastKnownUnreadMessages = counts.messages;
      void refreshMessagesInbox();
      void refreshActiveThread();
    });

    return () => {
      if (threadPollTimer !== null) {
        window.clearInterval(threadPollTimer);
      }

      if (inboxRefreshTimer !== null) {
        window.clearInterval(inboxRefreshTimer);
      }

      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      unsubscribeUnreadCounts();
    };
  });

  async function loadConversationMessages(
    conversationId: string,
    options: { silent?: boolean } = {}
  ) {
    const conversation = data.conversations.find((item) => item.id === conversationId);

    if (!conversation) {
      return false;
    }

    if (!options.silent) {
      messagesLoadingById = {
        ...messagesLoadingById,
        [conversationId]: true
      };
    }

    try {
      const messages = await getConversationMessages(
        conversationId,
        data.viewer.id,
        conversation.participants
      );
      conversationMessagesById = {
        ...conversationMessagesById,
        [conversationId]: messages
      };
      return true;
    } catch {
      return false;
    } finally {
      if (!options.silent) {
        messagesLoadingById = {
          ...messagesLoadingById,
          [conversationId]: false
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

  function findScrollContainer(node: HTMLElement) {
    let parent = node.parentElement;

    while (parent) {
      const styles = getComputedStyle(parent);
      const canScrollY = /auto|scroll/.test(styles.overflowY) && parent.scrollHeight > parent.clientHeight;

      if (canScrollY) {
        return parent;
      }

      parent = parent.parentElement;
    }

    return null;
  }

  function visibleTopOffset() {
    const topbarHeight = document.querySelector<HTMLElement>('.topbar')?.getBoundingClientRect().height ?? 0;
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
        behavior: 'auto'
      });
      return;
    }

    const shellTop = messagesShellElement.getBoundingClientRect().top;
    window.scrollTo({
      top: Math.max(window.scrollY + shellTop - visibleTopOffset(), 0),
      behavior: 'auto'
    });
  }

  function syncMessagesShellHeight() {
    if (!browser || !messagesShellElement) {
      return;
    }

    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const topOffset = Math.max(messagesShellElement.getBoundingClientRect().top, visibleTopOffset());
    const nextHeight = Math.max(viewportHeight - topOffset, 320);
    messagesShellElement.style.setProperty('--messages-shell-height', `${Math.floor(nextHeight)}px`);
  }

  async function focusConversationShell() {
    if (!browser) {
      return;
    }

    await tick();
    scrollConversationShellIntoView();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await tick();
    syncMessagesShellHeight();
  }

  $: shellLayoutKey = [
    activeListTab,
    showComposer ? 'composer-open' : 'composer-closed',
    activeConversation?.id ?? 'no-conversation',
    activeLinkedChat?.id ?? 'no-linked-chat',
    showGroupOptions ? 'group-options-open' : 'group-options-closed',
    showDirectOptions ? 'direct-options-open' : 'direct-options-closed'
  ].join(':');

  $: if (browser && messagesShellElement && shellLayoutKey) {
    tick().then(() => {
      syncMessagesShellHeight();
    });
  }

  async function openConversation(conversationId: string, unreadCount: number) {
    const conversation = data.conversations.find((item) => item.id === conversationId);

    if (!conversation) {
      return false;
    }

    activeLinkedChatId = null;
    showComposer = false;
    composerError = '';
    showGroupOptions = false;
    showDirectOptions = false;
    groupSettingsFeedback = '';
    directOptionsFeedback = '';

    const loaded = await loadConversationMessages(conversationId);

    if (!loaded) {
      return false;
    }

    activeConversationId = conversationId;

    if (unreadCount > 0) {
      await markConversationRead(conversationId, unreadCount);
      await refreshMessagesInbox();
      await loadConversationMessages(conversationId, { silent: true });
    }

    await focusConversationShell();
    return true;
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

    const conversation = data.conversations.find((item) => item.id === openConversationId);

    if (!conversation) {
      if (!deepLinkRefreshAttempted) {
        deepLinkRefreshAttempted = true;
        await invalidateAll();
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
    activeListTab = 'messages';
    composerMode = 'direct';
    recipientDraft = composeToUsername;
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
      linkedChatComments = (
        await fetchComments(chat.kind, chat.subjectId)
      ).map(mapLinkedChatComment);
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
    const chat = data.linkedChats.find((item) => item.id === chatId);

    if (!chat) {
      return false;
    }

    activeConversationId = null;
    showComposer = false;
    composerError = '';
    showGroupOptions = false;
    showDirectOptions = false;
    groupSettingsFeedback = '';
    directOptionsFeedback = '';
    linkedChatComments = [];
    linkedChatOptimisticComments = [];

    const loaded = await loadLinkedChatComments(chat);

    if (!loaded) {
      return false;
    }

    activeLinkedChatId = chatId;

    if (chat.unreadCount > 0) {
      await markLinkedChatRead(chat.kind, chat.subjectId, chat.unreadCount);
      await refreshMessagesInbox();
      await loadLinkedChatComments(chat, { silent: true });
    }

    await focusConversationShell();
    return true;
  }

  async function submitConversationMessage(body: string) {
    if (!activeConversation) {
      return;
    }

    const conversationId = activeConversation.id;
    const optimisticId = `pending-${Date.now()}`;
    const optimisticMessage: DirectMessage = {
      id: optimisticId,
      body,
      createdAt: new Date().toISOString(),
      isOwn: true,
      sender: {
        id: data.viewer.id,
        username: data.viewer.username,
        profileImageUrl: data.viewer.profileImageUrl
      },
      report: null
    };

    conversationMessagesById = {
      ...conversationMessagesById,
      [conversationId]: [...(conversationMessagesById[conversationId] ?? []), optimisticMessage]
    };

    composerError = '';
    try {
      await sendMessage(conversationId, body);
      await loadConversationMessages(conversationId, { silent: true });
      void refreshMessagesInbox();
    } catch (err) {
      conversationMessagesById = {
        ...conversationMessagesById,
        [conversationId]: (conversationMessagesById[conversationId] ?? []).filter(
          (message) => message.id !== optimisticId
        )
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
      throw new ChatSendError();
    }
  }

  async function submitLinkedChatMessage(body: string) {
    if (!activeLinkedChat) {
      return;
    }

    const optimistic = createOptimisticComment(data.viewer.username, body);
    linkedChatOptimisticComments = [...linkedChatOptimisticComments, optimistic];

    registerEntityType(activeLinkedChat.subjectId, linkedChatEntityType(activeLinkedChat.kind));

    try {
      await addComment(
        activeLinkedChat.subjectId,
        body,
        undefined,
        linkedChatEntityType(activeLinkedChat.kind)
      );
    } catch {
      linkedChatOptimisticComments = linkedChatOptimisticComments.filter(
        (comment) => comment.id !== optimistic.id
      );
      throw new ChatSendError();
    }

    try {
      linkedChatComments = (
        await fetchComments(activeLinkedChat.kind, activeLinkedChat.subjectId)
      ).map(mapLinkedChatComment);
      linkedChatOptimisticComments = pruneOptimisticComments(
        linkedChatComments,
        linkedChatOptimisticComments
      );
    } catch {
      // Comment was saved; keep optimistic row until the next refresh succeeds.
    }
  }

  function handleNewComposerKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submitNewConversation();
    }
  }

  function handleRecipientKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && directSuggestions.length === 1) {
      event.preventDefault();
      chooseDirectRecipient(directSuggestions[0].username);
    }
  }

  function handleGroupMemberKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && groupSuggestions.length > 0) {
      event.preventDefault();
      chooseGroupComposerMember(groupSuggestions[0].username);
    }
  }

  function closeActiveChat() {
    activeConversationId = null;
    activeLinkedChatId = null;
    showGroupOptions = false;
    showDirectOptions = false;
    groupSettingsFeedback = '';
    directOptionsFeedback = '';
    syncMessagesShellHeight();

    if (browser) {
      void goto('/messages');
    }
  }

  function selectListTab(tab: 'messages' | 'linked-chats' | 'help-request-chats') {
    activeListTab = tab;
    closeActiveChat();

    if (tab !== 'messages') {
      showComposer = false;
      resetComposer();
    }
  }

  function resetComposer() {
    composerMode = 'direct';
    recipientDraft = '';
    groupTitleDraft = '';
    groupMemberDraft = '';
    selectedGroupMembers = [];
    composerDraft = '';
    composerError = '';
  }

  function toggleComposer() {
    showComposer = !showComposer;
    composerError = '';

    if (!showComposer) {
      resetComposer();
    }
  }

  function handleComposeTrigger() {
    if (activeListTab !== 'messages') {
      activeListTab = 'messages';
      showComposer = true;
      composerError = '';
      contactSearchKey = '';
      void updateContactSuggestions('');
      return;
    }

    if (!showComposer) {
      contactSearchKey = '';
      void updateContactSuggestions('');
    }

    toggleComposer();
  }

  function chooseDirectRecipient(username: string) {
    recipientDraft = username;
    composerError = '';
  }

  function chooseGroupComposerMember(username: string) {
    if (!selectedGroupMembers.includes(username)) {
      selectedGroupMembers = [...selectedGroupMembers, username];
    }

    groupMemberDraft = '';
    composerError = '';
  }

  function removeComposerMember(username: string) {
    selectedGroupMembers = selectedGroupMembers.filter((member) => member !== username);
  }

  async function submitNewConversation() {
    const body = composerDraft.trim();

    if (composerMode === 'direct') {
      const participantUsername =
        normalizedRecipientQuery && directSuggestions.length === 1
          ? directSuggestions[0].username
          : recipientDraft.trim();

      if (!participantUsername || !body) {
        composerError = 'Choose a username and write a message.';
        return;
      }

      const result = await startDirectMessage(participantUsername, body);

      if (!result.ok || !result.conversationId) {
        composerError = result.error ?? 'That username could not be found.';
        return;
      }

      activeConversationId = result.conversationId;
      activeLinkedChatId = null;
    } else {
      const result = await createGroupConversation({
        title: groupTitleDraft,
        memberUsernames: selectedGroupMembers,
        body
      });

      if (!result.ok || !result.conversationId) {
        composerError = result.error ?? 'The group chat could not be created.';
        return;
      }

      activeConversationId = result.conversationId;
      activeLinkedChatId = null;
    }

    showComposer = false;
    resetComposer();
    await invalidateAll();

    if (activeConversationId) {
      await loadConversationMessages(activeConversationId);
    }
  }

  function toggleGroupOptions() {
    showGroupOptions = !showGroupOptions;
    showDirectOptions = false;
    showAddMembers = false;
    showRemoveMembers = false;
    groupMemberDraft = '';
    groupSettingsFeedback = '';
  }

  function toggleDirectOptions() {
    showDirectOptions = !showDirectOptions;
    showGroupOptions = false;
    directOptionsFeedback = '';
  }

  function handleDirectOption(action: 'mute' | 'block') {
    directOptionsFeedback = `${action === 'mute' ? 'Mute' : 'Block'} is not wired yet.`;
  }

  async function saveGroupName() {
    if (!activeConversation || activeConversation.kind !== 'group') {
      return;
    }

    const result = await renameGroupConversation(activeConversation.id, renameDraft);

    groupSettingsTone = result.ok ? 'success' : 'warning';
    groupSettingsFeedback = result.ok ? 'Group name updated.' : result.error ?? 'The group name could not be updated.';

    if (result.ok) {
      await invalidateAll();
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
    groupSettingsFeedback = result.ok ? `${username} joined the group chat.` : result.error ?? 'That member could not be added.';

    if (result.ok) {
      groupMemberDraft = '';
      await invalidateAll();
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
    groupSettingsFeedback = result.ok ? `${username} was removed from the group chat.` : result.error ?? 'That member could not be removed.';

    if (result.ok) {
      await invalidateAll();
      if (activeConversationId) {
        await loadConversationMessages(activeConversationId);
      }
    }
  }
</script>

<svelte:window on:resize={syncMessagesShellHeight} />

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
    class:composer-open={!activeConversation && !activeLinkedChat && showComposer && activeListTab === 'messages'}
    class:conversation-view={!!activeConversation || !!activeLinkedChat}
    class:list-view={!activeConversation && !activeLinkedChat}
    class:with-chat-options={
      !!activeConversation &&
      ((activeConversation.kind === 'group' && showGroupOptions) ||
        (activeConversation.kind === 'direct' && showDirectOptions && !!directConversationPartner))
    }
    class="messages-shell"
  >
    {#if activeConversation || activeLinkedChat}
      <header class="chat-header">
        <button class="back-button" type="button" on:click={closeActiveChat}>Back</button>

        {#if activeConversation}
          <div class="chat-identity">
            {#if activeConversation.kind === 'group'}
              <button
                aria-expanded={showGroupOptions}
                class="identity-trigger"
                type="button"
                on:click={toggleGroupOptions}
              >
                <div>
                  <h2>{activeConversation.title}</h2>
                  <p class="identity-note">Group chat settings</p>
                </div>

                <AvatarBadge size="md" username={activeConversation.title} />
              </button>
            {:else}
              <button
                aria-expanded={showDirectOptions}
                class="identity-trigger"
                type="button"
                on:click={toggleDirectOptions}
              >
                <div>
                  <h2>{activeConversation.title}</h2>
                </div>

                <AvatarBadge
                  size="md"
                  username={activeConversation.title}
                  imageUrl={activeDirectAvatarImageUrl}
                />
              </button>
            {/if}
          </div>
        {:else if activeLinkedChat}
          <div class="chat-identity linked-chat-identity">
            <div>
              <h2>{activeLinkedChat.title}</h2>
              <p class="identity-note">{linkedChatMeta(activeLinkedChat)}</p>
            </div>

            <a class="secondary-button open-source-link" href={activeLinkedChat.href}>Open source page</a>
          </div>
        {/if}
      </header>

      {#if activeConversation?.kind === 'group' && showGroupOptions}
        <section class="group-settings-card in-shell-settings-card">
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
                on:keydown={handleGroupMemberKeydown}
                placeholder="Type a username"
                type="text"
              />
              {#if addableGroupMembers.length > 0}
                <div class="contact-list">
                  {#each addableGroupMembers as member}
                    <button class="contact-chip" type="button" on:click={() => addMemberToGroup(member.username)}>
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
                  <button class="contact-chip" type="button" on:click={() => removeMemberFromGroup(member.username)}>
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
      {:else if activeConversation?.kind === 'direct' && showDirectOptions && directConversationPartner}
        <section class="profile-actions-card in-shell-settings-card">
          <div class="composer-field">
            <span>Conversation actions</span>
            <div class="member-links">
              <a class="member-link" href={`/profile/${directConversationPartner.username}`}>
                Open @{directConversationPartner.username}
              </a>
              <button class="contact-chip" type="button" on:click={() => handleDirectOption('mute')}>
                Mute
              </button>
              <button class="contact-chip" type="button" on:click={() => handleDirectOption('block')}>
                Block
              </button>
            </div>
          </div>

          {#if directOptionsFeedback}
            <p class="composer-feedback">{directOptionsFeedback}</p>
          {/if}
        </section>
      {/if}

      {#if activeConversation}
        <LiveChatPanel
          embedded={true}
          emptyCopy={activeConversationMessagesLoading ? 'Loading messages...' : 'No messages yet.'}
          messages={activeConversationMessages}
          onSubmitMessage={submitConversationMessage}
          placeholder="Write a message..."
          showHeader={false}
          subjectId={activeConversation.id}
          submitLabel="Send"
          variant="message"
        />
      {:else if activeLinkedChat}
        <LiveChatPanel
          comments={linkedChatDiscussion}
          embedded={true}
          emptyCopy={
            linkedChatCommentsLoading
              ? 'Loading messages...'
              : linkedChatEmptyCopy(activeLinkedChat)
          }
          onSubmitMessage={submitLinkedChatMessage}
          placeholder={linkedChatPlaceholder(activeLinkedChat)}
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
            aria-label={tabAriaLabel('Direct and Group', directGroupUnreadTotal)}
            class:active={activeListTab === 'messages'}
            class="surface-tab"
            role="tab"
            type="button"
            on:click={() => selectListTab('messages')}
          >
            <span class="surface-tab-label">Direct & Group</span>
            {#if directGroupUnreadTotal > 0}
              <CountBadge count={directGroupUnreadTotal} />
            {/if}
          </button>
          <button
            aria-label={tabAriaLabel('Project and Event Chats', projectEventUnreadTotal)}
            class:active={activeListTab === 'linked-chats'}
            class="surface-tab"
            role="tab"
            type="button"
            on:click={() => selectListTab('linked-chats')}
          >
            <span class="surface-tab-label">Project & Event Chats</span>
            {#if projectEventUnreadTotal > 0}
              <CountBadge count={projectEventUnreadTotal} />
            {/if}
          </button>
          <button
            aria-label={tabAriaLabel('Help Request Chats', helpRequestUnreadTotal)}
            class:active={activeListTab === 'help-request-chats'}
            class="surface-tab"
            role="tab"
            type="button"
            on:click={() => selectListTab('help-request-chats')}
          >
            <span class="surface-tab-label">Help Request Chats</span>
            {#if helpRequestUnreadTotal > 0}
              <CountBadge count={helpRequestUnreadTotal} />
            {/if}
          </button>
        </div>

        <RoundPlusButton
          active={activeListTab === 'messages' && showComposer}
          ariaLabel="Start a new message"
          action={handleComposeTrigger}
        />
      </div>

      {#if activeListTab === 'messages' && showComposer}
        <section class="new-conversation-card">
          <div class="composer-mode-row">
            <button
              class:active={composerMode === 'direct'}
              class="contact-chip"
              type="button"
              on:click={() => {
                composerMode = 'direct';
                composerError = '';
              }}
            >
              Direct message
            </button>
            <button
              class:active={composerMode === 'group'}
              class="contact-chip"
              type="button"
              on:click={() => {
                composerMode = 'group';
                composerError = '';
              }}
            >
              Group chat
            </button>
          </div>

          {#if composerMode === 'direct'}
            <label class="composer-field">
              <span>To</span>
              <input
                bind:value={recipientDraft}
                list="message-contacts"
                on:keydown={handleRecipientKeydown}
                placeholder="Type a username"
                type="text"
              />
            </label>
          {:else}
            <label class="composer-field">
              <span>Group chat name</span>
              <input bind:value={groupTitleDraft} placeholder="Name this group chat" type="text" />
            </label>

            <label class="composer-field">
              <span>Add members</span>
              <input
                bind:value={groupMemberDraft}
                list="message-contacts"
                on:keydown={handleGroupMemberKeydown}
                placeholder="Type usernames"
                type="text"
              />
            </label>

            {#if selectedGroupMembers.length > 0}
              <div class="selected-members">
                {#each selectedGroupMembers as member}
                  <button class="selected-member-chip" type="button" on:click={() => removeComposerMember(member)}>
                    {member}
                    <span>×</span>
                  </button>
                {/each}
              </div>
            {/if}
          {/if}

          <label class="composer-field grow">
            <span>Message</span>
            <textarea
              bind:value={composerDraft}
              on:keydown={handleNewComposerKeydown}
              placeholder="Write a message..."
              rows="3"
            ></textarea>
          </label>

          <datalist id="message-contacts">
            {#each data.suggestedContacts as contact}
              <option value={contact.username}></option>
            {/each}
          </datalist>

          {#if composerMode === 'direct' && directSuggestions.length > 0}
            <div class="contact-list">
              {#each directSuggestions as contact}
                <button class="contact-chip" type="button" on:click={() => chooseDirectRecipient(contact.username)}>
                  {contact.username}
                </button>
              {/each}
            </div>
          {/if}

          {#if composerMode === 'group' && groupSuggestions.length > 0}
            <div class="contact-list">
              {#each groupSuggestions as contact}
                <button class="contact-chip" type="button" on:click={() => chooseGroupComposerMember(contact.username)}>
                  {contact.username}
                </button>
              {/each}
            </div>
          {/if}

          {#if composerError}
            <p class="composer-feedback">{composerError}</p>
          {/if}

          <div class="composer-actions">
            <button class="secondary-button" type="button" on:click={toggleComposer}>Cancel</button>
            <button class="primary-button" type="button" on:click={submitNewConversation}>Send</button>
          </div>
        </section>
      {/if}

      <div class="conversation-list">
        {#if activeListTab === 'messages'}
          {#if data.conversations.length === 0}
            <div class="empty-state">No messages yet. Start with the + button.</div>
          {:else}
            {#each data.conversations as conversation}
              <button
                class:unread={conversation.unreadCount > 0}
                class="conversation-row"
                type="button"
                on:click={() => openConversation(conversation.id, conversation.unreadCount)}
              >
                <AvatarBadge
                  size="sm"
                  username={conversation.title}
                  imageUrl={directConversationAvatarImage(conversation)}
                />
                <div class="conversation-copy">
                  <div class="conversation-topline">
                    <strong>{conversation.title}</strong>
                    <span class="conversation-time">{formatRelativeTime(conversation.lastMessageAt)}</span>
                  </div>
                    <p class="conversation-preview">{conversation.preview}</p>
                </div>
                {#if conversation.unreadCount > 0}
                  <span class="unread-pill">{conversation.unreadCount}</span>
                {/if}
              </button>
            {/each}
          {/if}
        {:else if activeListTab === 'linked-chats'}
          {#if projectEventLinkedChats.length === 0}
            <div class="empty-state">No project or event chats yet.</div>
          {:else}
            {#each projectEventLinkedChats as chat}
              <button
                class:unread={chat.unreadCount > 0}
                class="conversation-row"
                type="button"
                on:click={() => openLinkedChat(chat.id)}
              >
                <AvatarBadge size="sm" username={chat.title} />
                <div class="conversation-copy">
                  <div class="conversation-topline">
                    <strong>{chat.title}</strong>
                    <span class="conversation-time">{formatRelativeTime(chat.lastMessageAt)}</span>
                  </div>
                  <p class="conversation-preview">{chat.preview}</p>
                </div>
                {#if chat.unreadCount > 0}
                  <span class="unread-pill">{chat.unreadCount}</span>
                {/if}
              </button>
            {/each}
          {/if}
        {:else if helpRequestLinkedChats.length === 0}
          <div class="empty-state">No help request chats yet.</div>
        {:else}
          {#each helpRequestLinkedChats as chat}
            <button
              class:unread={chat.unreadCount > 0}
              class="conversation-row"
              type="button"
              on:click={() => openLinkedChat(chat.id)}
            >
              <AvatarBadge size="sm" username={chat.title} />
              <div class="conversation-copy">
                <div class="conversation-topline">
                  <strong>{chat.title}</strong>
                  <span class="conversation-time">{formatRelativeTime(chat.lastMessageAt)}</span>
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
    {/if}
  </section>
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

  .messages-shell.list-view.composer-open {
    grid-template-rows: auto auto auto minmax(0, 1fr);
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

  .messages-shell.conversation-view.with-chat-options {
    grid-template-rows: auto auto minmax(0, 1fr);
  }

  .chat-header,
  .group-settings-card,
  .profile-actions-card,
  .new-conversation-card {
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

  .chat-identity,
  .conversation-copy,
  .composer-field,
  .new-conversation-card,
  .group-settings-card,
  .profile-actions-card {
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
    display: inline-flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .surface-tab {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 0;
    max-width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
  }

  .surface-tab-label {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

  .identity-trigger:hover h2,
  .identity-trigger:hover .identity-note {
    color: var(--brand-strong);
  }

  .identity-note,
  .conversation-time,
  .composer-field span,
  .empty-state {
    color: var(--text-soft);
    font-size: 12px;
  }

  .composer-field span {
    font-weight: 700;
  }

  .inline-field,
  .contact-list,
  .composer-actions,
  .composer-mode-row,
  .selected-members,
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

  .composer-actions {
    justify-content: flex-end;
  }

  .contact-chip,
  .selected-member-chip,
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
  .selected-member-chip:hover,
  .member-link:hover {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .composer-feedback {
    color: var(--accent-warm-strong);
    font-size: 12px;
    font-weight: 700;
  }

  .composer-feedback.success {
    color: var(--brand-strong);
  }

  .conversation-list,
  .linked-chat-identity {
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
    padding: 0;
    min-height: 0;
  }

  .conversation-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 10px;
    align-items: start;
    min-height: 0;
    width: 100%;
    padding: 10px 12px;
    border: none;
    border-bottom: 1px solid var(--panel-border);
    border-radius: 0;
    background: transparent;
    color: var(--text-main);
    text-align: left;
  }

  .conversation-list > .empty-state {
    padding: 12px;
    border: none;
    border-radius: 0;
    background: var(--panel-strong);
  }

  .conversation-row.unread {
    background: transparent;
    border-left: 3px solid var(--brand);
    padding-left: 9px;
  }

  .conversation-row.unread .conversation-topline strong {
    font-weight: 800;
  }

  .conversation-row.unread .conversation-copy p {
    color: var(--text-main);
  }

  .conversation-row:hover,
  .open-source-link:hover {
    border-color: color-mix(in srgb, var(--brand) 35%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 35%, var(--panel));
  }

  .conversation-row.unread:hover {
    background: color-mix(in srgb, var(--brand-soft) 18%, transparent);
  }

  .conversation-topline {
    display: flex;
    gap: 12px;
    align-items: baseline;
    justify-content: space-between;
  }

  .conversation-topline strong,
  .conversation-time {
    min-width: 0;
    white-space: nowrap;
  }

  .conversation-topline strong {
    overflow: hidden;
    text-overflow: ellipsis;
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

  .in-shell-settings-card,
  .profile-actions-card {
    border-bottom: 1px solid var(--panel-border);
  }

  .unread-pill {
    display: inline-grid;
    place-items: center;
    min-width: 24px;
    height: 24px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--brand-soft);
    color: var(--brand-strong);
    font-size: 11px;
    font-weight: 800;
  }

  textarea,
  input {
    width: 100%;
  }

  textarea {
    min-height: 92px;
    padding: 12px;
    resize: vertical;
  }

  .empty-state {
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-md);
    background: var(--panel-strong);
  }

  .back-button,
  .primary-button,
  .secondary-button {
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
  }

  .back-button,
  .secondary-button {
    background: var(--panel-strong);
    color: var(--text-main);
  }

  .primary-button {
    background: var(--brand-soft);
    color: var(--brand-strong);
    border-color: var(--brand);
  }

  .back-button:hover,
  .secondary-button:hover {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .primary-button:hover {
    background: color-mix(in srgb, var(--brand-soft) 65%, white 10%);
  }

  .open-source-link {
    text-decoration: none;
  }

  @media (max-width: 900px) {
    .chat-header {
      grid-template-columns: auto minmax(0, 1fr);
      gap: 8px;
      align-items: start;
    }

    .chat-identity,
    .linked-chat-identity {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-width: 0;
    }

    .linked-chat-identity {
      grid-template-columns: unset;
    }

    .linked-chat-identity > div {
      min-width: 0;
    }

    .chat-identity :global(.identity-trigger > div) {
      min-width: 0;
    }

    .linked-chat-identity h2,
    .chat-identity h2 {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .open-source-link {
      width: auto;
      flex-shrink: 0;
      padding: 6px 10px;
      font-size: 11px;
      white-space: nowrap;
    }

    .back-button {
      width: auto;
      flex-shrink: 0;
      padding: 6px 10px;
      font-size: 11px;
    }

    .conversation-row,
    .inline-field {
      grid-template-columns: 1fr;
    }

    .inline-field {
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

    .messages-shell.list-view.composer-open .new-conversation-card {
      position: fixed;
      inset: var(--topbar-height) 0 var(--shell-bottom-nav-offset) 0;
      z-index: 20;
      overflow-y: auto;
      border: none;
      padding: 12px 12px calc(12px + var(--shell-safe-bottom));
      background: var(--panel);
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
      display: grid;
      grid-template-columns: 1fr auto;
      padding: 10px;
    }

    .surface-tab-list {
      display: grid;
      grid-template-columns: 1fr;
    }
  }
</style>