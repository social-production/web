<script lang="ts">
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import IconMenuButton from '$lib/components/shared/IconMenuButton.svelte';
  import ReportControl from '$lib/components/shared/ReportControl.svelte';
  import ModerationRestrictionNotice from '$lib/components/shared/ModerationRestrictionNotice.svelte';
  import SurfaceTypeLabel from '$lib/components/cards/shared/SurfaceTypeLabel.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import { setVote } from '$lib/services/commands/shared';
  import type { ThreadPageData } from '$lib/types/detail';
  import type { VoteDirection } from '$lib/types/feed';
  import { applyVoteTarget } from '$lib/utils/feedSignals';
  import { formatRelativeTime } from '$lib/utils/time';
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
  <div class="header-row">
    <div class="chips">
      <SurfaceTypeLabel kind="thread" />
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
    </div>

    <div class="header-actions">
      <TagList tags={combinedTags} />
    </div>
  </div>

  <ModerationRestrictionNotice active={data.moderationState === 'hidden' || data.report?.resolution === 'hidden'}>
    <h1>{data.title}</h1>
    <p class="overview-copy">{data.body}</p>
  </ModerationRestrictionNotice>

  <div class="overview-footer-row">
    <VoteStrip activeVote={localActiveVote} count={localVoteCount} syncKey={data.id} onvote={handleVote} />
    <CountPill label={`${data.commentCount} comments`} />
    <IconMenuButton
      bind:value={sortMode}
      ariaLabel="Sort comments"
      defaultValue="oldest"
      options={sortOptions}
      on:change={handleSortChange}
    >
      <FeedToolbarIcon name="sort" />
    </IconMenuButton>
    <span class="footer-author-row">
      <a class="inline-link" href={`/profile/${data.authorUsername}`}>{data.authorUsername}</a>
      · {formatRelativeTime(data.lastActivityAt)}
    </span>
  </div>
</section>

<style>
  .overview-shell {
    display: grid;
    gap: 16px;
    min-width: 0;
  }

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

  .overview-footer-row {
    justify-content: flex-start;
  }

  .footer-author-row {
    margin-left: auto;
    color: var(--text-soft);
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