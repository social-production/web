<script lang="ts">
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import type { CreateFeedbackInput, FeedbackKind } from '$lib/types/feedback';

  export let open = false;
  export let pending = false;
  export let message = '';
  export let onSubmit: (input: CreateFeedbackInput) => void | Promise<void> = () => {};

  const kindOptions: Array<{ value: FeedbackKind; label: string; icon: 'bug' | 'lightbulb' }> = [
    { value: 'bug', label: 'Bug', icon: 'bug' },
    { value: 'suggestion', label: 'Suggestion', icon: 'lightbulb' },
  ];

  let kind: FeedbackKind = 'bug';
  let title = '';
  let description = '';
  let wasOpen = false;

  $: if (open !== wasOpen) {
    wasOpen = open;
    if (open) {
      kind = 'bug';
      title = '';
      description = '';
    }
  }

  async function handleSubmit() {
    await onSubmit({
      kind,
      title: title.trim(),
      description: description.trim(),
    });
  }
</script>

<OverlaySheet bind:open title="Add feedback" labelledById="feedback-compose-sheet" wide>
  <form id="feedback-compose-form" class="feedback-form" on:submit|preventDefault={handleSubmit}>
    {#if message}
      <div class="warning-card" role="alert">{message}</div>
    {/if}

    <label class="field">
      <span class="field-label">Type</span>
      <div class="type-switcher" role="radiogroup" aria-label="Feedback type">
        {#each kindOptions as option}
          <button
            aria-checked={kind === option.value}
            class="type-option"
            class:active={kind === option.value}
            role="radio"
            type="button"
            on:click={() => (kind = option.value)}
          >
            <FeedToolbarIcon name={option.icon} />
            <span>{option.label}</span>
          </button>
        {/each}
      </div>
    </label>

    <label class="field">
      <span class="field-label">Title</span>
      <input bind:value={title} maxlength="200" placeholder="Summarize the bug or suggestion" type="text" />
    </label>

    <label class="field">
      <span class="field-label">Description</span>
      <textarea
        bind:value={description}
        maxlength="5000"
        placeholder="Describe what happened, what you expected, or how the platform could improve."
        rows="7"
      ></textarea>
    </label>
  </form>
  <svelte:fragment slot="footer">
    <div class="sheet-actions">
      <button class="sheet-cancel" type="button" on:click={() => (open = false)}>Cancel</button>
      <button class="sheet-submit" disabled={pending || !title.trim() || !description.trim()} form="feedback-compose-form" type="submit">
        {pending ? 'Submitting…' : 'Submit feedback'}
      </button>
    </div>
  </svelte:fragment>
</OverlaySheet>

<style>
  .feedback-form {
    display: grid;
    gap: 16px;
    padding: 8px 16px 4px;
  }

  .field {
    display: grid;
    gap: 8px;
  }

  .field-label {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .type-switcher {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .type-option {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 42px;
    padding: 0 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-soft);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
  }

  .type-option.active {
    border-color: color-mix(in srgb, var(--brand) 62%, var(--panel-border));
    background: color-mix(in srgb, var(--brand) 12%, var(--panel));
    color: var(--text-main);
  }

  input,
  textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
  }

  textarea {
    resize: vertical;
    min-height: 140px;
  }

  .warning-card {
    padding: 12px 14px;
    border: 1px solid color-mix(in srgb, var(--status-yellow) 50%, var(--panel-border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--status-yellow) 14%, var(--panel-strong));
    color: var(--text-main);
    font-size: 13px;
    font-weight: 700;
  }
</style>
