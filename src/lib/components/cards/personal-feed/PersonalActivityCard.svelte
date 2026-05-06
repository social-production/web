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

  $: orderedTags = [...item.channelTags, ...item.communityTags];

  async function handleVote(event: CustomEvent<{ vote: VoteDirection }>) {
    await setVote(item.subjectId, event.detail.vote);
    await invalidateAll();
  }

  $: verbLabel = item.actionLabel || 'Created';
</script>

<FeedSurface href={item.href} tone="personal">
  <div class="header-row">
    <div class="identity-row">
      <AvatarBadge size="sm" username={item.author.username} />
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

  <div class="footer">
    <div class="engagement-row">
      <VoteStrip activeVote={item.activeVote} count={item.voteCount} on:vote={handleVote} />
      <CountPill label={`${item.commentCount} comments`} />
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
</style>