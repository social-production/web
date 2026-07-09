<script lang="ts">
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import SurfaceTypeLabel from '$lib/components/cards/shared/SurfaceTypeLabel.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import { castFeedVote } from '$lib/services/queries/feeds';
  import type { PersonalCommentActivityItem, VoteDirection } from '$lib/types/feed';
  import { surfaceTypeAccent } from '$lib/utils/surfaceType';
  import { formatRelativeTime } from '$lib/utils/time';

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

  async function handleVote(event: CustomEvent<{ vote: VoteDirection }>) {
    await castFeedVote(item.voteTargetId, event.detail.vote);
  }
</script>

<FeedSurface href={item.href} tone="personal" accent={surfaceTypeAccent(item.subjectKind)}>
  <div class="header-row">
    <div class="identity-row">
      <AvatarBadge size="sm" username={item.author.username} imageUrl={item.author.profileImageUrl ?? null} />
      <div class="identity-copy">
        <div class="name-line">
          <a class="name" href={`/profile/${item.author.username}`}>{item.author.username}</a>
          <span class="action">- commented on</span>
          <SurfaceTypeLabel kind={item.subjectKind} />
        </div>
      </div>
    </div>
  </div>

  <a class="subject-title" data-sveltekit-noscroll href={item.href}>{item.subjectTitle}</a>
  <p class="comment-excerpt">{item.commentExcerpt}</p>

  <div class="footer">
    <div class="engagement-row">
      <VoteStrip activeVote={item.activeVote} count={item.voteCount} on:vote={handleVote} />
      <a class="comment-link" href={commentHref}>
        <CountPill label={replyLabel} />
      </a>
    </div>
    <span class="time">{formatRelativeTime(item.createdAt)}</span>
  </div>
</FeedSurface>

<style>
  .header-row,
  .identity-row,
  .name-line,
  .footer {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .header-row,
  .footer {
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .identity-row {
    display: flex;
    gap: 0.6rem;
    align-items: center;
    flex: 1 1 auto;
    min-width: 0;
  }

  .name-line {
    display: flex;
    gap: 0.45rem;
    align-items: center;
    flex-wrap: nowrap;
    min-width: 0;
  }

  .identity-copy {
    display: grid;
    gap: 4px;
    min-width: 0;
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
  .time,
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
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  .comment-link {
    text-decoration: none;
    color: inherit;
    border-radius: var(--radius-sm);
  }

  .time {
    white-space: nowrap;
  }

  @media (max-width: 760px) {
    .name {
      max-width: 7rem;
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
