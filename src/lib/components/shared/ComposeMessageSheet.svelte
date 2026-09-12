<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { createEventDispatcher } from 'svelte';
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import SuggestionList from '$lib/components/shared/SuggestionList.svelte';
  import { createGroupConversation, startDirectMessage } from '$lib/services/commands/inbox';
  import { getMessageContacts } from '$lib/services/queries/inbox';
  import type { ViewerSummary } from '$lib/types/bootstrap';

  export let open = false;
  export let prefillUsername: string | null = null;
  export let labelledById = 'compose-message-sheet-title';

  const dispatch = createEventDispatcher<{ close: void; sent: { conversationId: string } }>();

  let composerMode: 'direct' | 'group' = 'direct';
  let recipientDraft = '';
  let groupTitleDraft = '';
  let groupMemberDraft = '';
  let selectedGroupMembers: string[] = [];
  let composerDraft = '';
  let composerError = '';
  let submitting = false;
  let contactSuggestions: ViewerSummary[] = [];
  let contactSearchKey = '';
  let contactSearchRequestId = 0;
  let wasOpen = false;

  $: viewerId = $page.data.bootstrap?.viewer?.id ?? null;
  $: normalizedRecipientQuery = recipientDraft.trim().toLowerCase();
  $: normalizedGroupQuery = groupMemberDraft.trim().toLowerCase();
  $: activeContactQuery = composerMode === 'direct' ? recipientDraft : groupMemberDraft;
  $: directSuggestions = contactSuggestions.filter(
    (contact) =>
      contact.id !== viewerId &&
      (normalizedRecipientQuery
        ? contact.username.toLowerCase().includes(normalizedRecipientQuery)
        : true)
  );
  $: groupSuggestions = contactSuggestions.filter(
    (contact) =>
      contact.id !== viewerId &&
      !selectedGroupMembers.includes(contact.username) &&
      (normalizedGroupQuery ? contact.username.toLowerCase().includes(normalizedGroupQuery) : true)
  );
  $: directSuggestionItems = directSuggestions.map((contact) => ({
    key: contact.username,
    label: contact.username,
    imageUrl: contact.profileImageUrl ?? null
  }));
  $: groupSuggestionItems = groupSuggestions.map((contact) => ({
    key: contact.username,
    label: contact.username,
    imageUrl: contact.profileImageUrl ?? null
  }));

  $: if (open !== wasOpen) {
    wasOpen = open;
    resetComposer();

    if (open && prefillUsername) {
      composerMode = 'direct';
      recipientDraft = prefillUsername;
    }
  }

  $: if (browser && open) {
    void updateContactSuggestions(activeContactQuery);
  }

  function resetComposer() {
    composerMode = 'direct';
    recipientDraft = '';
    groupTitleDraft = '';
    groupMemberDraft = '';
    selectedGroupMembers = [];
    composerDraft = '';
    composerError = '';
    submitting = false;
    contactSuggestions = [];
    contactSearchKey = '';
  }

  function handleClose() {
    open = false;
    dispatch('close');
  }

  async function updateContactSuggestions(query: string) {
    const normalized = query.trim();
    const lookupKey = `${composerMode}:${normalized}`;

    if (lookupKey === contactSearchKey) {
      return;
    }

    contactSearchKey = lookupKey;

    if (!normalized) {
      contactSuggestions = [];
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

  function handleNewComposerKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submitNewConversation();
    }
  }

  async function submitNewConversation() {
    if (submitting) {
      return;
    }

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

      submitting = true;
      composerError = '';

      const result = await startDirectMessage(participantUsername, body);

      if (!result.ok || !result.conversationId) {
        submitting = false;
        composerError = result.error ?? 'That username could not be found.';
        return;
      }

      open = false;
      dispatch('sent', { conversationId: result.conversationId });
      return;
    }

    if (!body) {
      composerError = 'Write a message.';
      return;
    }

    submitting = true;
    composerError = '';

    const result = await createGroupConversation({
      title: groupTitleDraft,
      memberUsernames: selectedGroupMembers,
      body
    });

    if (!result.ok || !result.conversationId) {
      submitting = false;
      composerError = result.error ?? 'The group chat could not be created.';
      return;
    }

    open = false;
    dispatch('sent', { conversationId: result.conversationId });
  }
</script>

