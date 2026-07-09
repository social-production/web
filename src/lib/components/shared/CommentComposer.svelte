<script lang="ts">
  import { createEventDispatcher, onMount, tick } from 'svelte';

  export let value = '';
  export let placeholder = 'Write a comment...';
  export let submitLabel = 'Post comment';

  const dispatch = createEventDispatcher<{ submit: void }>();

  const MAX_HEIGHT = 240;

  let composerElement: HTMLTextAreaElement | null = null;
  let isScrollable = false;

  $: canSubmit = value.trim().length > 0;

  async function resizeComposer() {
    if (!composerElement) {
      return;
    }

    composerElement.style.height = 'auto';
    const nextHeight = Math.min(composerElement.scrollHeight, MAX_HEIGHT);
    composerElement.style.height = `${nextHeight}px`;
    isScrollable = composerElement.scrollHeight > MAX_HEIGHT;
  }

  async function handleInput() {
    await resizeComposer();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  async function submit() {
    if (!value.trim()) {
      return;
    }

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
  {#if canSubmit}
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
