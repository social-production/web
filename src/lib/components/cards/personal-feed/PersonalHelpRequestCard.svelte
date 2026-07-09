<script lang="ts">
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import SurfaceTypeLabel from '$lib/components/cards/shared/SurfaceTypeLabel.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import { castFeedVote } from '$lib/services/queries/feeds';
  import type { PersonalHelpRequestItem, VoteDirection } from '$lib/types/feed';
  import { surfaceTypeAccent } from '$lib/utils/surfaceType';
  import { formatLocalDateTime, formatRelativeTime } from '$lib/utils/time';

  export let item: PersonalHelpRequestItem;

  $: orderedTags = [...item.channelTags, ...item.communityTags];
  $: whenLabel = formatLocalDateTime(item.neededAt);
  $: roleCount = item.roles.length;
  $: signupSummary =
    item.signupCount != null && item.slotsNeeded != null && item.slotsNeeded > 0
      ? `${item.signupCount} signed up · ${item.slotsNeeded} needed`
      : roleCount > 0
        ? `${roleCount} ${roleCount === 1 ? 'role' : 'roles'} needed`
        : '';

  async function handleVote(event: CustomEvent<{ vote: VoteDirection }>) {
    await castFeedVote(item.id, event.detail.vote);
  }
</script>

<FeedSurface href={item.href} tone="personal" accent={surfaceTypeAccent('help-request')}>
  <div class="header-row">
    <div class="identity-row">
      <AvatarBadge size="sm" username={item.author.username} imageUrl={item.author.profileImageUrl ?? null} />
      <div class="identity-copy">
        <div class="name-line">
          <a class="name header-name" href={`/profile/${item.author.username}`}>{item.author.username}</a>
          <SurfaceTypeLabel kind="help-request" />
          {#if item.feedSource === 'discovery'}
            <span class="meta-note">· Popular</span>
          {/if}
        </div>
      </div>
    </div>

    {#if orderedTags.length > 0}
      <div class="tag-stack">
        <TagList tags={orderedTags} />
      </div>
    {/if}
  </div>

  <a class="title" href={item.href}>{item.title}</a>
  <p class="body">{item.body}</p>
  {#if whenLabel || item.locationLabel}
    <p class="location">{[whenLabel, item.locationLabel].filter(Boolean).join(' · ')}</p>
  {/if}
  {#if signupSummary}
    <p class="signup-summary">{signupSummary}</p>
  {/if}

  <div class="footer">
    <div class="engagement-row">
      <VoteStrip activeVote={item.activeVote} count={item.voteCount} on:vote={handleVote} />
      <a class="comment-link" href={`${item.href}?tab=chat`}>
        <CountPill label={`${item.commentCount} comments`} />
      </a>
    </div>
    <div class="footer-meta">
      <span>{formatRelativeTime(item.createdAt)}</span>
    </div>
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

  .identity-copy,
  .tag-stack {
    min-width: 0;
  }

  .tag-stack {
    margin-left: auto;
    flex: 0 1 auto;
  }

  .name,
  .body {
    margin: 0;
  }

  .name {
    font-weight: 800;
  }

  .body,
  .meta-note {
    color: var(--text-soft);
  }

  .meta-note {
    font-size: 12px;
    font-weight: 600;
  }

  .header-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 10rem;
  }

  .title {
    display: inline-block;
    margin-top: 10px;
    font-size: 16px;
    font-weight: 800;
  }

  .body {
    margin-top: 6px;
    line-height: 1.4;
  }

  .location,
  .signup-summary {
    margin: 8px 0 0;
    font-size: 13px;
    color: var(--text-soft);
  }

  .signup-summary {
    font-weight: 700;
    color: var(--text-main);
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

  .footer-meta {
    text-align: right;
    white-space: nowrap;
  }

  @media (max-width: 760px) {
    .header-name {
      max-width: 7rem;
      font-size: 15px;
    }

    .footer-meta {
      text-align: left;
    }
  }
</style>
