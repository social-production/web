<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { createProjectManualLinkRequest, setProjectManualLinkVote } from '$lib/services/commands/projects';
  import type { ProjectLinkCandidate, ProjectManualLinkRequest, ProjectApprovalVote } from '$lib/types/detail';

  export let projectSlug = '';
  export let title = 'Link votes';
  export let description =
    'Any project member can propose a manual link. It becomes a manual link only after both linked projects approve it.';
  export let requests: ProjectManualLinkRequest[] = [];
  export let linkableProjects: ProjectLinkCandidate[] = [];
  export let viewerCanProposeLinks = false;
  export let emptyMessage = 'No manual link requests are available yet.';

  let composerOpen = false;
  let selectedTargetProjectSlug = '';
  let relationshipLabel = '';
  let summary = '';
  let createPending = false;
  let activeVotePendingId: string | null = null;

  $: if (!selectedTargetProjectSlug && linkableProjects.length > 0) {
    selectedTargetProjectSlug = linkableProjects[0].slug;
  }

  function tone(label: string) {
    const normalized = label.toLowerCase();

    if (normalized.includes('approved')) {
      return 'approved';
    }

    if (normalized.includes('blocked')) {
      return 'blocked';
    }

    return 'pending';
  }

  function closeComposer() {
    composerOpen = false;
    relationshipLabel = '';
    summary = '';
    selectedTargetProjectSlug = linkableProjects[0]?.slug ?? '';
  }

  async function submitComposer() {
    if (!projectSlug || !selectedTargetProjectSlug || !relationshipLabel.trim() || !summary.trim()) {
      return;
    }

    createPending = true;

    try {
      await createProjectManualLinkRequest(
        projectSlug,
        selectedTargetProjectSlug,
        relationshipLabel.trim(),
        summary.trim()
      );
      await invalidateAll();
      closeComposer();
    } finally {
      createPending = false;
    }
  }

  async function castVote(requestId: string, vote: ProjectApprovalVote | null) {
    if (!projectSlug) {
      return;
    }

    activeVotePendingId = requestId;

    try {
      await setProjectManualLinkVote(projectSlug, requestId, vote);
      await invalidateAll();
    } finally {
      activeVotePendingId = null;
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeComposer();
    }
  }

  function handleBackdropKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      closeComposer();
    }
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (composerOpen && event.key === 'Escape') {
      closeComposer();
    }
  }
</script>

<svelte:window on:keydown={handleWindowKeydown} />

