<script lang="ts">
  import type { DetailMember, ShareTargetResult } from '$lib/types/detail';

  export let buttonLabel = 'Share +';
  export let menuTitle = 'Share';
  export let placeholder = 'Type a username';
  export let submitLabel = 'Share';
  export let createPostLabel = 'Create post';
  export let createPost: (() => void | Promise<void>) | null = null;
  export let contacts: DetailMember[] = [];
  export let submitShare: (username: string) => Promise<ShareTargetResult> = async () => ({
    ok: false,
    error: 'Sharing is unavailable.'
  });

  let open = false;
  let query = '';
  let pending = false;
  let feedback = '';

  $: normalizedQuery = query.trim().toLowerCase();
  $: filteredContacts = contacts
    .filter((contact) => contact.username.toLowerCase().includes(normalizedQuery))
    .slice(0, 6);

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

</script>

<div class="share-shell">
  <button
    aria-expanded={open}
    class:active-toggle={open}
    class="share-button"
    type="button"
    on:click={() => {
      open = !open;
      feedback = '';
    }}
  >
    {buttonLabel}
  </button>

  {#if open}
    <div class="share-popover">
      <div class="share-inline-row">
        <input
          aria-label={menuTitle}
          bind:value={query}
          maxlength="64"
          placeholder={placeholder}
          type="text"
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
        <button class="create-post-link" type="button" on:click={createPost}>{createPostLabel}</button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .share-shell {
    position: relative;
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
    position: absolute;
    bottom: calc(100% + 8px);
    left: 0;
    width: min(320px, 76vw);
    padding: 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    box-shadow: 0 14px 32px color-mix(in srgb, black 22%, transparent);
    z-index: 10;
  }

  .feedback {
    line-height: 1.45;
  }

  .feedback {
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
  }
</style>