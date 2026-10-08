<script lang="ts">
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import LinkedPostBody from '$lib/components/shared/LinkedPostBody.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import ReportControl from '$lib/components/shared/ReportControl.svelte';
  import ContentMetaRow from '$lib/components/shared/ContentMetaRow.svelte';
  import { castFeedVote } from '$lib/services/commands/shared';
  import type { PersonalPostItem, VoteDirection } from '$lib/types/feed';
  import { surfaceTypeAccent } from '$lib/utils/surfaceType';
  import PersonalFeedIdentity from '$lib/components/cards/personal-feed/PersonalFeedIdentity.svelte';

  export let item: PersonalPostItem;

  function buildCommentHref(href: string) {
    const url = new URL(href, 'https://socialproduction.local');
    url.searchParams.delete('comment');
    url.hash = 'comments';
    return `${url.pathname}${url.search}${url.hash}`;
  }

  $: commentHref = buildCommentHref(item.href);

  async function handleVote({ vote }: { vote: VoteDirection }) {
    return castFeedVote(
      { id: item.voteTargetId, type: 'post' },
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
  accent={surfaceTypeAccent('post')}
>
  <div class="card-header">
    <div class="header-row">
      <PersonalFeedIdentity
        username={item.author.username}
        profileImageUrl={item.author.profileImageUrl ?? null}
      />
      <ReportControl
        hasActiveReport={item.hasActiveReport}
        isUnderReview={item.isUnderReview}
        itemLabel="post"
        moderationState={item.moderationState}
        ownerUsername={item.author.username}
        report={item.report ?? null}
        subjectId={item.id}
        targetId={item.id}
        targetType="post"
      />
    </div>
  </div>

  <LinkedPostBody body={item.body} links={item.linkedSubjects ?? []} variant="feed" />

  <div class="footer">
    <div class="engagement-row feed-corner-actions">
      <VoteStrip corner activeVote={item.activeVote} count={item.voteCount} syncKey={item.id} onvote={handleVote} />
      <a class="comment-link" href={commentHref}>
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
    flex-wrap: nowrap;
    align-items: center;
  }

  .footer {
    flex-wrap: nowrap;
    margin: 0;
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