<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import LinkCard from './LinkCard.svelte';
  import {
    formatLinkVoteRequirement,
    formatLinkVoteSummary,
    isLinkSideApproved,
    isLinkSideBlocked,
    sideVoteLines,
    targetDetailMetaRows
  } from './linkCardDisplay';
  import { createProjectManualLinkSeverRequest, setProjectManualLinkVote } from '$lib/services/commands/projects';
  import { createEventManualLinkSeverRequest, setEventManualLinkVote } from '$lib/services/commands/events';
  import type {
    DetailLinkRequest,
    DetailLinksFrameItem,
    ProjectApprovalVote,
    ProjectManualLinkVoteState
  } from '$lib/types/detail';
  import { surfaceAccentCssVar, surfaceIconForKind, surfaceTypeAccent } from '$lib/utils/surfaceType';
  import type { ProjectMode } from '$lib/types/feed';

  export let title = '';
  export let description = '';
  export let items: DetailLinksFrameItem[] = [];
  export let emptyMessage = 'No linked records yet.';
  export let ownerKind: 'project' | 'event' = 'project';
  export let ownerSlug = '';
  export let allowSever = false;
  export let highlightedRequestId: string | null = null;

  let expandedById: Record<string, boolean> = {};
  let lastHighlight: string | null = null;
  let activeVotePendingId: string | null = null;
  let severPendingId: string | null = null;

  $: if (highlightedRequestId && highlightedRequestId !== lastHighlight) {
    lastHighlight = highlightedRequestId;
    const match = items.find((item) => item.openSeverRequest?.id === highlightedRequestId);
    if (match) {
      expandedById = { ...expandedById, [match.id]: true };
    }
  }

  function toggleExpanded(id: string) {
    expandedById = { ...expandedById, [id]: !expandedById[id] };
  }

  function accentFor(item: DetailLinksFrameItem) {
    if (item.subjectKind === 'project') {
      const mode = (item.targetDetail?.projectMode as ProjectMode | null) ?? 'productive';
      return surfaceTypeAccent('project', mode);
    }
    return surfaceTypeAccent('event');
  }

  function accentStyle(item: DetailLinksFrameItem) {
    return `--row-accent: ${surfaceAccentCssVar(accentFor(item))};`;
  }

  function metaLine(item: DetailLinksFrameItem) {
    return `${item.subjectLabel} · ${item.governanceTally?.label ?? item.relationshipLabel}`;
  }

  function itemSideVoteLines(item: DetailLinksFrameItem) {
    const sever = item.openSeverRequest;
    if (!sever) return [];
    return sideVoteLines({
      sourceTitle: sever.sourceTitle,
      sourceVoteLabel: sever.sourceVoteLabel,
      targetTitle: sever.targetTitle,
      targetVoteLabel: sever.targetVoteLabel
    });
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
      await invalidateAll();
    } finally {
      activeVotePendingId = null;
    }
  }

  async function proposeSever(item: DetailLinksFrameItem) {
    if (!ownerSlug || !allowSever) return;
    severPendingId = item.id;
    try {
      if (ownerKind === 'project') {
        await createProjectManualLinkSeverRequest(ownerSlug, item.id);
      } else {
        await createEventManualLinkSeverRequest(ownerSlug, item.id);
      }
      await invalidateAll();
      expandedById = { ...expandedById, [item.id]: true };
    } finally {
      severPendingId = null;
    }
  }

  function votePanels(request: DetailLinkRequest): ProjectManualLinkVoteState[] {
    return [request.thisRecordVote, request.otherRecordVote];
  }
</script>

<section class="network-stack">
  <div class="section-heading">
    <h2>{title}</h2>
    {#if description}
      <p>{description}</p>
    {/if}
  </div>

  {#if items.length === 0}
    <div class="empty-row">{emptyMessage}</div>
  {:else}
    <div class="link-list">
      {#each items as item (item.id)}
        <LinkCard
          title={item.title}
          metaLine={metaLine(item)}
          sideVoteLines={itemSideVoteLines(item)}
          icon={surfaceIconForKind(item.subjectKind)}
          accentStyle={accentStyle(item)}
          href={item.href ?? null}
          expanded={Boolean(expandedById[item.id])}
          highlighted={highlightedRequestId === item.openSeverRequest?.id}
          domId={item.openSeverRequest ? `link-request-${item.openSeverRequest.id}` : `link-${item.id}`}
          onToggle={() => toggleExpanded(item.id)}
        >
          {#if item.targetDetail}
            {@const metaRows = targetDetailMetaRows(item.targetDetail)}
            <div class="target-detail">
              <p class="detail-description">{item.targetDetail.description || item.summary}</p>
              {#if metaRows.length > 0}
                <div class="detail-meta">
                  {#each metaRows as row}
                    <span>{row}</span>
                  {/each}
                </div>
              {/if}
            </div>
          {:else}
            <p>{item.summary}</p>
          {/if}

          {#if item.openSeverRequest}
            {@const severRequest = item.openSeverRequest}
            <div class="vote-block">
              <h3>Sever vote</h3>
              <p class="vote-summary">{severRequest.summary}</p>
              <div class="vote-grid">
                {#each votePanels(severRequest) as vote}
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
                          class="vote-button danger"
                          disabled={activeVotePendingId === severRequest.id}
                          type="button"
                          on:click={() => castVote(vote, severRequest.id, 'yes')}
                        >
                          Remove link
                        </button>
                        <button
                          class:active={vote.viewerVote === 'no'}
                          class="vote-button"
                          disabled={activeVotePendingId === severRequest.id}
                          type="button"
                          on:click={() => castVote(vote, severRequest.id, 'no')}
                        >
                          Keep link
                        </button>
                      </div>
                    {/if}
                  </section>
                {/each}
              </div>
            </div>
          {:else if allowSever && item.viewerCanProposeSever}
            <div class="sever-action">
              <button
                class="danger-button"
                disabled={severPendingId === item.id}
                type="button"
                on:click={() => proposeSever(item)}
              >
                Start sever vote
              </button>
            </div>
          {/if}
        </LinkCard>
      {/each}
    </div>
  {/if}
</section>

<style>
  .network-stack,
  .link-list,
  .target-detail,
  .vote-block,
  .vote-grid,
  .vote-panel {
    display: grid;
    gap: 12px;
  }

  .section-heading {
    display: grid;
    gap: 4px;
  }

  .empty-row {
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

  h3 {
    font-size: 13px;
  }

  p,
  .detail-meta,
  .vote-note,
  .vote-requirement {
    color: var(--text-soft);
    line-height: 1.5;
    font-size: 13px;
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

  .vote-head,
  .vote-buttons,
  .sever-action {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .vote-button,
  .danger-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 7px 12px;
    border: 1px solid color-mix(in srgb, var(--brand) 35%, var(--panel-border));
    border-radius: 999px;
    background: color-mix(in srgb, var(--brand-soft) 70%, var(--panel));
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .vote-button.danger,
  .danger-button {
    border-color: color-mix(in srgb, var(--accent-warm-strong) 45%, var(--panel-border));
    background: color-mix(in srgb, var(--accent-warm-soft) 70%, var(--panel));
    color: var(--accent-warm-strong);
  }

  .vote-button.active {
    opacity: 0.75;
  }
</style>
