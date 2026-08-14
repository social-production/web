<script lang="ts">
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import SurfaceTypeLabel from '$lib/components/cards/shared/SurfaceTypeLabel.svelte';
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
  <div class="card-header">
    <div class="context-row">
      <span class="action">commented on</span>
      <SurfaceTypeLabel kind={item.subjectKind} />
    </div>
    <div class="header-row">
      <div class="identity-row">
        <AvatarBadge size="sm" username={item.author.username} imageUrl={item.author.profileImageUrl ?? null} />
        <a class="name" href={`/profile/${item.author.username}`}>{item.author.username}</a>
      </div>
    </div>
  </div>

  <a class="subject-title" data-sveltekit-noscroll data-sveltekit-preload-data="hover" href={item.href}>{item.subjectTitle}</a>
  <p class="comment-excerpt">{item.commentExcerpt}</p>

  <div class="footer">
    <div class="engagement-row">
      <VoteStrip activeVote={item.activeVote} count={item.voteCount} syncKey={item.id} onvote={handleVote} />
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
  .card-header {
    display: grid;
    gap: 6px;
    min-width: 0;
  }

  .context-row,
  .header-row,
  .identity-row,
  .footer,
  .engagement-row {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .context-row {
    gap: 6px;
    color: var(--text-soft);
  }

  .header-row,
  .footer {
    gap: 8px;
    justify-content: space-between;
    flex-wrap: nowrap;
  }

  .identity-row {
    gap: 0.6rem;
    flex: 1 1 auto;
  }

  .name {
    color: var(--text-main);
    font-weight: 800;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 10rem;
  }

  .action,
  .comment-excerpt {
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.45;
  }

  .subject-title {
    color: var(--text-main);
    font-size: 15px;
    font-weight: 800;
    line-height: 1.35;
  }

  .comment-excerpt {
    margin: 0;
    font-size: 13px;
  }

  .footer {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--panel-border);
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
    .name {
      max-width: min(7rem, 28vw);
      font-size: 14px;
    }

    .subject-title {
      font-size: 16px;
    }

    .comment-excerpt {
      font-size: 14px;
    }
  }
</style>
