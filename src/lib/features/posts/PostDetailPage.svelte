<script lang="ts">
  import { page } from '$app/stores';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import DiscussionPanel from '$lib/components/discussion/DiscussionPanel.svelte';
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import LinkedPostBody from '$lib/components/shared/LinkedPostBody.svelte';
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import IconMenuButton from '$lib/components/shared/IconMenuButton.svelte';
  import ReportControl from '$lib/components/shared/ReportControl.svelte';
  import ModerationRestrictionNotice from '$lib/components/shared/ModerationRestrictionNotice.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import ContentMetaRow from '$lib/components/shared/ContentMetaRow.svelte';
  import GuestBrowseLine from '$lib/components/shared/GuestBrowseLine.svelte';
  import ShareUserMenu from '$lib/components/shared/ShareUserMenu.svelte';
  import { sharePostWithUser } from '$lib/services/commands/create';
  import { getMessageContacts } from '$lib/services/queries/inbox';
  import { setVote } from '$lib/services/commands/shared';
  import type { DetailMember } from '$lib/types/detail';
  import { buildShareUrl } from '$lib/utils/sharePrefill';
  import type { PostPageData } from '$lib/types/detail';
  import type { VoteDirection } from '$lib/types/feed';
  import { applyVoteTarget } from '$lib/utils/feedSignals';
  import { surfaceTypeAccent } from '$lib/utils/surfaceType';

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

  async function searchShareContacts(query: string): Promise<DetailMember[]> {
    try {
      const results = await getMessageContacts(query, 8);
      return results.map((contact) => ({
        id: contact.id,
        username: contact.username,
        bio: contact.bio ?? '',
        profileImageUrl: contact.profileImageUrl ?? null
      }));
    } catch {
      return [];
    }
  }

  function handlePostShare(username: string) {
    return sharePostWithUser(data.id, username);
  }

  async function handleVote({ vote }: { vote: VoteDirection }) {
    const next = applyVoteTarget(localActiveVote, localVoteCount, vote);
    localActiveVote = next.activeVote;
    localVoteCount = next.voteCount;
    await setVote({ id: data.id, type: 'post' }, vote);
  }
</script>

<section class="page">
  <FeedSurface tone={feedTone} accent={surfaceTypeAccent('post')} isLast clampExcerpts={false}>
    <div class="card-header">
      <div class="header-row">
        <div class="identity-row">
          <AvatarBadge size="sm" username={data.authorUsername} imageUrl={data.authorProfileImageUrl ?? null} />
          <a class="name header-name" href={`/profile/${data.authorUsername}`}>{data.authorUsername}</a>
        </div>
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

    <GuestBrowseLine kind="post" />

    <ModerationRestrictionNotice active={data.moderationState === 'hidden' || data.report?.resolution === 'hidden'}>
      <LinkedPostBody body={data.body} links={data.linkedSubjects ?? []} variant="detail" />
    </ModerationRestrictionNotice>

    <div class="footer detail-footer">
      <div class="engagement-row feed-corner-actions">
        <VoteStrip corner activeVote={localActiveVote} count={localVoteCount} syncKey={data.id} onvote={handleVote} />
        <span class="comment-link">
          <CountPill label={`${data.commentCount} comments`} />
        </span>
        <span class="detail-tool">
          <IconMenuButton bind:value={sortMode} ariaLabel="Sort comments" defaultValue="oldest" options={sortOptions}>
            <FeedToolbarIcon name="sort" />
          </IconMenuButton>
        </span>
        {#if $page.data.bootstrap?.viewer}
          <span class="detail-tool">
            <ShareUserMenu
              copyLinkUrl={buildShareUrl(`/posts/${data.id}`)}
              menuTitle="Share post"
              searchContacts={searchShareContacts}
              submitShare={handlePostShare}
            />
          </span>
        {/if}
      </div>
      <div class="footer-meta">
        <ContentMetaRow timeOnly createdAt={data.createdAt} />
      </div>
    </div>

    <DiscussionPanel {data} subjectType="post" {highlightedCommentId} bind:sortMode embedded />
  </FeedSurface>
</section>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-width: 0;
    min-height: calc(100dvh - var(--topbar-height, 0px) - var(--shell-bottom-nav-offset, 0px));
  }

  .page :global(.surface.has-accent) {
    --surface-pad-x: 12px;
    flex: 1 0 auto;
    border-left: 0;
    padding-left: 16px;
    background:
      linear-gradient(var(--row-accent), var(--row-accent)) left center / 4px 100% no-repeat,
      var(--panel);
  }

  .card-header {
    display: grid;
    min-width: 0;
  }

  .header-row,
  .identity-row,
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
    flex-wrap: nowrap;
  }

  .identity-row {
    gap: 0.6rem;
    flex: 1 1 auto;
    min-width: 0;
  }

  .header-name {
    overflow: hidden;
    color: var(--text-main);
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .footer {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
  }

  .engagement-row {
    gap: 0;
    flex: 0 0 auto;
    flex-wrap: nowrap;
  }

  @media (max-width: 760px) {
    .header-name {
      font-size: 15px;
    }
  }
</style>
