<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import SurfaceTypeLabel from '$lib/components/cards/shared/SurfaceTypeLabel.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import { setVote } from '$lib/services/queries/feeds';
  import type { PublicProjectItem, VoteDirection } from '$lib/types/feed';
  import { surfaceTypeAccent } from '$lib/utils/surfaceType';
  import { describeUpdateTime } from '$lib/utils/time';

  export let item: PublicProjectItem;

  $: orderedTags = [...item.channelTags, ...item.communityTags];
  $: participantLabel = item.memberCount === 1 ? 'member' : 'members';

  async function handleVote(event: CustomEvent<{ vote: VoteDirection }>) {
    await setVote(item.id, event.detail.vote);
    await invalidateAll();
  }
</script>

<FeedSurface href={item.href} tone="public" accent={surfaceTypeAccent('project', item.projectMode)}>
  <div class="header-row">
    <div class="chips">
      <SurfaceTypeLabel kind="project" projectMode={item.projectMode} />
      {#if item.stage}
        <span class="meta-note">· {item.stage}</span>
      {/if}
    </div>

    <div class="tag-stack">
      <TagList tags={orderedTags} />
    </div>
  </div>

  <a class="title" href={item.href}>{item.title}</a>
  <p class="summary">{item.summary}</p>

  {#if item.latestDescription}
    <p class="latest-summary">Latest: {item.latestDescription}</p>
  {/if}

  {#if item.fundProgress}
    <div class="fund-progress-card">
      <div class="fund-progress-copy">
        <strong>{item.fundProgress.title}</strong>
        <span>{item.fundProgress.raisedLabel} raised · target {item.fundProgress.targetLabel}</span>
        <strong>{item.fundProgress.progressPercent}%</strong>
      </div>
      <div class="progress-rail">
        <div class="progress-fill" style={`width: ${item.fundProgress.progressPercent}%`}></div>
      </div>
    </div>
  {/if}

  <div class="footer">
    <div class="engagement-row">
      <VoteStrip activeVote={item.activeVote} count={item.voteCount} on:vote={handleVote} />
      <a class="comment-link" href={`${item.href}?tab=chat`}>
        <CountPill label={`${item.commentCount} comments`} />
      </a>
    </div>
    <div class="footer-meta">
      <span>
        <a class="inline-link" href={`/profile/${item.authorUsername}`}>{item.authorUsername}</a>
        · {item.memberCount} {participantLabel}
        · <span class="activity-stamp">{describeUpdateTime(item.createdAt, item.latestUpdateAt)}</span>
      </span>
    </div>
  </div>
</FeedSurface>

<style>
  .header-row,
  .footer {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .header-row,
  .footer {
    justify-content: space-between;
  }

  .chips {
    display: flex;
    gap: 0.45rem;
    flex-wrap: nowrap;
    align-items: center;
    flex: 1 1 auto;
    min-width: 0;
  }

  .meta-note {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 600;
  }

  .title {
    display: inline-block;
    margin-top: 10px;
    font-size: 16px;
    font-weight: 800;
  }

  .summary,
  .latest-summary {
    margin: 6px 0 0;
    color: var(--text-soft);
    line-height: 1.4;
  }

  .summary,
  .latest-summary {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
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

  .summary {
    line-clamp: 3;
    -webkit-line-clamp: 3;
  }

  .latest-summary {
    line-clamp: 2;
    -webkit-line-clamp: 2;
    color: var(--text-main);
    opacity: 0.84;
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
    border-radius: var(--radius-sm);
    outline: none;
  }

  .comment-link:hover,
  .comment-link:focus-visible {
    color: inherit;
  }

  .footer-meta {
    text-align: right;
  }

  .inline-link {
    color: var(--text-main);
    font-weight: 700;
  }

  .activity-stamp {
    white-space: nowrap;
  }

  @media (max-width: 760px) {
    .footer-meta {
      text-align: left;
    }
  }
</style>