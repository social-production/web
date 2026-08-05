<script lang="ts">
  import LinkCard from './LinkCard.svelte';
  import {
    formatLinkVoteSummary,
    opposingLinkTitle,
    sideVoteLines,
    targetDetailMetaRows
  } from './linkCardDisplay';
  import type { DetailLinkRequest } from '$lib/types/detail';
  import type { ProjectMode } from '$lib/types/feed';
  import { surfaceAccentCssVar, surfaceIconForKind, surfaceTypeAccent } from '$lib/utils/surfaceType';

  export let requests: DetailLinkRequest[] = [];

  let archiveOpen = false;
  let expandedById: Record<string, boolean> = {};

  function toggleExpanded(id: string) {
    expandedById = { ...expandedById, [id]: !expandedById[id] };
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

  function requestKindLabel(request: DetailLinkRequest) {
    return request.requestType === 'sever' ? 'Sever vote' : 'Link vote';
  }

  function outcomeTone(label: string): 'approved' | 'blocked' | 'pending' {
    const normalized = label.toLowerCase();
    if (normalized.includes('approved')) return 'approved';
    if (normalized.includes('rejected')) return 'blocked';
    return 'pending';
  }

  function cardTitle(request: DetailLinkRequest) {
    return opposingLinkTitle({
      title: request.title,
      otherRecordTitle: request.otherRecordVote?.projectTitle,
      targetTitle: request.targetTitle
    });
  }

  function metaLine(request: DetailLinkRequest) {
    return `${requestKindLabel(request)} · ${request.proposedByUsername}`;
  }

  function requestSideVoteLines(request: DetailLinkRequest) {
    return sideVoteLines({
      sourceTitle: request.sourceTitle,
      sourceVoteLabel: request.sourceVoteLabel,
      targetTitle: request.targetTitle,
      targetVoteLabel: request.targetVoteLabel
    });
  }
</script>

{#if requests.length > 0}
  <section class="vote-archive">
    <div class="archive-heading">
      <div class="heading-copy">
        <h2>Past link votes</h2>
        <p>Resolved create and sever votes stay here for context.</p>
      </div>
      <button class="archive-toggle" type="button" on:click={() => (archiveOpen = !archiveOpen)}>
        {archiveOpen ? 'Hide past link votes' : `Show past link votes (${requests.length})`}
      </button>
    </div>

    {#if archiveOpen}
      <div class="request-list">
        {#each requests as request (request.id)}
          <LinkCard
            title={cardTitle(request)}
            metaLine={metaLine(request)}
            sideVoteLines={requestSideVoteLines(request)}
            outcomeLabel={request.statusLabel}
            outcomeTone={outcomeTone(request.statusLabel)}
            icon={surfaceIconForKind(request.targetKind)}
            accentStyle={accentStyle(request)}
            href={request.targetHref ?? null}
            expanded={Boolean(expandedById[request.id])}
            onToggle={() => toggleExpanded(request.id)}
          >
            <p>{request.summary}</p>
            {#if request.targetDetail}
              {@const metaRows = targetDetailMetaRows(request.targetDetail)}
              {#if metaRows.length > 0}
                <div class="detail-meta">
                  {#each metaRows as row}
                    <span>{row}</span>
                  {/each}
                </div>
              {/if}
            {/if}
            <div class="vote-grid">
              {#each [request.thisRecordVote, request.otherRecordVote] as vote}
                <section class="vote-panel">
                  <div class="vote-head">
                    <strong>{vote.projectTitle}</strong>
                  </div>
                  <p>{formatLinkVoteSummary(vote)}</p>
                  <p class="vote-note">{vote.resultNote}</p>
                </section>
              {/each}
            </div>
          </LinkCard>
        {/each}
      </div>
    {/if}
  </section>
{/if}

<style>
  .vote-archive,
  .request-list,
  .heading-copy,
  .vote-grid,
  .vote-panel {
    display: grid;
    gap: 12px;
  }

  .archive-heading {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .archive-toggle {
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel);
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  h2,
  strong,
  p {
    margin: 0;
  }

  h2 {
    font-size: 15px;
  }

  p,
  .detail-meta,
  .vote-note {
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

  .vote-head {
    display: flex;
    gap: 10px;
    justify-content: space-between;
    flex-wrap: wrap;
  }
</style>
