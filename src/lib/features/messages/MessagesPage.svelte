<script lang="ts">
  import { browser } from '$app/environment';
  import { invalidateAll } from '$app/navigation';
  import LiveChatPanel from '$lib/components/chat/LiveChatPanel.svelte';
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import PageHeader from '$lib/components/shared/PageHeader.svelte';
  import RoundPlusButton from '$lib/components/shared/RoundPlusButton.svelte';
  import { addComment } from '$lib/services/queries/details';
  import { fetchComments } from '$lib/api/drivers/fastapi/domains/content';
  import { registerEntityType, registerCommentIds } from '$lib/api/drivers/fastapi/typeRegistry';
  import {
    addGroupConversationMember,
    createGroupConversation,
    markConversationRead,
    removeGroupConversationMember,
    renameGroupConversation,
    sendMessage,
    startDirectMessage
  } from '$lib/services/queries/inbox';
  import type { MessageLinkedChat, MessagesPageData } from '$lib/types/inbox';
  import type { DetailComment } from '$lib/types/detail';
  import type { VoteDirection } from '$lib/types/feed';
  import { tick } from 'svelte';
  import { formatRelativeTime } from '$lib/utils/time';

  export let data: MessagesPageData;

  let activeConversationId: string | null = null;
  let activeLinkedChatId: string | null = null;
  let activeListTab: 'messages' | 'linked-chats' = 'messages';
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

  $: activeConversation =
    data.conversations.find((conversation) => conversation.id === activeConversationId) ?? null;
  $: activeLinkedChat = data.linkedChats.find((chat) => chat.id === activeLinkedChatId) ?? null;
  $: activeConversationMessages = activeConversation
    ? activeConversation.messages.map((message) => ({
        id: message.id,
        authorUsername: message.sender.username,
        body: message.body,
        createdAt: message.createdAt,
        isOwn: message.isOwn,
        report: message.report ?? null,
        showAuthor: activeConversation.kind === 'group'
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
  $: directSuggestions = data.suggestedContacts.filter((contact) =>
    contact.id !== data.viewer.id &&
    (normalizedRecipientQuery ? contact.username.toLowerCase().includes(normalizedRecipientQuery) : true)
  );
  $: groupSuggestions = data.suggestedContacts.filter((contact) =>
    contact.id !== data.viewer.id &&
    !selectedGroupMembers.includes(contact.username) &&
    (normalizedGroupQuery ? contact.username.toLowerCase().includes(normalizedGroupQuery) : true)
  );
  $: addableGroupMembers =
    activeConversation?.kind === 'group'
      ? data.suggestedContacts.filter(
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

  function linkedChatMeta(chat: MessageLinkedChat) {
    return `${chat.kind === 'project' ? 'Project chat' : 'Event chat'} · ${chat.meta}`;
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
    activeConversationId = conversationId;
    activeLinkedChatId = null;
    showComposer = false;
    composerError = '';
    showGroupOptions = false;
    showDirectOptions = false;
    groupSettingsFeedback = '';
    directOptionsFeedback = '';

    if (unreadCount > 0) {
      await markConversationRead(conversationId);
      await invalidateAll();
    }

    await focusConversationShell();
  }

  async function openLinkedChat(chatId: string) {
    activeLinkedChatId = chatId;
    activeConversationId = null;
    showComposer = false;
    composerError = '';
    showGroupOptions = false;
    showDirectOptions = false;
    groupSettingsFeedback = '';
    directOptionsFeedback = '';

    const chat = data.linkedChats.find(c => c.id === chatId);
    if (chat) {
      registerEntityType(chat.id, chat.kind === 'event' ? 'event' : 'project');
      linkedChatComments = [];
      linkedChatCommentsLoading = true;
      try {
        linkedChatComments = (await fetchComments(chat.kind, chat.subjectId)).map(c => {
          registerEntityType(c.id, 'comment');
          return {
          id: c.id,
          authorUsername: c.author_username || '',
          body: c.body,
          createdAt: c.created_at,
          voteCount: c.vote_count,
          activeVote: (c.active_vote ?? 0) as VoteDirection,
          replies: (c.replies ?? []).map(r => {
            registerEntityType(r.id, 'comment');
            return {
            id: r.id,
            authorUsername: r.author_username || '',
            body: r.body,
            createdAt: r.created_at,
            voteCount: r.vote_count,
            activeVote: (r.active_vote ?? 0) as VoteDirection,
            replies: [],
          }}),
        }});
      } finally {
        linkedChatCommentsLoading = false;
      }
    }

    await focusConversationShell();
  }

  async function submitConversationMessage(body: string) {
    if (!activeConversation) {
      return;
    }

    composerError = '';
    try {
      await sendMessage(activeConversation.id, body);
      await invalidateAll();
    } catch (err) {
      const detail = (err as { body?: { detail?: unknown } }).body?.detail;
      if (typeof detail === 'string') {
        composerError = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        const first = detail[0] as { msg?: string };
        composerError = first.msg ?? 'Could not send message';
      } else {
        composerError = 'Could not send message';
      }
    }
  }

  async function submitLinkedChatMessage(body: string) {
    if (!activeLinkedChat) {
      return;
    }

    await addComment(activeLinkedChat.subjectId, body);
    await invalidateAll();
    if (activeLinkedChat) {
      linkedChatComments = (await fetchComments(activeLinkedChat.kind, activeLinkedChat.subjectId)).map(c => {
        registerEntityType(c.id, 'comment');
        return {
        id: c.id,
        authorUsername: c.author_username || '',
        body: c.body,
        createdAt: c.created_at,
        voteCount: c.vote_count,
        activeVote: (c.active_vote ?? 0) as VoteDirection,
        replies: (c.replies ?? []).map(r => {
          registerEntityType(r.id, 'comment');
          return {
          id: r.id,
          authorUsername: r.author_username || '',
          body: r.body,
          createdAt: r.created_at,
          voteCount: r.vote_count,
          activeVote: (r.active_vote ?? 0) as VoteDirection,
          replies: [],
        }}),
      }});
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
  }

  function selectListTab(tab: 'messages' | 'linked-chats') {
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
      return;
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
    }
  }
</script>

<svelte:window on:resize={syncMessagesShellHeight} />

<section class:conversation-page={!!activeConversation || !!activeLinkedChat} class="page">
  {#if !activeConversation && !activeLinkedChat}
    <PageHeader
      title="Messages"
      description="Direct messages, group chats, and the same project or event chat rooms you already use elsewhere."
    />
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
          emptyCopy="No messages yet."
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
          comments={linkedChatComments}
          embedded={true}
          emptyCopy={activeLinkedChat.kind === 'project' ? 'No project chat yet.' : 'No event chat yet.'}
          onSubmitMessage={submitLinkedChatMessage}
          placeholder={activeLinkedChat.kind === 'project' ? 'Message the project...' : 'Message members...'}
          showHeader={false}
          subjectId={activeLinkedChat.subjectId}
          submitLabel="Send"
        />
      {/if}
    {:else}
      <div class="surface-tabs" role="tablist" aria-label="Messages tabs">
        <div class="surface-tab-list">
          <button
            class:active={activeListTab === 'messages'}
            class="surface-tab"
            role="tab"
            type="button"
            on:click={() => selectListTab('messages')}
          >
            Direct & Group
          </button>
          <button
            class:active={activeListTab === 'linked-chats'}
            class="surface-tab"
            role="tab"
            type="button"
            on:click={() => selectListTab('linked-chats')}
          >
            Project & Event Chats
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
        {:else if data.linkedChats.length === 0}
          <div class="empty-state">No project or event chats yet.</div>
        {:else}
          {#each data.linkedChats as chat}
            <button class="conversation-row" type="button" on:click={() => openLinkedChat(chat.id)}>
              <AvatarBadge size="sm" username={chat.title} />
              <div class="conversation-copy">
                <div class="conversation-topline">
                  <strong>{chat.title}</strong>
                  <span class="conversation-time">{formatRelativeTime(chat.lastMessageAt)}</span>
                </div>
                <p class="conversation-preview">{chat.preview}</p>
              </div>
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
    min-width: 140px;
    padding: 9px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
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
    background: var(--panel-strong);
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
    background: var(--panel-strong);
    border-color: var(--panel-border);
  }

  .conversation-row:hover,
  .open-source-link:hover {
    border-color: color-mix(in srgb, var(--brand) 35%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 35%, var(--panel-strong));
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
      grid-template-columns: 1fr;
    }

    .chat-identity {
      justify-self: stretch;
      text-align: left;
    }

    .conversation-row,
    .inline-field,
    .linked-chat-identity {
      grid-template-columns: 1fr;
    }

    .inline-field {
      display: grid;
    }
  }

  @media (max-width: 760px) {
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