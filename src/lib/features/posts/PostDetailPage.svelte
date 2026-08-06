<script lang="ts">
  import { page } from '$app/stores';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import DiscussionPanel from '$lib/components/discussion/DiscussionPanel.svelte';
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import LinkedPostBody from '$lib/components/shared/LinkedPostBody.svelte';
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import SurfaceTypeLabel from '$lib/components/cards/shared/SurfaceTypeLabel.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import IconMenuButton from '$lib/components/shared/IconMenuButton.svelte';
  import ReportControl from '$lib/components/shared/ReportControl.svelte';
  import ModerationRestrictionNotice from '$lib/components/shared/ModerationRestrictionNotice.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import { setVote } from '$lib/services/commands/shared';
  import type { PostPageData } from '$lib/types/detail';
  import type { VoteDirection } from '$lib/types/feed';
  import { applyVoteTarget } from '$lib/utils/feedSignals';
  import { surfaceTypeAccent } from '$lib/utils/surfaceType';
  import { formatRelativeTime } from '$lib/utils/time';

  export let data: PostPageData;

  type CommentSort = 'oldest' | 'newest' | 'top';

  const sortOptions = [
    { value: 'oldest', label: 'Oldest first' },
    { value: 'newest', label: 'Newest first' },
    { value: 'top', label: 'Top voted' }
  ];

  let sortMode: CommentSort = 'oldest';
  let localActiveVote = data.activeVote;
  let localVoteCount = data.voteCount;
  let lastVoteSyncKey = data.id;

  function readCommentTarget(url: URL) {
    if (url.hash.startsWith('#comment-')) {
      return url.hash.slice('#comment-'.length) || null;
    }

    return url.searchParams.get('comment');
  }

  $: highlightedCommentId = readCommentTarget($page.url);
  $: feedTone = (data.audience === 'followers' ? 'personal' : 'public') as 'public' | 'personal';
  $: if (data.id !== lastVoteSyncKey) {
    lastVoteSyncKey = data.id;
    localActiveVote = data.activeVote;
    localVoteCount = data.voteCount;
  }

  async function handleVote({ vote }: { vote: VoteDirection }) {
    const next = applyVoteTarget(localActiveVote, localVoteCount, vote);
    localActiveVote = next.activeVote;
    localVoteCount = next.voteCount;
    await setVote({ id: data.id, type: 'post' }, vote);
  }
</script>

<section class="page">
  <FeedSurface tone={feedTone} accent={surfaceTypeAccent('post')} isLast>
    <div class="identity-row">
      <div class="identity-main">
        <AvatarBadge size="md" username={data.authorUsername} imageUrl={data.authorProfileImageUrl ?? null} />
        <div class="identity-copy">
          <div class="name-line">
            <a class="inline-link" href={`/profile/${data.authorUsername}`}>{data.authorUsername}</a>
            <SurfaceTypeLabel kind="post" />
            <ReportControl
              hasActiveReport={Boolean(data.report)}
              isUnderReview={data.moderationState === 'under_review' || data.report?.resolution === 'under_review' || data.report?.resolution === 'open'}
              itemLabel="post"
              moderationState={data.moderationState}
              report={data.report}
              ownerUsername={data.authorUsername}
              subjectId={data.id}
              targetId={data.id}
              targetType="post"
            />
          </div>
        </div>
      </div>
    </div>

    <ModerationRestrictionNotice active={data.moderationState === 'hidden' || data.report?.resolution === 'hidden'}>
      <LinkedPostBody body={data.body} links={data.linkedSubjects ?? []} variant="detail" />
    </ModerationRestrictionNotice>

    <div class="engagement-row">
      <div class="engagement-actions">
        <VoteStrip activeVote={localActiveVote} count={localVoteCount} syncKey={data.id} onvote={handleVote} />
        <CountPill label={`${data.commentCount} comments`} />
        <IconMenuButton bind:value={sortMode} ariaLabel="Sort comments" defaultValue="oldest" options={sortOptions}>
          <FeedToolbarIcon name="sort" />
        </IconMenuButton>
      </div>
      <span>{formatRelativeTime(data.createdAt)}</span>
    </div>

    <div class="comments-divider" aria-hidden="true"></div>

    <DiscussionPanel {data} subjectType="post" {highlightedCommentId} bind:sortMode embedded />
  </FeedSurface>
</section>

<style>
  .page {
    display: grid;
    gap: 0;
    min-width: 0;
  }

  .comments-divider {
    margin: 16px 0 4px;
    border-top: 1px solid var(--panel-border);
  }

  .identity-row,
  .engagement-row,
  .engagement-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
    min-width: 0;
  }

  .engagement-row {
    justify-content: space-between;
    margin-top: 4px;
    width: 100%;
  }

  .identity-row {
    justify-content: space-between;
    width: 100%;
  }

  .identity-main {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    min-width: 0;
    flex: 1 1 auto;
  }

  .identity-copy {
    display: grid;
    gap: 6px;
    min-width: 0;
  }

  .name-line {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .inline-link {
    color: var(--text-main);
    font-size: 16px;
    font-weight: 800;
  }

  span {
    color: var(--text-soft);
    line-height: 1.5;
  }
</style>
