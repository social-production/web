<script lang="ts">
  import FeedCardTop from '$lib/components/cards/shared/FeedCardTop.svelte';
  import ReportControl from '$lib/components/shared/ReportControl.svelte';
  import ModerationRestrictionNotice from '$lib/components/shared/ModerationRestrictionNotice.svelte';
  import ContentMetaRow from '$lib/components/shared/ContentMetaRow.svelte';
  import GuestBrowseLine from '$lib/components/shared/GuestBrowseLine.svelte';
  import { page } from '$app/stores';
  import type { HelpRequestPageData } from '$lib/types/detail';
  import { isImplementedScheduleLabel } from '$lib/utils/scheduleMeta';
  import { formatLocalDateTime } from '$lib/utils/time';

  export let data: HelpRequestPageData;

  $: combinedTags = [...data.channelTags, ...data.communityTags];
  $: timeLabel = data.neededAt
    ? formatLocalDateTime(data.neededAt)
    : isImplementedScheduleLabel(data.scheduleLabel)
      ? data.scheduleLabel.trim()
      : '';
  $: locationLabel = isImplementedScheduleLabel(data.locationLabel) ? data.locationLabel.trim() : '';
</script>

<div class="context-panel">
  <FeedCardTop tags={combinedTags}>
    <ReportControl
      hasActiveReport={Boolean(data.report)}
      isUnderReview={data.moderationState === 'under_review' || data.report?.resolution === 'under_review' || data.report?.resolution === 'open'}
      itemLabel="help request"
      moderationState={data.moderationState}
      report={data.report}
      ownerUsername={data.authorUsername}
      subjectId={data.id}
      targetId={data.id}
      targetType="help_request"
    />
  </FeedCardTop>

  <div class="heading overview-heading">
    <div class="identity-copy">
      <ModerationRestrictionNotice active={data.moderationState === 'hidden' || data.report?.resolution === 'hidden'}>
        <h1>{data.title}</h1>
      </ModerationRestrictionNotice>
      {#if timeLabel}
        <p class="live-fact">{timeLabel}</p>
      {/if}
      {#if locationLabel}
        <p class="live-fact">{locationLabel}</p>
      {/if}
      <GuestBrowseLine kind="help request" />
      <p class="overview-copy">{data.body}</p>
    </div>
  </div>

  <div class="context-meta">
    <ContentMetaRow
      authorUsername={data.authorUsername}
      authorHref={`/profile/${data.authorUsername}?from=${encodeURIComponent($page.url.pathname)}`}
      createdAt={data.createdAt}
    />
  </div>
</div>

<style>
  .context-panel {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-width: 0;
  }

  :global(.report-control) {
    flex: 0 0 auto;
  }

  .heading {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    margin-top: 4px;
    padding-bottom: 12px;
  }

  .identity-copy {
    display: grid;
    gap: 8px;
    min-width: 0;
  }

  h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }

  .live-fact {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.45;
  }

  .overview-copy {
    margin: 0;
    max-width: 78ch;
    color: var(--text-main);
    font-size: 15px;
    font-weight: 500;
    line-height: 1.55;
    overflow-wrap: anywhere;
    white-space: pre-line;
  }

  .context-meta {
    display: flex;
    justify-content: flex-end;
    width: 100%;
    min-width: 0;
    margin-top: auto;
    padding-top: 12px;
  }

  .context-meta :global(.content-meta-row) {
    margin-left: auto;
    max-width: 100%;
  }
</style>
