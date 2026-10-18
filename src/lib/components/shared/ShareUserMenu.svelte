<script lang="ts">
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import PlatformMark from '$lib/components/shared/PlatformMark.svelte';
  import type { DetailMember, ShareTargetResult } from '$lib/types/detail';
  import { canUseNativeShare, shareLink, shareTargets } from '$lib/utils/share';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { showToast } from '$lib/stores/toast';

  let nativeShare = false;
  onMount(() => {
    nativeShare = canUseNativeShare();
  });

  function outsideTitle() {
    return shareTitle ?? (typeof document !== 'undefined' ? document.title : '');
  }

  export let buttonLabel = 'Share +';
  export let menuTitle = 'Share';
  export let placeholder = 'Type a username';
  export let submitLabel = 'Send';
  /** What the people you pick receive, shown under the search box. */
  export let recipientHint = 'They get it as a message and a notification.';
  /** First word of the confirmation toast ("Sent to 2 people", "Invited 2 people"). */
  export let sentVerb = 'Sent to';
  export let createPostLabel = 'Create post';
  export let createPost: (() => void | Promise<void>) | null = null;
  export let copyLinkUrl: string | null = null;
  /** Title passed to the device share sheet and share links; defaults to the page title. */
  export let shareTitle: string | null = null;
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
  // Before anyone types, offer people you already know: this page's contacts, else your usual ones.
  $: suggestions =
    contacts.length > 0
      ? contacts
      : (($page.data.bootstrap?.suggestedContacts ?? []) as DetailMember[]);
  $: selectedNames = new Set(selected.map((person) => person.username));
  $: sourceContacts = liveContacts.length > 0 ? liveContacts : contacts;
  $: filteredContacts = searchNeedle
    ? sourceContacts
        .filter((contact) => contact.username.toLowerCase().includes(searchNeedle))
        .slice(0, 8)
    : suggestions.slice(0, 5);

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
      showToast(
        selected.length === 1 ? `${sentVerb} ${selected[0].username}` : `${sentVerb} ${selected.length} people`
      );
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
    aria-label={menuTitle || buttonLabel}
    class:active-toggle={open}
    class="share-button"
    type="button"
    on:click={() => (open ? handleClose() : (open = true))}
  >
    <PlatformMark size={32} />
  </button>

  <OverlaySheet {open} labelledById="share-sheet-title" title={menuTitle} on:close={handleClose}>
    <svelte:fragment slot="toolbar">
      {#if copyLinkUrl}
        <section class="share-out" aria-label="Share outside the app">
          {#if outsideTitle()}
            <p class="share-subject">{outsideTitle()}</p>
          {/if}
          <div class="out-actions">
            {#if nativeShare}
              <button
                class="out-button primary"
                type="button"
                on:click={() => void shareLink({ url: copyLinkUrl ?? '', title: outsideTitle() })}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
                Share via…
              </button>
            {/if}
            <button
              class="out-button"
              class:copied={copyLabel === 'Copied'}
              type="button"
              title={copyLinkUrl}
              on:click={() => void handleCopyLink()}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
              {copyLabel}
            </button>
          </div>
          {#if !nativeShare}
          <div class="share-out-row">
            {#each shareTargets({ url: copyLinkUrl, title: outsideTitle() }) as target (target.id)}
              <a
                class="share-tile"
                href={target.href}
                target="_blank"
                rel="noopener noreferrer"
                title={`Share on ${target.label}`}
                aria-label={`Share on ${target.label}`}
              >
                <span class={`tile-icon ${target.id}`} aria-hidden="true">
                  {#if target.id === 'whatsapp'}
                    <svg viewBox="0 0 24 24" width="20" height="20"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" /><path d="M9 9.5c.3 2 2 3.8 4.2 4.4l1-1.1 1.8.8c-.2 1-1 1.6-2 1.5A6 6 0 0 1 8.4 10c-.1-1 .5-1.8 1.5-2l.8 1.8-1 .9" fill="currentColor" /></svg>
                  {:else if target.id === 'telegram'}
                    <svg viewBox="0 0 24 24" width="20" height="20"><path d="M21 4L3 11l6 2 2 6 3-4 5 4 2-15zM9 13l9-6-7 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" /></svg>
                  {:else if target.id === 'email'}
                    <svg viewBox="0 0 24 24" width="20" height="20"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2" /><path d="M3 7l9 6 9-6" fill="none" stroke="currentColor" stroke-width="2" /></svg>
                  {:else if target.id === 'x'}
                    <svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 4l14 16M19 4L5 20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" /></svg>
                  {:else}
                    <svg viewBox="0 0 24 24" width="20" height="20"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z" fill="currentColor" /></svg>
                  {/if}
                </span>
              </a>
            {/each}
          </div>
          {/if}
        </section>
      {/if}
      <div class="share-search">
        <span class="share-out-label">Send to people here</span>
        <label class="search-box" for="share-people-search">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2" /><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
          <span class="sr-only">{menuTitle}</span>
          <input
            id="share-people-search"
            bind:value={query}
            maxlength="64"
            placeholder={placeholder}
            type="search"
            autocomplete="off"
            on:input={handleQueryInput}
            on:keydown={handleKeydown}
          />
        </label>
      </div>
    </svelte:fragment>

    {#if selected.length > 0}
      <div class="selected-row" aria-label="Selected recipients">
        {#each selected as person}
          <button class="selected-chip" type="button" on:click={() => toggleRecipient(person)}>
            <AvatarBadge size="sm" username={person.username} imageUrl={person.profileImageUrl ?? null} />
            <span>{person.username}</span>
            <span class="chip-remove" aria-label={`Remove ${person.username}`}>×</span>
          </button>
        {/each}
      </div>
    {/if}

    {#if filteredContacts.length > 0}
      {#if !searchNeedle}
        <p class="list-label">Suggested</p>
      {/if}
      <div class="contact-list">
        {#each filteredContacts as contact}
          <button
            class:selected={selectedNames.has(contact.username)}
            class="contact-row"
            type="button"
            aria-pressed={selectedNames.has(contact.username)}
            on:click={() => toggleRecipient(contact)}
          >
            <AvatarBadge size="sm" username={contact.username} imageUrl={contact.profileImageUrl ?? null} />
            <span class="contact-name">{contact.username}</span>
            <span class="check" aria-hidden="true">
              {#if selectedNames.has(contact.username)}
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 12l5 5 9-10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>
              {/if}
            </span>
          </button>
        {/each}
      </div>
    {:else if searchNeedle}
      <p class="empty-row">No one matches “{query.trim()}”.</p>
    {:else if selected.length === 0}
      <p class="empty-row">Search for people by username. {recipientHint}</p>
    {/if}

    {#if feedback}
      <p class="feedback">{feedback}</p>
    {/if}

    <svelte:fragment slot="footer">
      <div class="sheet-actions">
        {#if createPost}
          <button class="sheet-cancel" type="button" on:click={() => void createPost?.()}>
            {createPostLabel}
          </button>
        {/if}
        <button
          class="sheet-submit"
          disabled={selected.length === 0 || pending}
          type="button"
          on:click={handleSubmit}
        >
          {pending ? 'Sending…' : selected.length > 1 ? `${submitLabel} to ${selected.length}` : submitLabel}
        </button>
      </div>
    </svelte:fragment>
  </OverlaySheet>
</div>

<style>
  .share-out {
    display: grid;
    gap: 12px;
    padding: 4px 16px 16px;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 70%, transparent);
  }

  .share-subject {
    margin: 0;
    overflow: hidden;
    color: var(--text-main);
    font-size: 15px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }





  .share-out-label {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .out-actions {
    display: flex;
    gap: 8px;
  }

  .out-button {
    display: inline-flex;
    flex: 1 1 0;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 40px;
    padding: 0 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .out-button:hover {
    border-color: color-mix(in srgb, var(--brand) 45%, var(--panel-border));
  }

  .out-button.primary {
    border-color: var(--brand);
    background: var(--brand);
    color: var(--on-brand, #fff);
  }

  .out-button.copied {
    border-color: var(--brand);
    color: var(--brand-strong);
  }

  .list-label {
    margin: 4px 16px 0;
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .share-out-row {
    display: flex;
    justify-content: center;
    gap: 14px;
  }

  .share-tile {
    display: grid;
    place-items: center;
    padding: 2px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--text-main);
    font: inherit;
    text-decoration: none;
    cursor: pointer;
  }

  .share-tile:hover,
  .share-tile:focus-visible {
    background: var(--brand-soft);
  }

  .tile-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--panel-strong);
    color: var(--text-main);
  }

  .tile-icon.whatsapp {
    background: #25d366;
    color: #fff;
  }

  .tile-icon.telegram {
    background: #2aabee;
    color: #fff;
  }

  .tile-icon.x {
    background: #111;
    color: #fff;
  }

  .tile-icon.facebook {
    background: #1877f2;
    color: #fff;
  }

  .tile-icon.email {
    background: var(--brand-soft);
    color: var(--brand-strong);
  }


  .share-shell {
    display: flex;
    min-width: 0;
  }

  .share-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--text-main);
    cursor: pointer;
  }

  .share-button:hover,
  .share-button.active-toggle {
    background: var(--brand-soft);
    color: var(--text-main);
  }

  .share-search {
    display: grid;
    gap: 8px;
    padding: 14px 16px 10px;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 42px;
    padding: 0 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-soft);
  }

  .search-box:focus-within {
    border-color: var(--brand);
  }

  .search-box input {
    flex: 1 1 auto;
    min-width: 0;
    border: 0;
    outline: none;
    background: transparent;
    color: var(--text-main);
    font: inherit;
  }

  .contact-list {
    display: grid;
    padding: 0 8px;
  }

  .contact-row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 48px;
    padding: 6px 8px;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-main);
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    text-align: left;
    cursor: pointer;
  }

  .contact-row:hover {
    background: var(--panel-strong);
  }

  .contact-row.selected {
    background: color-mix(in srgb, var(--brand-soft) 70%, transparent);
  }

  .contact-name {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .check {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border: 2px solid var(--panel-border);
    border-radius: 50%;
    color: #fff;
  }

  .contact-row.selected .check {
    border-color: var(--brand);
    background: var(--brand);
  }

  .selected-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 0 16px 10px;
  }

  .selected-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    padding: 3px 10px 3px 3px;
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

  .empty-row,
  .feedback {
    margin: 0;
    padding: 4px 16px 16px;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.4;
  }

  .feedback {
    color: var(--danger, #c0392b);
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
