<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { invalidateDetail } from '$lib/utils/detailInvalidation';
  import LinkCard from './LinkCard.svelte';
  import {
    formatLinkVoteRequirement,
    formatLinkVoteSummary,
    isLinkSideApproved,
    isLinkSideBlocked,
    opposingLinkTitle,
    sideVoteLines,
    targetDetailMetaRows
  } from './linkCardDisplay';
  import { createEventManualLinkRequest, setEventManualLinkVote } from '$lib/services/commands/events';
  import { createProjectManualLinkRequest, setProjectManualLinkVote } from '$lib/services/commands/projects';
  import { getSearch } from '$lib/services/queries/search';
  import type {
    DetailLinkRequest,
    ProjectApprovalVote,
    ProjectManualLinkVoteState
  } from '$lib/types/detail';
  import type { SearchResultItem } from '$lib/types/search';
  import type { ProjectMode } from '$lib/types/feed';
  import { surfaceAccentCssVar, surfaceIconForKind, surfaceTypeAccent } from '$lib/utils/surfaceType';

  export let ownerKind: 'project' | 'event' = 'project';
  export let ownerSlug = '';
  export let title = 'Pending link requests';
  export let description =
    'Search for a project or event, explain why they should be linked, then start a vote. Both sides must approve.';
  export let requests: DetailLinkRequest[] = [];
  export let viewerCanProposeLinks = false;
  export let highlightedRequestId: string | null = null;

  let composerOpen = false;
  let searchQuery = '';
  let searchResults: SearchResultItem[] = [];
  let searchPending = false;
  let searchError = '';
  let selected: SearchResultItem | null = null;
  let summary = '';
  let createPending = false;
  let activeVotePendingId: string | null = null;
  let expandedById: Record<string, boolean> = {};
  let lastHighlight: string | null = null;
  let searchHandle: ReturnType<typeof setTimeout> | null = null;

  $: if (highlightedRequestId && highlightedRequestId !== lastHighlight) {
    lastHighlight = highlightedRequestId;
    expandedById = { ...expandedById, [highlightedRequestId]: true };
    void focusRequest(highlightedRequestId);
  }

  onMount(() => {
    if (highlightedRequestId) {
      void focusRequest(highlightedRequestId);
    }
  });

  function toggleExpanded(id: string) {
    expandedById = { ...expandedById, [id]: !expandedById[id] };
  }

  async function focusRequest(requestId: string) {
    await tick();
    const card = document.getElementById(`link-request-${requestId}`);
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card?.classList.add('request-highlight');
    window.setTimeout(() => card?.classList.remove('request-highlight'), 1800);
  }

  function accentFor(request: DetailLinkRequest) {
    if (request.targetKind === 'project') {
      const mode = (request.targetDetail?.projectMode as ProjectMode | null) ?? 'productive';
      return surfaceTypeAccent('project', mode);
    }
    return surfaceTypeAccent('event');
  }

  function accentStyle(request: DetailLinkRequest) {
    return `--row-accent: ${surfaceAccentCssVar(accentFor(request))};`;
  }

  function cardTitle(request: DetailLinkRequest) {
    return opposingLinkTitle({
      title: request.title,
      otherRecordTitle: request.otherRecordVote?.projectTitle,
      targetTitle: request.targetTitle
    });
  }

  function metaLine(request: DetailLinkRequest) {
    const kindLabel = request.targetKind === 'event' ? 'Event' : 'Project';
    return `${kindLabel} · ${request.governanceTally?.label ?? 'No votes yet'} · ${request.proposedByUsername}`;
  }

  function requestSideVoteLines(request: DetailLinkRequest) {
    return sideVoteLines({
      sourceTitle: request.sourceTitle,
      sourceVoteLabel: request.sourceVoteLabel,
      targetTitle: request.targetTitle,
      targetVoteLabel: request.targetVoteLabel
    });
  }

  function closeComposer() {
    composerOpen = false;
    searchQuery = '';
    searchResults = [];
    searchError = '';
    selected = null;
    summary = '';
  }

  function scheduleSearch(query: string) {
    searchQuery = query;
    selected = null;
    if (searchHandle) {
      clearTimeout(searchHandle);
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      searchResults = [];
      searchPending = false;
      searchError = '';
      return;
    }

    searchPending = true;
    searchHandle = setTimeout(() => {
      void runSearch(trimmed);
    }, 220);
  }

  async function runSearch(query: string) {
    searchPending = true;
    searchError = '';
    try {
      const response = await getSearch(query, {
        entityTypes: ['project', 'event'],
        limit: 8
      });
      searchResults = response.results.filter((item) => {
        if (item.kind !== 'project' && item.kind !== 'event') {
          return false;
        }
        const slug = item.href.split('/').filter(Boolean).pop() ?? '';
        return !(item.kind === ownerKind && slug === ownerSlug);
      });
    } catch {
      searchError = 'Could not search right now.';
      searchResults = [];
    } finally {
      searchPending = false;
    }
  }

  function selectResult(item: SearchResultItem) {
    selected = item;
    searchQuery = item.title;
    searchResults = [];
  }

  function selectedKindSlug(item: SearchResultItem) {
    const kind = item.kind === 'event' ? 'event' : 'project';
    const slug = item.href.split('/').filter(Boolean).pop() ?? '';
    return { kind: kind as 'project' | 'event', slug };
  }

  async function submitComposer() {
    if (!ownerSlug || !selected || !summary.trim()) {
      return;
    }

    const target = selectedKindSlug(selected);
    if (!target.slug) {
      return;
    }

    createPending = true;
    try {
      if (ownerKind === 'project') {
        await createProjectManualLinkRequest(ownerSlug, target.kind, target.slug, summary.trim());
      } else {
        await createEventManualLinkRequest(ownerSlug, target.kind, target.slug, summary.trim());
      }
      await invalidateDetail(ownerKind, ownerSlug);
      closeComposer();
    } finally {
      createPending = false;
    }
  }

  async function castVote(
    voteState: ProjectManualLinkVoteState,
    requestId: string,
    vote: ProjectApprovalVote
  ) {
    const slug = voteState.subjectSlug;
    const kind = voteState.subjectKind;
    if (!slug || !kind) return;

    activeVotePendingId = requestId;
    try {
      if (kind === 'project') {
        await setProjectManualLinkVote(slug, requestId, vote);
      } else {
        await setEventManualLinkVote(slug, requestId, vote);
      }
      await invalidateDetail(ownerKind, ownerSlug);
    } finally {
      activeVotePendingId = null;
    }
  }
