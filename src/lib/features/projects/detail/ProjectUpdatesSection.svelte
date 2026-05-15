<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { tick } from 'svelte';
  import CountBadge from '$lib/components/shared/CountBadge.svelte';
  import VoteCardFooter from '$lib/components/shared/VoteCardFooter.svelte';
  import DetailUpdateCard from '$lib/components/cards/details/DetailUpdateCard.svelte';
  import RoundPlusButton from '$lib/components/shared/RoundPlusButton.svelte';
  import { isPersonalServiceProject } from '$lib/features/projects/projectMode';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import {
    addProjectUpdate,
    requestProjectEdit,
    requestProjectUpdate,
    setProjectEditVote,
    updateProjectDetails,
    setProjectUpdateVote
  } from '$lib/services/queries/details';
  import { setVote } from '$lib/services/queries/feeds';
  import {
    formatProjectVoteRequirement,
    formatProjectVoteSummary
  } from '$lib/utils/projectVotes';
  import type { ProjectApprovalVote, ProjectPageData } from '$lib/types/detail';
  import type { VoteDirection } from '$lib/types/feed';
  import { formatRelativeTime } from '$lib/utils/time';

  export let data: ProjectPageData;
  export let highlightedUpdateId: string | null = null;
  export let showMembersPanel = false;

  const dispatch = createEventDispatcher<{ togglemembers: void }>();

  let draftUpdateBody = '';
  let draftEditTitle = data.title;
  let draftEditDescription = data.description;
  let showUpdateComposer = false;
  let showUpdateVotes = false;
  let showEditComposer = false;
  let showEditVotes = false;
  let updatePending = false;
  let editPending = false;
  let updateVotesElement: HTMLElement | null = null;
  let editVotesElement: HTMLElement | null = null;
  let editComposerElement: HTMLElement | null = null;

  function scrollElementIntoView(element: HTMLElement | null) {
    if (!element) {
      return;
    }

    const topbarHeight = document.querySelector<HTMLElement>('.topbar')?.getBoundingClientRect().height ?? 0;
    const topOffset = topbarHeight + 28;
    const nextTop = window.scrollY + element.getBoundingClientRect().top - topOffset;

    window.scrollTo({
      top: Math.max(nextTop, 0),
      behavior: 'smooth'
    });
  }

  async function handleVote(event: CustomEvent<{ vote: VoteDirection }>) {
    await setVote(data.id, event.detail.vote);
    await invalidateAll();
  }

  async function submitUpdate() {
    if (!draftUpdateBody.trim()) {
      return;
    }

    updatePending = true;

    try {
      if (isPersonalServiceProject(data.projectMode)) {
        await addProjectUpdate(data.slug, '', draftUpdateBody);
      } else {
        await requestProjectUpdate(data.slug, draftUpdateBody);
      }

      draftUpdateBody = '';
      showUpdateComposer = false;
      await invalidateAll();
    } finally {
      updatePending = false;
    }
  }

  async function submitEdit() {
    const description = draftEditDescription.trim();

    if (!draftEditTitle.trim() || !description) {
      return;
    }

    editPending = true;

    try {
      if (isPersonalServiceProject(data.projectMode)) {
        await updateProjectDetails(data.slug, draftEditTitle, description);
      } else {
        await requestProjectEdit(data.slug, draftEditTitle, description);
      }

      showEditComposer = false;
      await invalidateAll();
    } finally {
      editPending = false;
    }
  }

  function toggleMembersPanel() {
    dispatch('togglemembers');
  }

  function toggleComposer() {
    showUpdateComposer = !showUpdateComposer;

    if (showUpdateComposer) {
      showUpdateVotes = false;
      showEditComposer = false;
      showEditVotes = false;
    }
  }

  async function toggleUpdateVotes() {
    showUpdateVotes = !showUpdateVotes;

    if (showUpdateVotes) {
      showUpdateComposer = false;
      showEditComposer = false;
      showEditVotes = false;
      await tick();
      scrollElementIntoView(updateVotesElement);
    }
  }

  async function toggleEditComposer() {
    showEditComposer = !showEditComposer;

    if (showEditComposer) {
      draftEditTitle = data.title;
      draftEditDescription = data.description;
      showUpdateComposer = false;
      showUpdateVotes = false;
      showEditVotes = false;
      await tick();
      scrollElementIntoView(editComposerElement);
    }
  }

  async function toggleEditVotes() {
    showEditVotes = !showEditVotes;

    if (showEditVotes) {
      showUpdateComposer = false;
      showUpdateVotes = false;
      showEditComposer = false;
      await tick();
      scrollElementIntoView(editVotesElement);
    }
  }

  async function voteOnUpdateRequest(requestId: string, vote: ProjectApprovalVote | null) {
    await setProjectUpdateVote(data.slug, requestId, vote);
    await invalidateAll();
  }

  async function voteOnEditRequest(requestId: string, vote: ProjectApprovalVote | null) {
    await setProjectEditVote(data.slug, requestId, vote);
    await invalidateAll();
  }

  $: showMembershipButton = !isPersonalServiceProject(data.projectMode);
  $: canPostDirectUpdate = isPersonalServiceProject(data.projectMode) && data.viewerIsProjectManager;
  $: canRequestUpdate = canPostDirectUpdate || data.viewerCanRequestUpdate;
  $: canEditDirect = isPersonalServiceProject(data.projectMode) && data.viewerIsProjectManager;
  $: canRequestEdit = canEditDirect || data.viewerCanRequestEdit;
  $: updateActionLabel = isPersonalServiceProject(data.projectMode)
    ? 'Post update'
    : 'Propose update';
  $: editActionLabel = isPersonalServiceProject(data.projectMode)
    ? 'Save details'
    : 'Propose edit';
