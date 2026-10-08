<script lang="ts">
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import FeedCardTop from '$lib/components/cards/shared/FeedCardTop.svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import ReportControl from '$lib/components/shared/ReportControl.svelte';
  import ContentMetaRow from '$lib/components/shared/ContentMetaRow.svelte';
  import { castFeedVote } from '$lib/services/commands/shared';
  import type { PersonalHelpRequestItem, VoteDirection } from '$lib/types/feed';
  import { surfaceTypeAccent } from '$lib/utils/surfaceType';
  import { formatLocalDateTime } from '$lib/utils/time';
  import PersonalFeedIdentity from '$lib/components/cards/personal-feed/PersonalFeedIdentity.svelte';

  export let item: PersonalHelpRequestItem;

  $: orderedTags = [...(item.channelTags ?? []), ...(item.communityTags ?? [])];
  $: whenLabel = formatLocalDateTime(item.neededAt);
  $: roleCount = item.roles.length;
  $: signupSummary =
    item.signupCount != null && item.slotsNeeded != null && item.slotsNeeded > 0
      ? `${item.signupCount} signed up · ${item.slotsNeeded} needed`
      : roleCount > 0
        ? `${roleCount} ${roleCount === 1 ? 'role' : 'roles'} needed`
        : '';

  async function handleVote({ vote }: { vote: VoteDirection }) {
    return castFeedVote(
      { id: item.id, type: 'help_request' },
      vote,
      {
        activeVote: item.activeVote,
        voteCount: item.voteCount
      }
    );
  }
</script>

<FeedSurface
  contentRestricted={item.moderationState === 'hidden'}
  href={item.href}
  tone="personal"
  accent={surfaceTypeAccent('help-request')}
>
  <div class="card-header">
    <FeedCardTop tags={orderedTags}>
      <ReportControl
        hasActiveReport={item.hasActiveReport}
        isUnderReview={item.isUnderReview}
        itemLabel="help request"
        moderationState={item.moderationState}
        ownerUsername={item.author.username}
        report={item.report ?? null}
        subjectId={item.id}
        targetId={item.id}
        targetType="help_request"
      />
    </FeedCardTop>
    <div class="header-row">
      <PersonalFeedIdentity
        username={item.author.username}
        profileImageUrl={item.author.profileImageUrl ?? null}
      />
    </div>
  </div>

  <a class="title" data-sveltekit-preload-data="hover" href={item.href}>{item.title}</a>
  <p class="body">{item.body}</p>
  {#if whenLabel || item.locationLabel}
    <p class="location">{[whenLabel, item.locationLabel].filter(Boolean).join(' · ')}</p>
  {/if}
  {#if signupSummary}
    <p class="signup-summary">{signupSummary}</p>
  {/if}

  <div class="footer">
    <div class="engagement-row feed-corner-actions">
      <VoteStrip corner activeVote={item.activeVote} count={item.voteCount} syncKey={item.id} onvote={handleVote} />
      <a class="comment-link" href={`${item.href}?tab=chat`}>
        <CountPill label={`${item.commentCount} comments`} />
      </a>
    </div>
    <div class="footer-meta">
      <ContentMetaRow timeOnly createdAt={item.createdAt} />
    </div>
  </div>
</FeedSurface>

<style>
  .card-header {
    display: grid;
    gap: 6px;
    min-width: 0;
  }

  .header-row,
  .footer,
  .engagement-row {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .header-row,
  .footer {
    gap: 8px;
    justify-content: space-between;
  }

  .header-row {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .footer {
    flex-wrap: nowrap;
  }

  .body {
    margin: 0;
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
    color: var(--text-soft);
    font-size: 13px;
  }

  .engagement-row {
    gap: 8px;
    flex: 0 0 auto;
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