<OverlaySheet bind:open {labelledById} title="New message" on:close={handleClose}>
  <div class="compose-form">
    <div class="composer-mode-row" role="tablist" aria-label="Message type">
      <button
        aria-selected={composerMode === 'direct'}
        class:active={composerMode === 'direct'}
        class="composer-mode"
        role="tab"
        type="button"
        on:click={() => {
          composerMode = 'direct';
          composerError = '';
        }}
      >
        Direct
      </button>
      <button
        aria-selected={composerMode === 'group'}
        class:active={composerMode === 'group'}
        class="composer-mode"
        role="tab"
        type="button"
        on:click={() => {
          composerMode = 'group';
          composerError = '';
        }}
      >
        Group
      </button>
    </div>

    {#if composerMode === 'direct'}
      <div class="composer-field">
        <label>
          <span class="sr-only">To</span>
          <input
            bind:value={recipientDraft}
            on:keydown={handleRecipientKeydown}
            placeholder="Username"
            type="text"
          />
        </label>
        <SuggestionList
          items={directSuggestionItems}
          query={recipientDraft}
          showAvatars
          on:select={(event) => chooseDirectRecipient(event.detail.key)}
        />
      </div>
    {:else}
      <label class="composer-field">
        <span class="sr-only">Group chat name</span>
        <input bind:value={groupTitleDraft} placeholder="Group name" type="text" />
      </label>

      <div class="composer-field">
        <label>
          <span class="sr-only">Add members</span>
          <input
            bind:value={groupMemberDraft}
            on:keydown={handleGroupMemberKeydown}
            placeholder="Add members"
            type="text"
          />
        </label>
        {#if selectedGroupMembers.length > 0}
          <div class="selected-row" aria-label="Selected members">
            {#each selectedGroupMembers as member}
              <button class="selected-chip" type="button" on:click={() => removeComposerMember(member)}>
                <AvatarBadge size="sm" username={member} />
                <span>{member}</span>
                <span class="chip-remove" aria-hidden="true">×</span>
              </button>
            {/each}
          </div>
        {/if}
        <SuggestionList
          items={groupSuggestionItems}
          query={groupMemberDraft}
          showAvatars
          on:select={(event) => chooseGroupComposerMember(event.detail.key)}
        />
      </div>
    {/if}

    <label class="composer-field grow">
      <span class="sr-only">Message</span>
      <textarea
        bind:value={composerDraft}
        on:keydown={handleNewComposerKeydown}
        placeholder="Write a message…"
        rows="4"
      ></textarea>
    </label>

    {#if composerError}
      <p class="composer-feedback">{composerError}</p>
    {/if}

    <div class="composer-actions">
      <button class="primary-button" disabled={submitting} type="button" on:click={submitNewConversation}>
        {submitting ? 'Sending…' : 'Send'}
      </button>
    </div>
  </div>
</OverlaySheet>

<style>
  .compose-form {
    display: grid;
    gap: 10px;
    padding: 4px 16px 8px;
  }

  .composer-mode-row,
  .composer-actions,
  .selected-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .composer-mode-row {
    gap: 0;
    padding: 0;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 70%, transparent);
  }

  .composer-mode {
    flex: 0 0 auto;
    padding: 6px 2px 8px;
    margin-right: 14px;
    border: none;
    border-bottom: 2px solid transparent;
    border-radius: 0;
    background: transparent;
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .composer-mode.active {
    border-bottom-color: var(--brand);
    color: var(--text-main);
    background: transparent;
  }

  .composer-field {
    display: grid;
    gap: 8px;
  }

  .composer-field label,
  .composer-field input,
  .composer-field textarea {
    width: 100%;
  }

  .composer-field input,
  .composer-field textarea {
    box-sizing: border-box;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-main);
  }

  .composer-field input {
    padding: 10px 12px;
  }

  .composer-field textarea {
    min-height: 96px;
    padding: 10px 12px;
    resize: vertical;
  }

  .selected-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px 4px 4px;
    border: 1px solid var(--brand);
    border-radius: 999px;
    background: var(--brand-soft);
    color: var(--text-main);
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }

  .chip-remove {
    color: var(--text-soft);
    font-size: 16px;
    line-height: 1;
  }

  .composer-feedback {
    margin: 0;
    color: var(--accent-warm-strong);
    font-size: 12px;
    font-weight: 700;
  }

  .composer-actions {
    justify-content: flex-end;
  }

  .primary-button {
    padding: 8px 12px;
    border: 1px solid var(--brand);
    border-radius: var(--radius-sm);
    background: var(--brand-soft);
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .primary-button:hover:not(:disabled) {
    background: color-mix(in srgb, var(--brand-soft) 65%, white 10%);
  }

  .primary-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