</script>

<section class="updates-shell" id="updates">
  <div class="updates-title-row">
    <h2>Updates</h2>
    {#if data.updateRequests.length > 0}
      <button class="vote-chip notice-chip" type="button" on:click={toggleUpdateVotes}>
        Vote Active
        <CountBadge count={data.updateRequests.length} />
      </button>
    {/if}
    {#if canRequestUpdate}
      <RoundPlusButton active={showUpdateComposer} ariaLabel="Add update" action={toggleComposer} />
    {/if}
  </div>

  {#if canRequestUpdate && showUpdateComposer}
    <div class="composer-card">
      <label class="field-stack">
        <span class="field-label">Update</span>
        <textarea bind:value={draftUpdateBody} rows="4" placeholder="Share what changed on this project..."></textarea>
      </label>
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

  {#if showUpdateVotes && data.updateRequests.length > 0}
    <div bind:this={updateVotesElement} class="surface-stack">
      {#each data.updateRequests as request (request.id)}
        <article class="surface-card vote-request-card">
          <div class="vote-card-top">
            <div class="vote-card-copy">
              <span class="vote-kicker">Update decision</span>
            </div>
            <span class="vote-requirement">
              {formatProjectVoteRequirement(request.voteSummary, request.approvalThresholdPercent)}
            </span>
          </div>

          <p>{request.body}</p>

          <div class="vote-summary-row">
            <span>{formatProjectVoteSummary(request.voteSummary)}</span>
          </div>

          <VoteCardFooter
            authorUsername={request.authorUsername}
            createdAt={request.createdAt}
            activeVote={request.voteSummary.activeVote}
            canVote={data.viewerCanVoteOnUpdateRequests}
            onVote={(vote) => voteOnUpdateRequest(request.id, vote)}
          />
        </article>
      {/each}
    </div>
  {/if}

  <div class:scrollable={data.updates.length > 4} class="stack updates-list">
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

  {#if canRequestEdit && showEditComposer}
    <div bind:this={editComposerElement} class="composer-card">
      <label class="field-stack">
        <span class="field-label">Title</span>
        <input bind:value={draftEditTitle} maxlength="120" placeholder="Project title" />
      </label>
      <label class="field-stack">
        <span class="field-label">Description</span>
        <textarea
          bind:value={draftEditDescription}
          rows="5"
          placeholder="Describe the project..."
        ></textarea>
      </label>
      <div class="composer-actions">
        <button class="secondary-button" type="button" on:click={() => (showEditComposer = false)}>
          Cancel
        </button>
        <button class="primary-button" disabled={editPending} type="button" on:click={submitEdit}>
          {editActionLabel}
        </button>
      </div>
    </div>
  {/if}

  {#if showEditVotes && data.editRequests.length > 0}
    <div bind:this={editVotesElement} class="surface-stack">
      {#each data.editRequests as request (request.id)}
        <article class="surface-card vote-request-card">
          <div class="vote-card-top">
            <div class="vote-card-copy">
              <span class="vote-kicker">Edit decision</span>
            </div>
            <span class="vote-requirement">
              {formatProjectVoteRequirement(request.voteSummary, request.approvalThresholdPercent)}
            </span>
          </div>

          <div class="edit-request-copy">
            <p>{request.description}</p>
          </div>

          <div class="vote-summary-row">
            <span>{formatProjectVoteSummary(request.voteSummary)}</span>
          </div>

          <VoteCardFooter
            authorUsername={request.authorUsername}
            createdAt={request.createdAt}
            activeVote={request.voteSummary.activeVote}
            canVote={data.viewerCanVoteOnEditRequests}
            onVote={(vote) => voteOnEditRequest(request.id, vote)}
          />
        </article>
      {/each}
    </div>
  {/if}

  <div class="overview-footer-row">
    <VoteStrip activeVote={data.activeVote} count={data.voteCount} on:vote={handleVote} />
    {#if showMembershipButton}
      <button
        aria-expanded={showMembersPanel}
        class:active-toggle={showMembersPanel}
        class="secondary-button member-toggle-button"
        type="button"
        on:click={toggleMembersPanel}
      >
        Members
      </button>
    {/if}
    {#if canRequestEdit}
      <button
        aria-expanded={showEditComposer}
        class:active-toggle={showEditComposer}
        class="secondary-button member-toggle-button"
        type="button"
        on:click={toggleEditComposer}
      >
        Edit details
      </button>
    {/if}
    {#if data.editRequests.length > 0}
      <button class="vote-chip notice-chip" type="button" on:click={toggleEditVotes}>
        Vote Active
        <CountBadge count={data.editRequests.length} />
      </button>
    {/if}
    <span class="footer-author-row">
      <a class="inline-link" href={`/profile/${data.authorUsername}`}>{data.authorUsername}</a>
      · {formatRelativeTime(data.createdAt)}
    </span>
  </div>
</section>

<style>
  .updates-shell,
  .stack,
  .composer-card,
  .surface-stack,
  .vote-card-copy {
    display: grid;
    gap: 18px;
  }

  .updates-shell {
    padding: 24px 0 22px;
    border-bottom: 1px solid var(--panel-border);
  }

  .updates-title-row,
  .composer-actions,
  .overview-footer-row,
  .vote-card-top,
  .vote-summary-row {
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

  .field-stack {
    display: grid;
    gap: 8px;
  }

  .field-label {
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
  }

  .member-toggle-button.active-toggle {
    border-color: var(--brand);
    color: var(--brand-strong);
  }

  .composer-card,
  .empty-card,
  .surface-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .updates-list.scrollable {
    max-height: 900px;
    overflow-y: auto;
    padding-right: 6px;
    scrollbar-gutter: stable;
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

  .edit-request-copy {
    display: grid;
    gap: 8px;
  }

  .edit-request-copy p {
    margin: 0;
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

  .vote-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .vote-chip.notice-chip {
    color: var(--brand-strong);
  }

  .vote-kicker {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-soft);
  }

  .vote-card-top {
    justify-content: space-between;
  }

  .vote-requirement,
  .vote-summary-row {
    color: var(--text-soft);
    font-size: 12px;
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
