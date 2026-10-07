<script lang="ts">
  import { page } from '$app/stores';
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import FeedCardTop from '$lib/components/cards/shared/FeedCardTop.svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import ReportControl from '$lib/components/shared/ReportControl.svelte';
  import ContentMetaRow from '$lib/components/shared/ContentMetaRow.svelte';
  import { submitFeedEntitySignal } from '$lib/utils/signalEngagement';
  import type { PublicEventItem } from '$lib/types/feed';
  import { requireViewer } from '$lib/utils/requireViewer';
  import { surfaceTypeAccent } from '$lib/utils/surfaceType';
  import { isImplementedScheduleLabel } from '$lib/utils/scheduleMeta';
  import { formatLocalDateTime } from '$lib/utils/time';

  let { item }: { item: PublicEventItem } = $props();

  const orderedTags = $derived([...(item.channelTags ?? []), ...(item.communityTags ?? [])]);
  const scheduleTime = $derived(
    item.scheduledAt
      ? formatLocalDateTime(item.scheduledAt)
      : isImplementedScheduleLabel(item.timeLabel)
        ? item.timeLabel.trim()
        : ''
  );
  const scheduleLocation = $derived(
    isImplementedScheduleLabel(item.locationLabel) ? item.locationLabel.trim() : ''
  );
  const signalsDisabled = $derived(Boolean(item.isClosed));

  async function handleSignal(signal: 'demand' | 'opposition') {
    if (!requireViewer($page.data.bootstrap?.viewer, 'Sign in to support this event.') || signalsDisabled) {
      return;
    }

    return submitFeedEntitySignal('event', item.slug, signal);
  }
</script>

<FeedSurface
  contentRestricted={item.moderationState === 'hidden'}
  href={item.href}
  tone="public"
  accent={surfaceTypeAccent('event')}
>
  <FeedCardTop stage={item.stage ?? ''} tags={orderedTags}>
    <ReportControl
      hasActiveReport={item.hasActiveReport}
      isUnderReview={item.isUnderReview}
      itemLabel="event"
      moderationState={item.moderationState}
      ownerUsername={item.createdByUsername}
      report={item.report ?? null}
      subjectId={item.id}
      targetId={item.id}
      targetType="event"
    />
  </FeedCardTop>

  <a class="title" data-sveltekit-preload-data="hover" href={item.href}>{item.title}</a>
  <p class="body">{item.description}</p>
  {#if item.latestUpdateBody}
    <p class="latest-summary">Latest: {item.latestUpdateBody}</p>
  {/if}
  {#if scheduleTime || scheduleLocation}
    <p class="location">{[scheduleTime, scheduleLocation].filter(Boolean).join(' · ')}</p>
  {/if}

  <div class="footer">
    <div class="engagement-row feed-corner-actions">
      <VoteStrip corner
        mode="signals"
        syncKey={item.id}
        supportCount={item.supportCount}
        opposeCount={item.opposeCount}
        favorability={item.favorability}
        viewerSignal={item.viewerSignal}
        disabled={signalsDisabled}
        onsignal={handleSignal}
      />
      <a class="comment-link" href={`${item.href}?tab=chat`}>
        <CountPill label={`${item.commentCount} comments`} />
      </a>
    </div>
    <div class="footer-meta">
      <ContentMetaRow
        authorUsername={item.createdByUsername}
        memberCount={item.memberCount}
        createdAt={item.createdAt}
        updatedAt={item.latestUpdateAt}
      />
    </div>
  </div>
</FeedSurface>

<style>
  .footer {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: nowrap;
    justify-content: space-between;
  }

  .title {
    display: inline-block;
    margin-top: 10px;
    font-size: 16px;
    font-weight: 800;
  }

  .body,
  .location,
  .latest-summary,
  .footer {
    color: var(--text-soft);
  }

  .body,
  .location,
  .latest-summary {
    margin: 6px 0 0;
    line-height: 1.4;
  }

  .body {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-clamp: 3;
    -webkit-line-clamp: 3;
  }

  .latest-summary {
    display: -webkit-box;
    overflow: hidden;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    color: var(--text-main);
    opacity: 0.84;
  }

  .footer {
    margin-top: 12px;
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
</style>
