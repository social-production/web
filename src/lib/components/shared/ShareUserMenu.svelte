<script lang="ts">
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import type { DetailMember, ShareTargetResult } from '$lib/types/detail';

  export let buttonLabel = 'Share +';
  export let menuTitle = 'Share';
  export let placeholder = 'Type a username';
  export let submitLabel = 'Share';
  export let createPostLabel = 'Create post';
  export let createPost: (() => void | Promise<void>) | null = null;
  export let copyLinkUrl: string | null = null;
  export let contacts: DetailMember[] = [];
  export let searchContacts: ((query: string) => Promise<DetailMember[]>) | null = null;
  export let submitShare: (username: string) => Promise<ShareTargetResult> = async () => ({
    ok: false,
    error: 'Sharing is unavailable.'
  });

  let open = false;
  let query = '';
  let pending = false;
  let feedback = '';
  let copyLabel = 'Copy link';
  let copyTimer: ReturnType<typeof setTimeout> | null = null;
  let selected: DetailMember[] = [];
  let liveContacts: DetailMember[] = [];
  let searchRequestId = 0;

  $: searchNeedle = query.trim().toLowerCase();
  $: sourceContacts = liveContacts.length > 0 ? liveContacts : contacts;
  $: filteredContacts = searchNeedle
    ? sourceContacts
        .filter((contact) => contact.username.toLowerCase().includes(searchNeedle))
        .slice(0, 8)
    : [];

  async function handleQueryInput() {
    if (!searchContacts || !query.trim()) {
      liveContacts = [];
      return;
    }

    const requestId = ++searchRequestId;
    const nextQuery = query.trim();
    try {
      const results = await searchContacts(nextQuery);
      if (requestId === searchRequestId) {
        liveContacts = results;
      }
    } catch {
      if (requestId === searchRequestId) {
        liveContacts = [];
      }
    }
  }

  function toggleRecipient(contact: DetailMember) {
    if (selected.some((person) => person.username === contact.username)) {
      selected = selected.filter((person) => person.username !== contact.username);
      return;
    }
    selected = [...selected, contact];
  }

  function isSelected(username: string) {
    return selected.some((person) => person.username === username);
  }

  async function handleSubmit() {
    if (selected.length === 0 || pending) {
      return;
    }

    pending = true;
    feedback = '';
    try {
      for (const person of selected) {
        const result = await submitShare(person.username);
        if (!result.ok) {
          feedback = result.error ?? `Unable to share with ${person.username}.`;
          return;
        }
      }
      query = '';
      liveContacts = [];
      selected = [];
      open = false;
    } finally {
      pending = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleSubmit();
    }
  }

  async function handleCopyLink() {
    if (!copyLinkUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(copyLinkUrl);
      copyLabel = 'Copied';
    } catch {
      copyLabel = 'Copy failed';
    }
    if (copyTimer) {
      clearTimeout(copyTimer);
    }
    copyTimer = setTimeout(() => {
      copyLabel = 'Copy link';
      copyTimer = null;
    }, 1600);
  }

  function handleClose() {
    open = false;
    feedback = '';
    query = '';
    liveContacts = [];
    selected = [];
    copyLabel = 'Copy link';
  }
</script>

<div class="share-shell">
  <button
    aria-expanded={open}
    class:active-toggle={open}
    class="share-button"
    type="button"
    on:click={() => (open ? handleClose() : (open = true))}
  >
    {buttonLabel}
  </button>

  <OverlaySheet {open} labelledById="share-sheet-title" title={menuTitle} on:close={handleClose}>
    <svelte:fragment slot="toolbar">
      <div class="share-search">
        <label class="sr-only" for="share-people-search">{menuTitle}</label>
        <input
          id="share-people-search"
          bind:value={query}
          maxlength="64"
          placeholder={placeholder}
          type="search"
          on:input={handleQueryInput}
          on:keydown={handleKeydown}
        />
      </div>
    </svelte:fragment>

    {#if selected.length > 0}
      <div class="selected-row" aria-label="Selected recipients">
        {#each selected as person}
          <button class="selected-chip" type="button" on:click={() => toggleRecipient(person)}>
            <AvatarBadge size="sm" username={person.username} imageUrl={person.profileImageUrl ?? null} />
            <span>{person.username}</span>
            <span class="chip-remove" aria-hidden="true">×</span>
          </button>
        {/each}
      </div>
    {/if}

    {#if searchNeedle && filteredContacts.length > 0}
      <div class="contact-list">
        {#each filteredContacts as contact}
          <button
            class:selected={isSelected(contact.username)}
            class="contact-row"
            type="button"
            on:click={() => toggleRecipient(contact)}
          >
            <AvatarBadge size="sm" username={contact.username} imageUrl={contact.profileImageUrl ?? null} />
            <span>{contact.username}</span>
            {#if isSelected(contact.username)}
              <span class="selected-mark">Selected</span>
            {/if}
          </button>
        {/each}
      </div>
    {:else if searchNeedle}
      <p class="empty-row">No matches.</p>
    {/if}

    {#if feedback}
      <p class="feedback">{feedback}</p>
    {/if}

    <div class="share-actions">
      <button class="primary-button" disabled={selected.length === 0 || pending} type="button" on:click={handleSubmit}>
        {pending ? 'Sending...' : selected.length > 1 ? `Share with ${selected.length}` : submitLabel}
      </button>
      {#if createPost}
        <button class="text-action" type="button" on:click={() => void createPost?.()}>
          {createPostLabel}
        </button>
      {/if}
      {#if copyLinkUrl}
        <button class="text-action" type="button" on:click={() => void handleCopyLink()}>
          {copyLabel}
        </button>
      {/if}
    </div>
  </OverlaySheet>
</div>

<style>
  .share-shell {
    display: inline-flex;
  }

  .share-button,
  .primary-button {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
    font: inherit;
    cursor: pointer;
  }

  .share-button {
    border: 1px solid var(--panel-border);
    background: var(--panel-strong);
    color: var(--text-main);
  }

  .share-button:hover,
  .share-button.active-toggle {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .primary-button {
    border: 1px solid transparent;
    background: var(--brand);
    color: var(--on-brand);
  }

  .primary-button:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .share-search {
    padding: 10px 16px 8px;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 70%, transparent);
  }

  .share-search input {
    width: 100%;
    min-height: 40px;
    padding: 0 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-main);
  }

  .contact-list {
    display: grid;
    gap: 0;
  }

  .contact-row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 48px;
    padding: 8px 16px;
    border: 0;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 75%, transparent);
    background: transparent;
    color: var(--text-main);
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    text-align: left;
    cursor: pointer;
  }

  .contact-row.selected {
    background: color-mix(in srgb, var(--brand-soft) 70%, transparent);
  }

  .selected-mark {
    margin-left: auto;
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
  }

  .selected-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 16px;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 70%, transparent);
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

  .contact-row span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .empty-row,
  .feedback {
    margin: 0;
    padding: 16px;
    color: var(--text-soft);
    font-size: 13px;
  }

  .share-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 16px;
    align-items: center;
    padding: 12px 16px 4px;
  }

  .text-action {
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
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
