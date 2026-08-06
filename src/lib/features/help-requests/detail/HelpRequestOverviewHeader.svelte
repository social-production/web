<script lang="ts">
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import SurfaceTypeLabel from '$lib/components/cards/shared/SurfaceTypeLabel.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import ReportControl from '$lib/components/shared/ReportControl.svelte';
  import ModerationRestrictionNotice from '$lib/components/shared/ModerationRestrictionNotice.svelte';
  import { setVote } from '$lib/services/commands/shared';
  import type { HelpRequestPageData } from '$lib/types/detail';
  import type { VoteDirection } from '$lib/types/feed';
  import { formatLocalDateTime, formatRelativeTime } from '$lib/utils/time';

  export let data: HelpRequestPageData;

  $: combinedTags = [...data.channelTags, ...data.communityTags];
  $: signedUp = data.roles.reduce((total, role) => total + role.filledCount, 0);
  $: needed = data.roles.reduce((total, role) => total + role.slots, 0);
  $: whenLabel = data.scheduleLabel?.trim() || formatLocalDateTime(data.neededAt);

  async function handleVote({ vote }: { vote: VoteDirection }) {
    await setVote({ id: data.id, type: 'help_request' }, vote);
  }
</script>

<div class="header-row">
  <div class="chips">
    <SurfaceTypeLabel kind="help-request" />
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
  </div>

  <div class="header-actions">
    <TagList tags={combinedTags} />
  </div>
</div>

<ModerationRestrictionNotice active={data.moderationState === 'hidden' || data.report?.resolution === 'hidden'}>
  <h1>{data.title}</h1>
  <p class="overview-copy">{data.body}</p>
</ModerationRestrictionNotice>

<section class="meta-block" aria-label="Help request overview details">
  <ul class="meta-list">
    {#if data.locationLabel}
      <li class="meta-item">
        <strong>Location</strong>
        <span>{data.locationLabel}</span>
      </li>
    {/if}
    {#if whenLabel}
      <li class="meta-item">
        <strong>When</strong>
        <span>{whenLabel}</span>
      </li>
    {/if}
    {#if needed > 0}
      <li class="meta-item">
        <strong>Signups</strong>
        <span>{signedUp} signed up · {needed} needed</span>
      </li>
    {/if}
  </ul>
</section>

<div class="overview-footer-row">
  <VoteStrip activeVote={data.activeVote} count={data.voteCount} syncKey={data.id} onvote={handleVote} />
  <a class="comment-link" href={`/help-requests/${data.id}?tab=chat`}>
    <CountPill label={`${data.commentCount} comments`} />
  </a>
  <span class="footer-author-row">
    <a class="inline-link" href={`/profile/${data.authorUsername}`}>{data.authorUsername}</a>
    · {formatRelativeTime(data.createdAt)}
  </span>
</div>

<style>
  .header-row,
  .chips,
  .header-actions,
  .overview-footer-row {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .header-row {
    justify-content: space-between;
    align-items: flex-start;
  }

  .chips {
    min-width: 0;
    flex: 1 1 auto;
  }

  .header-actions {
    flex: 0 1 auto;
    margin-left: auto;
    justify-content: flex-end;
  }

  .header-actions :global(.tag-list) {
    justify-content: flex-end;
  }

  :global(.report-control) {
    flex: 0 0 auto;
  }

  h1 {
    margin-top: 10px;
    font-size: 24px;
    letter-spacing: -0.02em;
    color: var(--text-main);
  }

  strong {
    font-size: 14px;
    color: var(--text-main);
  }

  .overview-copy {
    margin: 8px 0 16px;
    max-width: 78ch;
    color: var(--text-soft);
    line-height: 1.55;
  }

  .meta-block {
    padding: 18px 0 12px;
    border-top: 1px solid var(--panel-border);
  }

  .meta-list {
    display: grid;
    gap: 14px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .meta-item {
    display: grid;
    gap: 6px;
  }

  .meta-item span {
    color: var(--text-soft);
    line-height: 1.5;
  }

  .overview-footer-row {
    justify-content: flex-start;
    padding-top: 16px;
    padding-bottom: 12px;
    border-top: 1px solid var(--panel-border);
  }

  .footer-author-row {
    margin-left: auto;
    color: var(--text-soft);
  }

  .comment-link {
    color: inherit;
    text-decoration: none;
  }

  .inline-link {
    color: var(--text-main);
    font-weight: 700;
  }

  @media (max-width: 760px) {
    .footer-author-row {
      margin-left: 0;
      width: 100%;
    }
  }
</style>
