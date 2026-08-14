<script lang="ts">
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import SurfaceTypeLabel from '$lib/components/cards/shared/SurfaceTypeLabel.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import ReportControl from '$lib/components/shared/ReportControl.svelte';
  import ContentMetaRow from '$lib/components/shared/ContentMetaRow.svelte';
  import { castFeedVote } from '$lib/services/commands/shared';
  import type { PublicThreadItem, VoteDirection } from '$lib/types/feed';
  import { invalidateThreadCache } from '$lib/utils/feedSignals';
  import { surfaceTypeAccent } from '$lib/utils/surfaceType';

  export let item: PublicThreadItem;

  $: orderedTags = [...(item.channelTags ?? []), ...(item.communityTags ?? [])];

  async function handleVote({ vote }: { vote: VoteDirection }) {
    const confirmed = await castFeedVote(
      { id: item.id, type: 'thread' },
      vote,
      {
        activeVote: item.activeVote,
        voteCount: item.voteCount
      }
    );
    void invalidateThreadCache(item.slug);
    return confirmed;
  }
</script>

<FeedSurface
  contentRestricted={item.moderationState === 'hidden'}
  href={item.href}
  tone="public"
  accent={surfaceTypeAccent('thread')}
>
  <div class="header-row">
    <div class="chips">
      <SurfaceTypeLabel kind="thread" />
      <ReportControl
        hasActiveReport={item.hasActiveReport}
        isUnderReview={item.isUnderReview}
        itemLabel="thread"
        moderationState={item.moderationState}
        ownerUsername={item.authorUsername}
        report={item.report ?? null}
        subjectId={item.id}
        targetId={item.id}
        targetType="thread"
      />
    </div>

    {#if orderedTags.length > 0}
      <div class="tag-stack">
        <TagList tags={orderedTags} />
      </div>
    {/if}
  </div>

  <a class="title" data-sveltekit-preload-data="hover" href={item.href}>{item.title}</a>
  <p class="body">{item.body}</p>

  <div class="footer">
    <div class="engagement-row">
      <VoteStrip activeVote={item.activeVote} count={item.voteCount} syncKey={item.id} onvote={handleVote} />
      <a class="comment-link" href={item.href}>
        <CountPill label={`${item.commentCount} comments`} />
      </a>
    </div>
    <div class="footer-meta">
      <ContentMetaRow
        authorUsername={item.authorUsername}
        createdAt={item.createdAt}
        updatedAt={item.lastActivityAt ?? item.createdAt}
      />
    </div>
  </div>
</FeedSurface>

<style>
  .header-row,
  .footer {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    justify-content: space-between;
  }

  .header-row {
    flex-wrap: wrap;
  }

  .footer {
    flex-wrap: nowrap;
  }

  .chips {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
    align-items: center;
    flex: 1 1 auto;
    min-width: 0;
  }

  .body,
  .footer {
    color: var(--text-soft);
  }

  .title {
    margin-top: 10px;
    font-size: 16px;
    font-weight: 800;
  }

  .body {
    margin: 6px 0 0;
    line-height: 1.4;
  }

  .tag-stack {
    margin-left: auto;
    flex: 0 1 auto;
    min-width: 0;
  }

  .footer {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--panel-border);
    font-size: 13px;
  }

  .engagement-row {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: nowrap;
  }

  .comment-link {
    text-decoration: none;
    color: inherit;
    border-radius: var(--radius-sm);
  }

  .footer-meta {
    margin-left: auto;
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-align: right;
    white-space: nowrap;
  }

  @media (max-width: 760px) {
    .title {
      font-size: 17px;
    }

    .body {
      font-size: 15px;
    }
  }
</style>
