<script lang="ts">
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import { castFeedVote } from '$lib/services/commands/shared';
  import type { PersonalCommentActivityItem, VoteDirection } from '$lib/types/feed';
  import { surfaceTypeAccent } from '$lib/utils/surfaceType';
  import ContentMetaRow from '$lib/components/shared/ContentMetaRow.svelte';

  export let item: PersonalCommentActivityItem;

  function buildCommentHref(href: string) {
    const url = new URL(href, 'https://socialproduction.local');
    if (!url.searchParams.get('comment')) {
      url.hash = 'comments';
    }
    return `${url.pathname}${url.search}${url.hash}`;
  }

  $: commentHref = buildCommentHref(item.href);
  $: replyLabel = item.commentCount === 1 ? '1 reply' : `${item.commentCount} replies`;

  async function handleVote({ vote }: { vote: VoteDirection }) {
    return castFeedVote(
      { id: item.voteTargetId, type: 'comment' },
      vote,
      {
        activeVote: item.activeVote,
        voteCount: item.voteCount
      }
    );
  }
</script>

<FeedSurface href={item.href} tone="personal" accent={surfaceTypeAccent(item.subjectKind)}>
  <p class="comment-excerpt">{item.commentExcerpt}</p>

  <div class="footer">
    <div class="engagement-row feed-corner-actions">
      <VoteStrip corner activeVote={item.activeVote} count={item.voteCount} syncKey={item.id} onvote={handleVote} />
      <a class="comment-link" href={commentHref}>
        <CountPill label={replyLabel} />
      </a>
    </div>
    <div class="footer-meta">
      <ContentMetaRow timeOnly createdAt={item.createdAt} />
    </div>
  </div>
</FeedSurface>

<style>
  .footer,
  .engagement-row {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .footer {
    gap: 8px;
    justify-content: space-between;
    flex-wrap: nowrap;
  }

  .comment-excerpt {
    margin: 0;
    color: var(--text-main);
    font-size: 15px;
    line-height: 1.45;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .footer {
    margin-top: 12px;
  }

  .engagement-row {
    gap: 8px;
    flex: 0 0 auto;
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
    .comment-excerpt {
      font-size: 16px;
    }
  }
</style>
