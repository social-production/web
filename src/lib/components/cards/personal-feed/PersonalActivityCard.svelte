<script lang="ts">
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import SurfaceTypeLabel from '$lib/components/cards/shared/SurfaceTypeLabel.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import ReportControl from '$lib/components/shared/ReportControl.svelte';
  import { castFeedVote } from '$lib/services/commands/shared';
  import { submitFeedEntitySignal } from '$lib/utils/signalEngagement';
  import type { PersonalActivityItem, VoteDirection } from '$lib/types/feed';
  import { toVoteTargetType } from '$lib/types/governance';
  import { surfaceTypeAccent } from '$lib/utils/surfaceType';
  import { formatRelativeTime } from '$lib/utils/time';
  import { page } from '$app/stores';
  import { requireViewer } from '$lib/utils/requireViewer';

  let { item }: { item: PersonalActivityItem } = $props();

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

  const orderedTags = $derived([...item.channelTags, ...item.communityTags]);
  const commentHref = $derived(buildCommentHref(item.href, item.subjectKind));
  const usesSignals = $derived(item.subjectKind === 'project' || item.subjectKind === 'event');
  const subjectSlug = $derived(
    item.subjectSlug ??
      item.href.split('/').filter(Boolean).at(-1)?.split('?')[0] ??
      ''
  );

  async function handleVote({ vote }: { vote: VoteDirection }) {
    return castFeedVote(
      { id: item.subjectId, type: toVoteTargetType(item.subjectKind) },
      vote,
      {
        activeVote: item.activeVote,
        voteCount: item.voteCount
      }
    );
  }

  async function handleSignal(signal: 'demand' | 'opposition') {
    if (!requireViewer($page.data.bootstrap?.viewer) || !subjectSlug || item.isClosed) {
      return;
    }

    if (item.subjectKind === 'project' || item.subjectKind === 'event') {
      return submitFeedEntitySignal(item.subjectKind, subjectSlug, signal);
    }
  }
</script>

<FeedSurface
  contentRestricted={item.moderationState === 'hidden'}
  href={item.href}
  tone="personal"
  accent={surfaceTypeAccent(item.subjectKind, item.subjectProjectMode ?? 'productive')}
>
  <div class="header-row">
    <div class="identity-row">
      <AvatarBadge size="sm" username={item.author.username} imageUrl={item.author.profileImageUrl ?? null} />
      <div class="identity-copy">
        <div class="name-line">
          <a class="name header-name" href={`/profile/${item.author.username}`}>{item.author.username}</a>
          <SurfaceTypeLabel kind={item.subjectKind} projectMode={item.subjectProjectMode ?? 'productive'} />
          <ReportControl
            hasActiveReport={item.hasActiveReport}
            interactive={false}
            isUnderReview={item.isUnderReview}
            itemLabel={item.subjectKind}
            moderationState={item.moderationState}
            report={item.report ?? null}
          />
        </div>
      </div>
    </div>

    {#if orderedTags.length > 0}
      <div class="tag-stack">
        <TagList tags={orderedTags} />
      </div>
    {/if}
  </div>

  <a class="title" data-sveltekit-preload-data="off" href={item.href}>{item.title}</a>
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
      {#if usesSignals}
        <VoteStrip
          mode="signals"
          syncKey={item.id}
          supportCount={item.supportCount}
          opposeCount={item.opposeCount}
          favorability={item.favorability}
          viewerSignal={item.viewerSignal}
          disabled={Boolean(item.isClosed)}
          onsignal={handleSignal}
        />
      {:else}
        <VoteStrip activeVote={item.activeVote} count={item.voteCount} syncKey={item.id} onvote={handleVote} />
      {/if}
      <a class="comment-link" href={commentHref}>
        <CountPill label={`${item.commentCount} comments`} />
      </a>
    </div>
    <div class="footer-meta">
      <span>{formatRelativeTime(item.createdAt)}</span>
    </div>
  </div>
</FeedSurface>

<style>
  .header-row {
    display: flex;
    gap: 0.75rem;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
  }

  .footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--panel-border);
    color: var(--text-soft);
    font-size: 13px;
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
    flex-wrap: wrap;
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

  .body {
    color: var(--text-soft);
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
    text-align: right;
    white-space: nowrap;
  }

  @media (max-width: 760px) {
    .header-name {
      max-width: 7rem;
      font-size: 15px;
    }

    .title {
      font-size: 17px;
    }

    .footer-meta {
      margin-left: 0;
      text-align: left;
    }
  }
</style>
