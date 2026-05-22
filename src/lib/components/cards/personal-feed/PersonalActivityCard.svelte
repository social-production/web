<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import SubjectTablet from '$lib/components/cards/shared/SubjectTablet.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import { setVote } from '$lib/services/queries/feeds';
  import type { PersonalActivityItem, VoteDirection } from '$lib/types/feed';
  import { formatRelativeTime } from '$lib/utils/time';

  export let item: PersonalActivityItem;

  function buildCommentHref(href: string, subjectKind: PersonalActivityItem['subjectKind']) {
    const url = new URL(href, 'https://socialproduction.local');
    url.searchParams.delete('comment');
    url.searchParams.delete('update');
    url.hash = '';

    if (subjectKind === 'project' || subjectKind === 'event') {
      url.searchParams.set('tab', 'chat');
      return `${url.pathname}${url.search}`;
    }

    url.hash = 'comments';
    return `${url.pathname}${url.search}${url.hash}`;
  }

  $: orderedTags = [...item.channelTags, ...item.communityTags];
  $: commentHref = buildCommentHref(item.href, item.subjectKind);

  async function handleVote(event: CustomEvent<{ vote: VoteDirection }>) {
    await setVote(item.subjectId, event.detail.vote);
    await invalidateAll();
  }

  $: verbLabel = item.actionLabel || 'Created';
</script>

<FeedSurface href={item.href} tone="personal">
  <div class="header-row">
    <div class="identity-row">
      <AvatarBadge size="sm" username={item.author.username} imageUrl={item.author.profileImageUrl ?? null} />
      <div class="identity-copy">
        <div class="name-line">
          <a class="name" href={`/profile/${item.author.username}`}>{item.author.username}</a>
          <span class="action">- {verbLabel}</span>
          <SubjectTablet kind={item.subjectKind} projectMode={item.subjectProjectMode ?? 'productive'} />
        </div>
      </div>
    </div>

    <div class="tag-stack">
      <TagList columns={4} tags={orderedTags} />
    </div>
  </div>

  <a class="title" href={item.href}>{item.title}</a>
  <p class="body">{item.body}</p>

  {#if item.subjectKind === 'project' && item.subjectFundProgress}
    <div class="fund-progress-card">
      <div class="fund-progress-copy">
        <strong>{item.subjectFundProgress.title}</strong>
        <span>{item.subjectFundProgress.raisedLabel} raised · target {item.subjectFundProgress.targetLabel}</span>
        <strong>{item.subjectFundProgress.progressPercent}%</strong>
      </div>
      <div class="progress-rail">
        <div class="progress-fill" style={`width: ${item.subjectFundProgress.progressPercent}%`}></div>
      </div>
    </div>
  {/if}

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

  .identity-copy,
  .tag-stack {
    display: grid;
    gap: 6px;
  }

  .name,
  .action,
  .body {
    margin: 0;
  }

  .name {
    font-weight: 800;
  }

  .action,
  .body {
    color: var(--text-soft);
  }

  .title {
    display: inline-block;
    margin-top: 10px;
    font-size: 16px;
    font-weight: 800;
  }

  .fund-progress-card {
    display: grid;
    gap: 10px;
    margin-top: 12px;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .fund-progress-copy {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .progress-rail {
    width: 100%;
    height: 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--panel-border) 74%, var(--panel));
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--brand) 0%, color-mix(in srgb, var(--brand) 65%, white) 100%);
  }

  .body {
    margin-top: 6px;
    line-height: 1.4;
  }

  .footer {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--panel-border);
    color: var(--text-soft);
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