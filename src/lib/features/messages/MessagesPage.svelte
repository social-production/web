<script lang="ts">
  import { browser } from '$app/environment';
  import { invalidateAll } from '$app/navigation';
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import PageHeader from '$lib/components/shared/PageHeader.svelte';
  import RoundPlusButton from '$lib/components/shared/RoundPlusButton.svelte';
  import { tick } from 'svelte';
  import { formatRelativeTime } from '$lib/utils/time';
  import { markMessageThreadRead, sendMessage, startMessageThread } from '$lib/services/queries/inbox';
  import type { MessagesPageData } from '$lib/types/inbox';

  export let data: MessagesPageData;

  let activeThreadId: string | null = null;
  let draftMessage = '';
  let showComposer = false;
  let recipientDraft = '';
  let composerDraft = '';
  let composerError = '';
  let conversationStackElement: HTMLDivElement | null = null;
  let conversationScrollKey = '';

  $: activeThread = data.threads.find((thread) => thread.id === activeThreadId) ?? null;
  $: normalizedRecipientQuery = recipientDraft.trim().toLowerCase();
  $: visibleContacts = data.suggestedContacts.filter((contact) =>
    normalizedRecipientQuery ? contact.username.toLowerCase().includes(normalizedRecipientQuery) : true
  );

  $: nextConversationScrollKey = activeThread ? `${activeThread.id}:${activeThread.messages.length}` : '';

  $: if (browser && nextConversationScrollKey && nextConversationScrollKey !== conversationScrollKey) {
    conversationScrollKey = nextConversationScrollKey;
    tick().then(() => {
      conversationStackElement?.scrollTo({ top: conversationStackElement.scrollHeight, behavior: 'auto' });
    });
  }

  async function openThread(threadId: string, unreadCount: number) {
    activeThreadId = threadId;
    showComposer = false;

    if (unreadCount > 0) {
      await markMessageThreadRead(threadId);
      await invalidateAll();
    }
  }

  async function submitMessage() {
    if (!activeThread || !draftMessage.trim()) {
      return;
    }

    await sendMessage(activeThread.id, draftMessage);
    draftMessage = '';
    await invalidateAll();
  }

  function handleComposerKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
  }

  function closeThread() {
    activeThreadId = null;
  }

  function toggleComposer() {
    showComposer = !showComposer;
    composerError = '';
  }

  function chooseRecipient(username: string) {
    recipientDraft = username;
    composerError = '';
  }

  async function submitNewThread() {
    const participantUsername = recipientDraft.trim();
    const body = composerDraft.trim();

    if (!participantUsername || !body) {
      composerError = 'Enter a username and a message.';
      return;
    }

    const threadId = await startMessageThread(participantUsername, body);

    if (!threadId) {
      composerError = 'That username could not be found.';
      return;
    }

    recipientDraft = '';
    composerDraft = '';
    composerError = '';
    showComposer = false;
    activeThreadId = threadId;
    await invalidateAll();
  }
</script>

