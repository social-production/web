<script lang="ts">
  import { tick } from 'svelte';
  import type { DetailMember, ShareTargetResult } from '$lib/types/detail';

  export let buttonLabel = 'Share +';
  export let menuTitle = 'Share';
  export let placeholder = 'Type a username';
  export let submitLabel = 'Share';
  export let createPostLabel = 'Create post';
  export let createPost: (() => void | Promise<void>) | null = null;
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
  let liveContacts: DetailMember[] = [];
  let searchRequestId = 0;
  let buttonEl: HTMLButtonElement | null = null;
  let popoverEl: HTMLDivElement | null = null;
  let popoverStyle = 'visibility:hidden;';

  $: normalizedQuery = query.trim().toLowerCase();
  $: sourceContacts = liveContacts.length > 0 ? liveContacts : contacts;
  $: filteredContacts = normalizedQuery
    ? sourceContacts
        .filter((contact) => contact.username.toLowerCase().includes(normalizedQuery))
        .slice(0, 6)
    : sourceContacts.slice(0, 6);

  async function handleQueryInput() {
    if (!searchContacts) {
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

  async function handleSubmit() {
    const username = query.trim();

    if (!username || pending) {
      return;
    }

    pending = true;
    feedback = '';

    try {
      const result = await submitShare(username);

      if (!result.ok) {
        feedback = result.error ?? 'Unable to send that share.';
        return;
      }

      query = '';
      liveContacts = [];
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

  async function toggleOpen() {
    open = !open;
    feedback = '';
    if (!open) {
      popoverStyle = 'visibility:hidden;';
      return;
    }

    popoverStyle = 'visibility:hidden;';
    void handleQueryInput();
    await tick();
    positionPopover();
  }

  function positionPopover() {
    if (!buttonEl || !popoverEl || typeof window === 'undefined') {
      return;
    }

    const buttonRect = buttonEl.getBoundingClientRect();
    const popoverWidth = Math.min(320, window.innerWidth * 0.76);
    // Measure after forcing the intended width so flips stay accurate.
    popoverEl.style.width = `${popoverWidth}px`;
    const popoverRect = popoverEl.getBoundingClientRect();
    const gap = 8;
    const margin = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const spaceAbove = buttonRect.top - margin;
    const spaceBelow = viewportHeight - buttonRect.bottom - margin;
    const preferUp = spaceAbove >= popoverRect.height || spaceAbove >= spaceBelow;

    let top = preferUp
      ? buttonRect.top - popoverRect.height - gap
      : buttonRect.bottom + gap;

    if (top < margin) {
      top = margin;
    }
    if (top + popoverRect.height > viewportHeight - margin) {
      top = Math.max(margin, viewportHeight - margin - popoverRect.height);
    }

    // Prefer rightward placement: align popover's left edge near the button when possible,
    // otherwise fall back to right-aligned so it stays on-screen.
    let left = buttonRect.left;
    if (left + popoverWidth > viewportWidth - margin) {
      left = buttonRect.right - popoverWidth;
    }
    if (left < margin) {
      left = margin;
    }
    if (left + popoverWidth > viewportWidth - margin) {
      left = Math.max(margin, viewportWidth - margin - popoverWidth);
    }

    popoverStyle = `top:${Math.round(top)}px;left:${Math.round(left)}px;width:${Math.round(popoverWidth)}px;visibility:visible;`;
  }

  function handleWindowChange() {
    if (open) {
      positionPopover();
    }
  }
</script>

<svelte:window on:resize={handleWindowChange} on:scroll={handleWindowChange} />

<div class="share-shell">
  <button
    bind:this={buttonEl}
    aria-expanded={open}
    class:active-toggle={open}
    class="share-button"
    type="button"
    on:click={() => void toggleOpen()}
  >
    {buttonLabel}
  </button>

  {#if open}
    <div
      bind:this={popoverEl}
      class="share-popover"
      style={popoverStyle}
      role="dialog"
      aria-label={menuTitle}
    >
      <div class="share-inline-row">
        <input
          aria-label={menuTitle}
          bind:value={query}
          maxlength="64"
          placeholder={placeholder}
          type="text"
          on:input={handleQueryInput}
          on:keydown={handleKeydown}
        />
        <button class="primary-button" disabled={!query.trim() || pending} type="button" on:click={handleSubmit}>
          {pending ? 'Sending...' : submitLabel}
        </button>
      </div>

      {#if filteredContacts.length > 0}
        <div class="contact-list">
          {#each filteredContacts as contact}
            <button class="contact-chip" type="button" on:click={() => (query = contact.username)}>
              {contact.username}
            </button>
          {/each}
        </div>
      {/if}

      {#if feedback}
        <p class="feedback">{feedback}</p>
      {/if}

      {#if createPost}
        <button class="create-post-link" type="button" on:click={() => void createPost?.()}>
          {createPostLabel}
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .share-shell {
    position: relative;
    display: inline-flex;
  }

  .contact-list,
  .share-inline-row,
  .share-popover {
    display: grid;
    gap: 10px;
  }

  .share-button,
  .primary-button,
  .contact-chip {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
    font: inherit;
    cursor: pointer;
  }

  .share-button,
  .contact-chip {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    color: var(--text-soft);
  }

  .share-button:hover,
  .share-button.active-toggle,
  .contact-chip:hover {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .primary-button {
    border: 1px solid var(--brand);
    background: var(--brand);
    color: var(--page-bg);
  }

  .share-popover {
    position: fixed;
    z-index: 80;
    width: min(320px, 76vw);
    padding: 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    box-shadow: 0 14px 32px color-mix(in srgb, black 22%, transparent);
  }

  .feedback {
    margin: 0;
    line-height: 1.45;
    color: var(--text-soft);
    font-size: 12px;
  }

  .share-inline-row {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }

  .share-inline-row input {
    min-width: 0;
  }

  input {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
    font: inherit;
  }

  .contact-list {
    grid-template-columns: repeat(auto-fit, minmax(104px, 1fr));
  }

  .contact-chip {
    text-align: left;
  }

  .create-post-link {
    justify-self: start;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
    text-decoration: underline;
    cursor: pointer;
  }
</style>