</script>

<section class="request-stack">
  <div class="section-heading">
    <div class="heading-copy">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
    {#if viewerCanProposeLinks}
      <button class="propose-link-button" type="button" on:click={() => (composerOpen = true)}>
        Propose a new link
      </button>
    {/if}
  </div>

  {#if requests.length === 0}
    <div class="empty-row">No pending link votes.</div>
  {:else}
    <div class="request-list">
      {#each requests as request (request.id)}
        <LinkCard
          title={cardTitle(request)}
          metaLine={metaLine(request)}
          sideVoteLines={requestSideVoteLines(request)}
          icon={surfaceIconForKind(request.targetKind)}
          accentStyle={accentStyle(request)}
          href={request.targetHref ?? null}
          expanded={Boolean(expandedById[request.id])}
          highlighted={highlightedRequestId === request.id}
          domId={`link-request-${request.id}`}
          onToggle={() => toggleExpanded(request.id)}
        >
          {#if request.targetDetail}
            {@const metaRows = targetDetailMetaRows(request.targetDetail)}
            <div class="target-detail">
              <p>{request.targetDetail.description || request.summary}</p>
              {#if metaRows.length > 0}
                <div class="detail-meta">
                  {#each metaRows as row}
                    <span>{row}</span>
                  {/each}
                </div>
              {/if}
            </div>
          {:else}
            <p>{request.summary}</p>
          {/if}

          <div class="vote-grid">
            {#each [request.thisRecordVote, request.otherRecordVote] as vote}
              <section class="vote-panel">
                <div class="vote-head">
                  <strong>{vote.projectTitle}</strong>
                </div>
                <p>{formatLinkVoteSummary(vote)}</p>
                {#if !isLinkSideApproved(vote) && !isLinkSideBlocked(vote)}
                  <p class="vote-requirement">{formatLinkVoteRequirement(vote)}</p>
                {:else}
                  <p class="vote-note">{vote.resultNote}</p>
                {/if}
                {#if vote.viewerCanVote}
                  <div class="vote-buttons">
                    <button
                      class:active={vote.viewerVote === 'yes'}
                      class="vote-button"
                      disabled={activeVotePendingId === request.id}
                      type="button"
                      on:click={() => castVote(vote, request.id, 'yes')}
                    >
                      Approve
                    </button>
                    <button
                      class:active={vote.viewerVote === 'no'}
                      class="vote-button"
                      disabled={activeVotePendingId === request.id}
                      type="button"
                      on:click={() => castVote(vote, request.id, 'no')}
                    >
                      Oppose
                    </button>
                  </div>
                {/if}
              </section>
            {/each}
          </div>
        </LinkCard>
      {/each}
    </div>
  {/if}
</section>

{#if composerOpen}
  <div
    class="composer-backdrop"
    on:click={closeComposer}
    on:keydown={(event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeComposer();
      }
    }}
    role="presentation"
    tabindex="-1"
  >
    <section
      aria-modal="true"
      class="composer-modal"
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="dialog"
      tabindex="-1"
    >
      <div class="composer-head">
        <div class="heading-copy">
          <h3>Propose a new link</h3>
          <p>Find the project or event by name, then say why they should be linked.</p>
        </div>
        <button class="text-action" type="button" on:click={closeComposer}>Cancel</button>
      </div>

      <label class="field-stack">
        <span class="field-label">Search by name</span>
        <input
          value={searchQuery}
          placeholder="Start typing a project or event name"
          type="search"
          on:input={(event) => scheduleSearch((event.currentTarget as HTMLInputElement).value)}
        />
      </label>

      {#if selected}
        <div class="selected-chip">
          <strong>{selected.title}</strong>
          <button class="text-action" type="button" on:click={() => (selected = null)}>Clear</button>
        </div>
      {:else if searchPending}
        <div class="search-status">Searching…</div>
      {:else if searchError}
        <div class="search-status">{searchError}</div>
      {:else if searchQuery.trim().length >= 2 && searchResults.length === 0}
        <div class="search-status">No matching projects or events.</div>
      {:else if searchResults.length > 0}
        <div class="search-results">
          {#each searchResults as item}
            <button class="search-result" type="button" on:click={() => selectResult(item)}>
              <strong>{item.title}</strong>
              <span class="row-meta">{item.kind}</span>
            </button>
          {/each}
        </div>
      {/if}

      <label class="field-stack">
        <span class="field-label">Why are these linked?</span>
        <textarea
          bind:value={summary}
          placeholder="Shared work, follow-on maintenance, related event, etc."
          rows="4"
        ></textarea>
      </label>

      <div class="composer-actions">
        <button
          class="primary-button"
          disabled={createPending || !selected || !summary.trim()}
          type="button"
          on:click={submitComposer}
        >
          Create link vote
        </button>
      </div>
    </section>
  </div>
{/if}

<style>
  .request-stack,
  .request-list,
  .heading-copy,
  .field-stack,
  .vote-grid,
  .vote-panel,
  .target-detail {
    display: grid;
    gap: 12px;
  }

  .section-heading,
  .composer-head,
  .vote-head,
  .vote-buttons,
  .composer-actions,
  .selected-chip {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .empty-row,
  .search-status {
    padding: 12px 14px;
    border: 1px dashed var(--panel-border);
    border-radius: var(--radius-sm);
    color: var(--text-soft);
    font-size: 13px;
  }

  h2,
  h3,
  strong,
  p {
    margin: 0;
  }

  h2 {
    font-size: 15px;
  }

  p,
  .row-meta,
  .detail-meta,
  .vote-note,
  .vote-requirement {
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.5;
  }

  .detail-meta {
    display: grid;
    gap: 4px;
    font-size: 12px;
  }

  .vote-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .vote-panel {
    padding: 10px 12px;
    border: 1px solid color-mix(in srgb, var(--panel-border) 80%, transparent);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .vote-button,
  .primary-button,
  .text-action,
  .search-result,
  .propose-link-button {
    border: 0;
    background: transparent;
    color: var(--brand-strong);
    font-weight: 700;
    cursor: pointer;
  }

  .vote-button,
  .primary-button,
  .propose-link-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 7px 12px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--brand-soft) 70%, transparent);
    text-decoration: none;
    font-size: 12px;
    flex-shrink: 0;
  }

  .propose-link-button {
    border: 1px solid color-mix(in srgb, var(--brand) 35%, var(--panel-border));
    font-size: 13px;
    padding: 9px 14px;
  }

  .vote-button.active,
  .primary-button:disabled {
    opacity: 0.7;
  }

  .text-action {
    font-size: 13px;
  }

  .composer-backdrop {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 16px;
    background: rgb(8 10 18 / 55%);
    z-index: 30;
  }

  .composer-modal {
    width: min(28rem, 100%);
    display: grid;
    gap: 14px;
    padding: 18px;
    border: 1px solid var(--panel-border);
    border-radius: 16px;
    background: var(--panel);
    box-shadow: 0 18px 40px rgb(0 0 0 / 18%);
  }

  input,
  textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid color-mix(in srgb, var(--panel-border) 80%, transparent);
    border-radius: 12px;
    background: var(--panel-strong);
    color: var(--text-main);
  }

  .field-label {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .search-results {
    display: grid;
    gap: 4px;
    max-height: 220px;
    overflow: auto;
  }

  .search-result {
    width: 100%;
    padding: 8px;
    border-radius: 10px;
    color: inherit;
    text-align: left;
    display: grid;
    gap: 2px;
  }

  .search-result:hover {
    background: color-mix(in srgb, var(--brand-soft) 45%, transparent);
  }

  .selected-chip {
    padding: 8px 10px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--brand-soft) 45%, transparent);
  }
</style>