<section class="request-stack">
  <div class="section-heading">
    <div class="heading-copy">
      <h2>{title}</h2>
      {#if description}
        <p>{description}</p>
      {/if}
    </div>

    {#if viewerCanProposeLinks}
      <button class="plus-button" type="button" on:click={() => (composerOpen = true)}>+</button>
    {/if}
  </div>

  {#if requests.length === 0}
    <div class="empty-card">{emptyMessage}</div>
  {:else}
    <div class="request-list">
      {#each requests as request}
        <article class="request-card">
          <div class="request-head">
            <div class="request-copy">
              <h3>{request.title}</h3>
              <p>{request.summary}</p>
            </div>
            <span class={`status-pill ${tone(request.statusLabel)}`}>{request.statusLabel}</span>
          </div>

          <div class="request-meta">
            <span>Proposed by {request.proposedByUsername}</span>
            <span>{request.createdAtLabel}</span>
            <span class="relationship-pill">{request.relationshipLabel}</span>
            {#if request.targetProjectHref}
              <a class="open-link" href={request.targetProjectHref}>Open linked project</a>
            {/if}
          </div>

          <div class="vote-grid">
            {#each [request.thisProjectVote, request.otherProjectVote] as vote}
              <section class={`vote-card ${tone(vote.statusLabel)}`}>
                <div class="vote-head">
                  <strong>{vote.projectTitle}</strong>
                  <span class="vote-status">{vote.statusLabel}</span>
                </div>
                <p>{vote.approvalPercent}% member approval</p>
                <p>{vote.yesCount} yes / {vote.noCount} no</p>
                <p>{vote.approvalsRequired} approvals required from {vote.memberCount} members</p>
                <p class="vote-note">{vote.resultNote}</p>

                {#if vote.viewerCanVote}
                  <div class="vote-actions">
                    <span class="active-vote-pill">Active vote</span>
                    <div class="vote-buttons">
                      <button
                        class:active-vote-button={vote.viewerVote === 'yes'}
                        class="secondary-button vote-button"
                        disabled={activeVotePendingId === request.id}
                        type="button"
                        on:click={() => castVote(request.id, vote.viewerVote === 'yes' ? null : 'yes')}
                      >
                        Approve
                      </button>
                      <button
                        class:active-vote-button={vote.viewerVote === 'no'}
                        class="secondary-button vote-button"
                        disabled={activeVotePendingId === request.id}
                        type="button"
                        on:click={() => castVote(request.id, vote.viewerVote === 'no' ? null : 'no')}
                      >
                        Oppose
                      </button>
                    </div>
                  </div>
                {/if}
              </section>
            {/each}
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>

{#if composerOpen}
  <div
    aria-hidden="true"
    class="composer-backdrop"
    on:click={handleBackdropClick}
    on:keydown={handleBackdropKeydown}
    role="presentation"
    tabindex="-1"
  >
    <section aria-modal="true" class="composer-modal" role="dialog">
      <div class="composer-head">
        <div class="heading-copy">
          <h3>Link projects</h3>
          <p>Create a manual link request that both projects can vote on.</p>
        </div>
        <button class="text-button" type="button" on:click={closeComposer}>Cancel</button>
      </div>

      <label class="field-stack">
        <span class="field-label">Linked project</span>
        <select bind:value={selectedTargetProjectSlug}>
          {#each linkableProjects as option}
            <option value={option.slug}>{option.title}</option>
          {/each}
        </select>
      </label>

      <label class="field-stack">
        <span class="field-label">Relationship label</span>
        <input bind:value={relationshipLabel} placeholder="Shared asset dependency" type="text" />
      </label>

      <label class="field-stack">
        <span class="field-label">Why link these projects?</span>
        <textarea bind:value={summary} placeholder="Explain the shared work, asset dependency, or coordination path." rows="4"></textarea>
      </label>

      <div class="composer-actions">
        <button class="primary-button" disabled={createPending} type="button" on:click={submitComposer}>
          Create link vote
        </button>
      </div>
    </section>
  </div>
{/if}

<style>
  .request-stack,
  .request-list,
  .request-card,
  .request-copy,
  .vote-grid,
  .vote-card,
  .heading-copy,
  .field-stack {
    display: grid;
    gap: 12px;
  }

  .request-card,
  .empty-card,
  .vote-card,
  .composer-modal {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .request-head,
  .vote-head,
  .request-meta,
  .section-heading,
  .composer-head,
  .vote-actions,
  .vote-buttons,
  .composer-actions {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .request-meta {
    justify-content: flex-start;
    color: var(--text-soft);
    font-size: 12px;
  }

  .vote-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  h2,
  h3,
  strong {
    margin: 0;
    color: var(--text-main);
  }

  p,
  .empty-card {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.6;
  }

  .status-pill,
  .relationship-pill,
  .vote-status {
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel);
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
  }

  .status-pill.approved,
  .vote-card.approved {
    border-color: var(--brand-strong);
  }

  .status-pill.blocked,
  .vote-card.blocked {
    border-color: var(--accent-warm);
  }

  .plus-button,
  .active-vote-pill {
    width: 34px;
    height: 34px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel);
    color: var(--text-main);
    font-size: 18px;
    font-weight: 700;
    display: grid;
    place-items: center;
  }

  .active-vote-pill {
    width: auto;
    height: auto;
    padding: 6px 10px;
    font-size: 11px;
    color: var(--brand-strong);
    border-color: color-mix(in srgb, var(--brand) 40%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 70%, var(--panel));
  }

  .vote-buttons {
    justify-content: flex-start;
  }

  .vote-button.active-vote-button {
    border-color: color-mix(in srgb, var(--brand) 40%, var(--panel-border));
    color: var(--brand-strong);
    background: color-mix(in srgb, var(--brand-soft) 75%, var(--panel));
  }

  .open-link {
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
  }

  .vote-note {
    padding-top: 4px;
    border-top: 1px solid var(--panel-border);
  }

  .composer-backdrop {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 24px;
    background: color-mix(in srgb, var(--text-main) 20%, transparent);
    z-index: 80;
  }

  .composer-modal {
    width: min(480px, calc(100vw - 40px));
    background: var(--panel-soft);
    box-shadow: 0 18px 40px color-mix(in srgb, var(--text-main) 14%, transparent);
  }

  .field-label {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-main);
  }

  textarea {
    min-height: 110px;
    resize: vertical;
  }

  .text-button {
    color: var(--text-soft);
    font-weight: 700;
  }
</style>