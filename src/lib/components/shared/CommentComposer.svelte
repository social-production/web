<script lang="ts">
  import { page } from '$app/stores';
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import MentionMenu from '$lib/components/shared/MentionMenu.svelte';
  import { searchPeopleSuggestions } from '$lib/services/queries/account';
  import { activeMention, insertMention } from '$lib/utils/mentions';
  import { requireViewer } from '$lib/utils/requireViewer';

  export let value = '';
  export let placeholder = 'Write a comment...';
  export let submitLabel = 'Post comment';
  export let signInMessage = 'Sign in to comment.';

  const dispatch = createEventDispatcher<{ submit: void }>();

  const MAX_HEIGHT = 240;

  let composerElement: HTMLTextAreaElement | null = null;
  let isScrollable = false;
  let mentionResults: Array<{ id: string; username: string }> = [];
  let mentionStart = -1;
  let mentionCursor = 0;
  let mentionTimer: ReturnType<typeof setTimeout> | null = null;

  $: canSubmit = value.trim().length > 0;
  $: signedIn = Boolean($page.data.bootstrap?.viewer);

  function promptSignIn() {
    requireViewer($page.data.bootstrap?.viewer, signInMessage);
  }

  async function resizeComposer() {
    if (!composerElement) {
      return;
    }

    composerElement.style.height = 'auto';
    const nextHeight = Math.min(composerElement.scrollHeight, MAX_HEIGHT);
    composerElement.style.height = `${nextHeight}px`;
    isScrollable = composerElement.scrollHeight > MAX_HEIGHT;
  }

  function clearMentions() {
    mentionResults = [];
    mentionStart = -1;
  }

  async function handleInput(event: Event) {
    const field = event.currentTarget;
    if (field instanceof HTMLTextAreaElement) {
      const cursor = field.selectionStart ?? value.length;
      const found = activeMention(value, cursor);
      if (!found) {
        clearMentions();
      } else {
        mentionStart = found.start;
        mentionCursor = cursor;
        if (mentionTimer) {
          clearTimeout(mentionTimer);
        }
        mentionTimer = setTimeout(() => {
          void searchPeopleSuggestions(found.query).then((items) => {
            mentionResults = items;
          });
        }, 160);
      }
    }
    await resizeComposer();
  }

  async function chooseMention(username: string) {
    const inserted = insertMention(value, mentionStart, mentionCursor, username);
    value = inserted.value;
    clearMentions();
    await tick();
    composerElement?.focus();
    composerElement?.setSelectionRange(inserted.caret, inserted.caret);
    await resizeComposer();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && mentionResults.length > 0) {
      event.preventDefault();
      clearMentions();
      return;
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      if (mentionResults.length > 0) {
        event.preventDefault();
        void chooseMention(mentionResults[0].username);
        return;
      }
      event.preventDefault();
      submit();
    }
  }

  async function submit() {
    if (!signedIn) {
      promptSignIn();
      return;
    }
    if (!value.trim()) {
      return;
    }

    clearMentions();
    dispatch('submit');
    await tick();
    await resizeComposer();
  }

  export async function resetHeight() {
    await tick();
    await resizeComposer();
  }

  onMount(() => {
    void resizeComposer();
  });
</script>

<div class="composer-field">
  <MentionMenu results={mentionResults} onSelect={chooseMention} />
  {#if signedIn}
  <textarea
    bind:this={composerElement}
    bind:value
    class="composer-input"
    class:scrollable={isScrollable}
    {placeholder}
    rows="1"
    on:input={handleInput}
    on:keydown={handleKeydown}
  ></textarea>
  {:else}
    <button class="composer-input composer-signin" type="button" on:click={promptSignIn}>
      {placeholder}
    </button>
  {/if}
  {#if signedIn && canSubmit}
    <button aria-label={submitLabel} class="composer-send" type="button" on:click={submit}>
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path
          d="M5 12.5 18.5 6 12 19.5V12.5H5Z"
          fill="currentColor"
          stroke="currentColor"
          stroke-width="1.2"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  {/if}
</div>

<style>
  .composer-field {
    position: relative;
    min-width: 0;
  }

  .composer-input {
    box-sizing: border-box;
    display: block;
    width: 100%;
    min-width: 0;
    min-height: 40px;
    max-height: 240px;
    padding: 10px 56px 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-main);
    resize: none;
    overflow-x: hidden;
    overflow-y: hidden;
    overflow-wrap: anywhere;
    word-break: break-word;
    line-height: 1.45;
  }

  .composer-input.scrollable {
    overflow-y: auto;
    scrollbar-gutter: stable;
  }

  button.composer-signin {
    color: var(--text-soft);
    text-align: left;
    cursor: pointer;
  }

  .composer-send {
    position: absolute;
    right: 10px;
    bottom: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: none;
    border-radius: var(--radius-sm);
    background: var(--brand);
    color: var(--page-bg);
    transition: background-color 120ms ease;
  }

  .composer-send:hover {
    background: var(--brand-strong);
  }

  .composer-send svg {
    width: 16px;
    height: 16px;
    display: block;
  }
</style>
