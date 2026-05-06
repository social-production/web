<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import DetailUpdateCard from '$lib/components/cards/details/DetailUpdateCard.svelte';
  import RoundPlusButton from '$lib/components/shared/RoundPlusButton.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import { addProjectUpdate } from '$lib/services/queries/details';
  import { setVote } from '$lib/services/queries/feeds';
  import type { ProjectPageData } from '$lib/types/detail';
  import type { VoteDirection } from '$lib/types/feed';
  import { formatRelativeTime } from '$lib/utils/time';

  export let data: ProjectPageData;
  export let highlightedUpdateId: string | null = null;
  export let showMembersPanel = false;

  const dispatch = createEventDispatcher<{ togglemembers: void }>();

  let draftUpdateTitle = '';
  let draftUpdateBody = '';
  let showUpdateComposer = false;
  let updatePending = false;

  async function handleVote(event: CustomEvent<{ vote: VoteDirection }>) {
    await setVote(data.id, event.detail.vote);
    await invalidateAll();
  }

  async function submitUpdate() {
    if (!draftUpdateTitle.trim() || !draftUpdateBody.trim()) {
      return;
    }

    updatePending = true;

    try {
      await addProjectUpdate(data.slug, draftUpdateTitle, draftUpdateBody);
      draftUpdateTitle = '';
      draftUpdateBody = '';
      showUpdateComposer = false;
      await invalidateAll();
    } finally {
      updatePending = false;
    }
  }

  function toggleMembersPanel() {
    dispatch('togglemembers');
  }

  function toggleComposer() {
    showUpdateComposer = !showUpdateComposer;
  }

  $: updateActionLabel = draftUpdateTitle.trim() || draftUpdateBody.trim() ? 'Post update' : 'Post update';
</script>

<section class="updates-shell" id="updates">
  <div class="updates-title-row">
    <h2>Updates</h2>
    {#if data.viewerIsProjectManager}
      <RoundPlusButton active={showUpdateComposer} ariaLabel="Add update" action={toggleComposer} />
    {/if}
  </div>

  {#if data.viewerIsProjectManager && showUpdateComposer}
    <div class="composer-card">
      <input bind:value={draftUpdateTitle} maxlength="120" placeholder="Update title" />
      <textarea bind:value={draftUpdateBody} rows="4" placeholder="Share what changed on this project..."></textarea>
      <div class="composer-actions">
        <button class="secondary-button" type="button" on:click={() => (showUpdateComposer = false)}>
          Cancel
        </button>
        <button class="primary-button" disabled={updatePending} type="button" on:click={submitUpdate}>
          {updateActionLabel}
        </button>
      </div>
    </div>
  {/if}

  <div class="stack">
    {#if data.updates.length === 0}
      <div class="empty-card">
        <p>No updates yet.</p>
      </div>
    {:else}
      {#each data.updates as update}
        <DetailUpdateCard {update} {highlightedUpdateId} />
      {/each}
    {/if}
  </div>

  <div class="overview-footer-row">
    <VoteStrip activeVote={data.activeVote} count={data.voteCount} on:vote={handleVote} />
    <button
      aria-expanded={showMembersPanel}
      class:active-toggle={showMembersPanel}
      class="secondary-button member-toggle-button"
      type="button"
      on:click={toggleMembersPanel}
    >
      Members / Managers
    </button>
    <span class="footer-author-row">
      <a class="inline-link" href={`/profile/${data.authorUsername}`}>{data.authorUsername}</a>
      · {formatRelativeTime(data.createdAt)}
    </span>
  </div>
</section>

<style>
  .updates-shell,
  .stack,
  .composer-card {
    display: grid;
    gap: 18px;
  }

  .updates-shell {
    padding: 24px 0 22px;
    border-bottom: 1px solid var(--panel-border);
  }

  .updates-title-row,
  .composer-actions,
  .overview-footer-row {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .updates-title-row {
    justify-content: center;
  }

  .overview-footer-row {
    justify-content: flex-start;
    padding-top: 16px;
    border-top: 1px solid var(--panel-border);
  }

  .footer-author-row {
    margin-left: auto;
  }

  h2 {
    margin: 0;
    font-size: 18px;
    text-align: center;
    color: var(--text-main);
  }

  p,
  span {
    color: var(--text-soft);
    line-height: 1.45;
  }

  .primary-button,
  .secondary-button {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
  }

  .member-toggle-button.active-toggle {
    border-color: var(--brand);
    color: var(--brand-strong);
  }

  .composer-card,
  .empty-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
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
    min-height: 120px;
    resize: vertical;
  }

  .primary-button {
    background: var(--brand);
    color: var(--page-bg);
  }

  .secondary-button {
    border: 1px solid var(--panel-border);
    background: var(--panel-strong);
    color: var(--text-soft);
  }

  .primary-button:disabled,
  .secondary-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .inline-link {
    color: var(--text-main);
    font-weight: 700;
  }

  .footer-author-row {
    color: var(--text-soft);
  }

  @media (max-width: 760px) {
    .overview-footer-row {
      align-items: stretch;
    }
  }
</style>
