<script lang="ts">
  import type { ProjectServiceHistoryItem } from '$lib/types/detail';

  export let item: ProjectServiceHistoryItem;
  export let saveActivityRating: (
    activityId: string,
    rating: number,
    comment: string | null
  ) => void | Promise<void> = () => {};
  export let deleteActivityRating: (activityId: string) => void | Promise<void> = () => {};
  export let hideTitle = false;
  export let variant: 'card' | 'flat' = 'card';

  let draft = { rating: 0, comment: '' };
  let saving = false;
  let removing = false;
  let removedLocally = false;

  $: if (item.viewerRating) {
    removedLocally = false;
  }

  $: savedRating = removedLocally ? null : item.viewerRating;
  $: composing = !savedRating;

  function setRating(rating: number) {
    draft = { ...draft, rating };
  }

  function setComment(comment: string) {
    draft = { ...draft, comment };
  }

  function resetDraft() {
    draft = { rating: 0, comment: '' };
  }

  async function submitRating() {
    if (draft.rating < 1 || draft.rating > 5) {
      return;
    }

    saving = true;
    try {
      await saveActivityRating(
        item.activity.id,
        draft.rating,
        draft.comment.trim() ? draft.comment.trim() : null
      );
      resetDraft();
    } finally {
      saving = false;
    }
  }

  async function removeRating() {
    if (!savedRating) {
      return;
    }

    removing = true;
    try {
      await deleteActivityRating(item.activity.id);
      removedLocally = true;
      resetDraft();
    } finally {
      removing = false;
    }
  }
</script>

{#if !composing && savedRating}
  <div class:rating-flat={variant === 'flat'} class="rating-saved">
    {#if !hideTitle}
      <strong>Your rating</strong>
    {/if}
    <div class="saved-stars" aria-label={`Your rating: ${savedRating.rating} out of 5 stars`}>
      {#each [1, 2, 3, 4, 5] as star}
        <span class:selected={star <= savedRating.rating} class="saved-star">{star}★</span>
      {/each}
    </div>
    {#if savedRating.comment}
      <p class="saved-comment">{savedRating.comment}</p>
    {/if}
    <button class="text-button" disabled={removing} type="button" on:click={removeRating}>
      {removing ? 'Removing…' : 'Remove rating'}
    </button>
  </div>
{:else}
  <div class:rating-flat={variant === 'flat'} class="rating-editor">
    {#if !hideTitle}
      <strong>Your rating</strong>
    {/if}
    <p class="rating-note">Ratings are separate from completion check-in.</p>
    <div class="star-row" role="group" aria-label="Rate this activity from 1 to 5 stars">
      {#each [1, 2, 3, 4, 5] as star}
        <button
          class:selected={draft.rating === star}
          class="star-button"
          type="button"
          on:click={() => setRating(star)}
        >
          {star}★
        </button>
      {/each}
    </div>
    <textarea
      maxlength="2000"
      placeholder="Optional comment"
      rows="3"
      value={draft.comment}
      on:input={(event) => setComment(event.currentTarget.value)}
    ></textarea>
    <div class="rating-actions">
      <button
        class="secondary-button"
        disabled={draft.rating < 1 || saving}
        type="button"
        on:click={submitRating}
      >
        {saving ? 'Saving…' : 'Save rating'}
      </button>
    </div>
  </div>
{/if}

<style>
  .rating-saved,
  .rating-editor {
    display: grid;
    gap: 10px;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .rating-saved.rating-flat,
  .rating-editor.rating-flat {
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .rating-note,
  .saved-comment {
    margin: 0;
    color: var(--text-soft);
    font-size: 12px;
  }

  .rating-note {
    font-size: 11px;
  }

  .saved-stars,
  .star-row,
  .rating-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .saved-star {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .saved-star.selected {
    color: var(--brand-strong);
  }

  .star-button,
  .secondary-button,
  .text-button {
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .star-button {
    padding: 7px 10px;
  }

  .star-button.selected {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .secondary-button {
    padding: 8px 12px;
    width: fit-content;
  }

  .secondary-button:disabled,
  .text-button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .text-button {
    border: 0;
    background: transparent;
    padding: 0;
    width: fit-content;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  textarea {
    width: 100%;
    resize: vertical;
    padding: 8px 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-main);
    font: inherit;
  }
</style>
