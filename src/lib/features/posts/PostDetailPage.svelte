<script lang="ts">
  import { page } from '$app/stores';
  import { invalidateAll } from '$app/navigation';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import DiscussionPanel from '$lib/components/discussion/DiscussionPanel.svelte';
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import LinkedPostBody from '$lib/components/shared/LinkedPostBody.svelte';
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import SurfaceTypeLabel from '$lib/components/cards/shared/SurfaceTypeLabel.svelte';
  import ReportControl from '$lib/components/shared/ReportControl.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import { setVote } from '$lib/services/queries/feeds';
  import type { PostPageData } from '$lib/types/detail';
  import type { VoteDirection } from '$lib/types/feed';
  import { surfaceTypeAccent } from '$lib/utils/surfaceType';
  import { formatRelativeTime } from '$lib/utils/time';

  export let data: PostPageData;

  function readCommentTarget(url: URL) {
    if (url.hash.startsWith('#comment-')) {
      return url.hash.slice('#comment-'.length) || null;
    }

    return url.searchParams.get('comment');
  }

  $: highlightedCommentId = readCommentTarget($page.url);
  $: feedTone = (data.audience === 'followers' ? 'personal' : 'public') as 'public' | 'personal';

  async function handleVote(event: CustomEvent<{ vote: VoteDirection }>) {
    await setVote(data.id, event.detail.vote);
    await invalidateAll();
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
          </div>
        </div>
      </div>

      <ReportControl
        itemLabel="post"
        report={data.report}
        ownerUsername={data.authorUsername}
        subjectId={data.id}
        targetId={data.id}
      />
    </div>

    <LinkedPostBody body={data.body} links={data.linkedSubjects ?? []} variant="detail" />

    <div class="engagement-row">
      <div class="engagement-actions">
        <VoteStrip activeVote={data.activeVote} count={data.voteCount} on:vote={handleVote} />
        <CountPill label={`${data.commentCount} comments`} />
      </div>
      <span>{formatRelativeTime(data.createdAt)}</span>
    </div>

    <div class="comments-divider" aria-hidden="true"></div>

    <DiscussionPanel {data} {highlightedCommentId} embedded />
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
