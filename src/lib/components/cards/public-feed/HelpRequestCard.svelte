<script lang="ts">
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import SurfaceTypeLabel from '$lib/components/cards/shared/SurfaceTypeLabel.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import ReportControl from '$lib/components/shared/ReportControl.svelte';
  import ContentMetaRow from '$lib/components/shared/ContentMetaRow.svelte';
  import { castFeedVote } from '$lib/services/commands/shared';
  import type { PublicHelpRequestItem, VoteDirection } from '$lib/types/feed';
  import { surfaceTypeAccent } from '$lib/utils/surfaceType';
  import { formatLocalDateTime } from '$lib/utils/time';

  export let item: PublicHelpRequestItem;

  $: orderedTags = [...(item.channelTags ?? []), ...(item.communityTags ?? [])];
  $: whenLabel = formatLocalDateTime(item.neededAt);
  $: signupSummary =
    item.signupCount != null && item.slotsNeeded != null && item.slotsNeeded > 0
      ? `${item.signupCount} signed up · ${item.slotsNeeded} needed`
      : item.signupCount != null && item.signupCount > 0
        ? `${item.signupCount} signed up`
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
  tone="public"
  accent={surfaceTypeAccent('help-request')}
>
  <div class="header-row">
    <div class="chips">
      <SurfaceTypeLabel kind="help-request" />
      <ReportControl
        hasActiveReport={item.hasActiveReport}
        isUnderReview={item.isUnderReview}
        itemLabel="help request"
        moderationState={item.moderationState}
        ownerUsername={item.authorUsername}
        report={item.report ?? null}
        subjectId={item.id}
        targetId={item.id}
        targetType="help_request"
      />
    </div>

    <div class="tag-stack">
      <TagList tags={orderedTags} />
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
    <div class="engagement-row">
      <VoteStrip activeVote={item.activeVote} count={item.voteCount} syncKey={item.id} onvote={handleVote} />
      <a class="comment-link" href={`${item.href}?tab=chat`}>
        <CountPill label={`${item.commentCount} comments`} />
      </a>
    </div>
    <div class="footer-meta">
      <ContentMetaRow
        authorUsername={item.authorUsername}
        createdAt={item.createdAt}
        updatedAt={item.lastActivityAt ?? item.createdAt}
      />
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

  .header-row {
    justify-content: space-between;
  }

  .chips {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    align-items: center;
    flex: 1 1 auto;
    min-width: 0;
  }

  .tag-stack {
    margin-left: auto;
    flex: 0 1 auto;
    min-width: 0;
  }

  .footer {
    justify-content: space-between;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--panel-border);
    font-size: 13px;
    color: var(--text-soft);
  }

  .title {
    display: inline-block;
    margin-top: 10px;
    font-size: 16px;
    font-weight: 800;
  }

  .body {
    margin: 6px 0 0;
    line-height: 1.4;
    color: var(--text-soft);
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
  }

  @media (max-width: 760px) {
    .footer-meta {
      text-align: left;
    }
  }
</style>
