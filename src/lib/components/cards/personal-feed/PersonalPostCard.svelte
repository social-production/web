<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import LinkedPostBody from '$lib/components/shared/LinkedPostBody.svelte';
  import SubjectTablet from '$lib/components/cards/shared/SubjectTablet.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import { setVote } from '$lib/services/queries/feeds';
  import type { PersonalPostItem, VoteDirection } from '$lib/types/feed';
  import { formatRelativeTime } from '$lib/utils/time';

  export let item: PersonalPostItem;

  function buildCommentHref(href: string) {
    const url = new URL(href, 'https://socialproduction.local');
    url.searchParams.delete('comment');
    url.hash = 'comments';
    return `${url.pathname}${url.search}${url.hash}`;
  }

  $: commentHref = buildCommentHref(item.href);

  async function handleVote(event: CustomEvent<{ vote: VoteDirection }>) {
    await setVote(item.voteTargetId, event.detail.vote);
    await invalidateAll();
  }
</script>

<FeedSurface href={item.href} tone="personal">
  <div class="header-row">
    <div class="identity-row">
      <AvatarBadge size="sm" username={item.author.username} />
      <div class="identity-copy">
        <div class="name-line">
          <a class="name" href={`/profile/${item.author.username}`}>{item.author.username}</a>
          <SubjectTablet kind="post" />
        </div>
      </div>
    </div>
  </div>

  <LinkedPostBody body={item.body} links={item.linkedSubjects ?? []} variant="feed" />

  <div class="footer">
    <div class="engagement-row">
      <VoteStrip activeVote={item.activeVote} count={item.voteCount} on:vote={handleVote} />
      <a class="comment-link" href={commentHref}>
        <CountPill label={`${item.commentCount} comments`} />
      </a>
    </div>
    <span>{formatRelativeTime(item.createdAt)}</span>
  </div>
</FeedSurface>

<style>
  .header-row,
  .footer {
    display: flex;
    gap: 0.75rem;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
  }

  .identity-row,
  .name-line {
    display: flex;
    gap: 0.6rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .identity-copy {
    display: grid;
    gap: 6px;
  }

  .name,
  .footer {
    margin: 0;
  }

  .name {
    font-weight: 800;
  }

  .footer {
    color: var(--text-soft);
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
    flex-wrap: wrap;
  }

  .comment-link {
    text-decoration: none;
    color: inherit;
    border-radius: var(--radius-sm);
  }
</style>