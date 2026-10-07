<script lang="ts">
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import FeedCardTop from '$lib/components/cards/shared/FeedCardTop.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import IconMenuButton from '$lib/components/shared/IconMenuButton.svelte';
  import ReportControl from '$lib/components/shared/ReportControl.svelte';
  import ModerationRestrictionNotice from '$lib/components/shared/ModerationRestrictionNotice.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import ContentMetaRow from '$lib/components/shared/ContentMetaRow.svelte';
  import GuestBrowseLine from '$lib/components/shared/GuestBrowseLine.svelte';
  import ShareUserMenu from '$lib/components/shared/ShareUserMenu.svelte';
  import { page } from '$app/stores';
  import { shareThreadWithUser } from '$lib/services/commands/create';
  import { getMessageContacts } from '$lib/services/queries/inbox';
  import { setVote } from '$lib/services/commands/shared';
  import type { DetailMember } from '$lib/types/detail';
  import { buildShareUrl } from '$lib/utils/sharePrefill';
  import type { ThreadPageData } from '$lib/types/detail';
  import type { VoteDirection } from '$lib/types/feed';
  import { applyVoteTarget } from '$lib/utils/feedSignals';
  import { createEventDispatcher } from 'svelte';

  export let data: ThreadPageData;
  export let sortMode: CommentSort = 'oldest';

  type CommentSort = 'oldest' | 'newest' | 'top';

  const dispatch = createEventDispatcher<{ sortchange: { value: CommentSort } }>();

  const sortOptions = [
    { value: 'oldest', label: 'Oldest first' },
    { value: 'newest', label: 'Newest first' },
    { value: 'top', label: 'Top voted' }
  ];

  let localActiveVote = data.activeVote;
  let localVoteCount = data.voteCount;
  let lastVoteSyncKey = data.id;

  $: combinedTags = [...data.channelTags, ...data.communityTags];
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

  function handleThreadShare(username: string) {
    return shareThreadWithUser(data.slug, username);
  }

  async function handleVote({ vote }: { vote: VoteDirection }) {
    const next = applyVoteTarget(localActiveVote, localVoteCount, vote);
    localActiveVote = next.activeVote;
    localVoteCount = next.voteCount;
    await setVote({ id: data.id, type: 'thread' }, vote);
  }

  function handleSortChange(event: CustomEvent<{ value: string }>) {
    sortMode = event.detail.value as CommentSort;
    dispatch('sortchange', { value: sortMode });
  }
</script>

<section class="overview-shell">
  <FeedCardTop tags={combinedTags}>
    <ReportControl
      hasActiveReport={Boolean(data.report)}
      isUnderReview={data.moderationState === 'under_review' || data.report?.resolution === 'under_review' || data.report?.resolution === 'open'}
      itemLabel="thread"
      moderationState={data.moderationState}
      report={data.report}
      ownerUsername={data.authorUsername}
      subjectId={data.id}
      targetId={data.id}
      targetType="thread"
    />
  </FeedCardTop>

  <ModerationRestrictionNotice active={data.moderationState === 'hidden' || data.report?.resolution === 'hidden'}>
    <h1>{data.title}</h1>
    <GuestBrowseLine kind="thread" />
    <p class="overview-copy">{data.body}</p>
  </ModerationRestrictionNotice>

  <div class="footer detail-footer">
    <div class="engagement-row feed-corner-actions">
      <VoteStrip corner activeVote={localActiveVote} count={localVoteCount} syncKey={data.id} onvote={handleVote} />
      <span class="comment-link">
        <CountPill label={`${data.commentCount} comments`} />
      </span>
      <span class="detail-tool">
        <IconMenuButton
          bind:value={sortMode}
          ariaLabel="Sort comments"
          defaultValue="oldest"
          options={sortOptions}
          on:change={handleSortChange}
        >
          <FeedToolbarIcon name="sort" />
        </IconMenuButton>
      </span>
      {#if $page.data.bootstrap?.viewer}
        <span class="detail-tool">
          <ShareUserMenu
            copyLinkUrl={buildShareUrl(`/threads/${data.slug}`)}
            menuTitle="Share thread"
            searchContacts={searchShareContacts}
            submitShare={handleThreadShare}
          />
        </span>
      {/if}
    </div>
    <div class="footer-meta">
      <ContentMetaRow authorUsername={data.authorUsername} createdAt={data.lastActivityAt} />
    </div>
  </div>
</section>

<style>
  .overview-shell {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .footer,
  .engagement-row {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .footer {
    justify-content: space-between;
    flex-wrap: nowrap;
    gap: 8px;
    color: var(--text-soft);
    font-size: 13px;
  }

  .engagement-row {
    flex: 0 0 auto;
    flex-wrap: nowrap;
    gap: 0;
  }

  h1 {
    margin: 0;
    font-size: 24px;
    letter-spacing: -0.02em;
    color: var(--text-main);
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .overview-copy {
    margin: 0;
    padding-bottom: 4px;
    color: var(--text-soft);
    line-height: 1.55;
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
    white-space: pre-wrap;
  }

  @media (max-width: 760px) {
    h1 {
      font-size: 20px;
    }
  }
</style>