<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import ReportControl from '$lib/components/shared/ReportControl.svelte';
  import SurfaceTypeLabel from '$lib/components/cards/shared/SurfaceTypeLabel.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import { setVote } from '$lib/services/queries/feeds';
  import type { ThreadPageData } from '$lib/types/detail';
  import type { VoteDirection } from '$lib/types/feed';
  import { formatRelativeTime } from '$lib/utils/time';

  export let data: ThreadPageData;

  $: combinedTags = [...data.channelTags, ...data.communityTags];

  async function handleVote(event: CustomEvent<{ vote: VoteDirection }>) {
    await setVote(data.id, event.detail.vote);
    await invalidateAll();
  }
</script>

<section class="overview-shell">
  <div class="header-row">
    <div class="chips">
      <SurfaceTypeLabel kind="thread" />
    </div>

    <div class="header-actions">
      <TagList tags={combinedTags} />
      <ReportControl
        itemLabel="thread"
        report={data.report}
        ownerUsername={data.authorUsername}
        subjectId={data.id}
        targetId={data.id}
      />
    </div>
  </div>

  <h1>{data.title}</h1>
  <p class="overview-copy">{data.body}</p>

  <div class="overview-footer-row">
    <VoteStrip activeVote={data.activeVote} count={data.voteCount} on:vote={handleVote} />
    <CountPill label={`${data.commentCount} comments`} />
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