<section class="page">
  <PageHeader title="Messages" description="Direct messages across the network. Open a thread to reply." />

  <section class:composer-open={!activeThread && showComposer} class:list-view={!activeThread} class:thread-view={!!activeThread} class="messages-shell">
    {#if activeThread}
      <header class="chat-header">
        <button class="back-button" type="button" on:click={closeThread}>Back</button>
        <div class="chat-identity">
          <div>
            <h2>{activeThread.participant.username}</h2>
          </div>
          <AvatarBadge size="md" username={activeThread.participant.username} />
        </div>
      </header>

      <div bind:this={conversationStackElement} class="conversation-stack">
        {#each activeThread.messages as message}
          <article class="message-row" class:own={message.isOwn}>
            <p class="message-body">{message.body}</p>
            <span class="message-time">{formatRelativeTime(message.createdAt)}</span>
          </article>
        {/each}
      </div>

      <footer class="composer-shell">
        <div class="composer-input-shell">
          <textarea
            id="message-body"
            bind:value={draftMessage}
            placeholder="Write a message..."
            rows="3"
            on:keydown={handleComposerKeydown}
          ></textarea>
          <button class="primary-button" type="button" on:click={submitMessage}>Send</button>
        </div>
      </footer>
    {:else}
      <header class="list-header">
        <p>Choose a conversation to continue.</p>
        <RoundPlusButton active={showComposer} ariaLabel="Start a new message" action={toggleComposer} />
      </header>

      {#if showComposer}
        <section class="new-thread-card">
          <label class="composer-field">
            <span>To</span>
            <input bind:value={recipientDraft} list="message-contacts" placeholder="Type a username" type="text" />
            <datalist id="message-contacts">
              {#each data.suggestedContacts as contact}
                <option value={contact.username}></option>
              {/each}
            </datalist>
          </label>

          <label class="composer-field grow">
            <span>Message</span>
            <textarea bind:value={composerDraft} placeholder="Write a message..." rows="3"></textarea>
          </label>

          {#if visibleContacts.length > 0}
            <div class="contact-list">
              {#each visibleContacts as contact}
                <button class="contact-chip" type="button" on:click={() => chooseRecipient(contact.username)}>
                  {contact.username}
                </button>
              {/each}
            </div>
          {/if}

          {#if composerError}
            <p class="composer-error">{composerError}</p>
          {/if}

          <div class="composer-actions">
            <button class="secondary-button" type="button" on:click={toggleComposer}>Cancel</button>
            <button class="primary-button" type="button" on:click={submitNewThread}>Send</button>
          </div>
        </section>
      {/if}

      <div class="thread-list">
        {#each data.threads as thread}
          <button class:unread={thread.unreadCount > 0} class="thread-row" type="button" on:click={() => openThread(thread.id, thread.unreadCount)}>
            <AvatarBadge size="md" username={thread.participant.username} />
            <div class="thread-copy">
              <strong>{thread.participant.username}</strong>
              <p>{thread.preview}</p>
              <span class="thread-time">{formatRelativeTime(thread.lastMessageAt)}</span>
            </div>
            {#if thread.unreadCount > 0}
              <span class="unread-pill">{thread.unreadCount}</span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </section>
</section>

<style>
  .page {
    display: grid;
    gap: 12px;
    height: calc(100vh - var(--topbar-height, 56px) - 52px);
    min-height: 0;
    grid-template-rows: auto minmax(0, 1fr);
  }

  .messages-shell {
    border: 1px solid var(--panel-border);
    border-radius: 0;
    overflow: hidden;
    background: var(--panel);
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    height: 100%;
    min-height: 0;
  }

  .messages-shell.list-view {
    grid-template-rows: auto minmax(0, 1fr);
  }

  .messages-shell.list-view.composer-open {
    grid-template-rows: auto auto minmax(0, 1fr);
  }

  .chat-header,
  .list-header {
    padding: 14px 16px;
    background: color-mix(in srgb, var(--panel-strong) 38%, var(--panel));
  }

  .chat-header {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 12px;
    align-items: center;
  }

  .chat-identity,
  .thread-copy,
  .composer-field,
  .composer-input-shell {
    display: grid;
    gap: 4px;
  }

  .list-header {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }

  .chat-identity {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    justify-self: end;
    text-align: right;
  }

  .thread-list,
  .conversation-stack {
    overflow-y: auto;
    display: grid;
    align-content: start;
    gap: 8px;
    padding: 12px;
    min-height: 0;
  }

  .new-thread-card {
    display: grid;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--panel-border);
    background: color-mix(in srgb, var(--panel-strong) 22%, var(--panel));
  }

  .composer-field span {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .composer-field.grow textarea {
    min-height: 84px;
  }

  .contact-list,
  .composer-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .composer-actions {
    justify-content: flex-end;
  }

  .contact-chip {
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .contact-chip:hover {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .composer-error {
    color: var(--accent-warm-strong);
    font-size: 12px;
    font-weight: 700;
  }

  .thread-row,
  .message-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-md);
    background: var(--panel-strong);
    color: var(--text-main);
    text-align: left;
  }

  .thread-row.unread {
    background: color-mix(in srgb, var(--brand-soft) 40%, var(--panel-strong));
  }

  .thread-row:hover,
  .message-row:hover {
    border-color: color-mix(in srgb, var(--brand) 35%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 35%, var(--panel-strong));
  }

  .message-row {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: 10px;
    padding: 8px 0;
    border: none;
    border-radius: 0;
    background: transparent;
  }

  .message-row.own {
    justify-items: end;
  }

  .message-body {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.45;
  }

  .message-time {
    color: var(--text-soft);
    font-size: 11px;
    line-height: 1.2;
    white-space: nowrap;
    align-self: end;
  }

  .thread-copy {
    display: grid;
    gap: 3px;
    position: relative;
    padding-right: 44px;
  }

  .thread-copy p {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .thread-time {
    position: absolute;
    right: 0;
    bottom: 0;
    font-size: 11px;
    color: var(--text-soft);
  }

  .unread-pill {
    min-width: 22px;
    height: 22px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    font-size: 11px;
    font-weight: 800;
    color: var(--brand-strong);
    border: 1px solid var(--brand);
    background: var(--brand-soft);
  }

  .composer-shell {
    padding: 0 12px 12px;
    background: var(--panel);
  }

  textarea {
    width: 100%;
    min-height: 92px;
    padding: 12px 90px 12px 12px;
    resize: vertical;
  }

  .composer-input-shell {
    position: relative;
  }

  h2,
  .back-button {
    color: var(--text-main);
  }

  h2 {
    font-size: 18px;
  }

  p,
  span {
    color: var(--text-soft);
    line-height: 1.45;
  }

  .back-button {
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    font-size: 12px;
    font-weight: 700;
  }

  .back-button:hover {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .primary-button {
    position: absolute;
    right: 10px;
    bottom: 10px;
  }

  @media (max-width: 760px) {
    .messages-shell {
      height: 100%;
    }

    .list-header {
      align-items: flex-start;
    }

    .page {
      height: calc(100vh - var(--topbar-height, 56px) - 40px);
    }
  }
</style>
