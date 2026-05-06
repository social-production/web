<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import CountPill from '$lib/components/cards/shared/CountPill.svelte';
  import SubjectTablet from '$lib/components/cards/shared/SubjectTablet.svelte';
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
      <SubjectTablet kind="thread" />
    </div>

    <div class="tag-stack">
      <TagList columns={4} tags={combinedTags} />
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
  .overview-shell,
  .tag-stack {
    display: grid;
    gap: 16px;
  }

  .header-row,
  .chips,
  .overview-footer-row {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .header-row {
    justify-content: space-between;
  }

  h1 {
    margin: 0;
    font-size: 24px;
    letter-spacing: -0.02em;
    color: var(--text-main);
  }

  .overview-copy {
    margin: 0;
    padding-bottom: 4px;
    color: var(--text-soft);
    line-height: 1.55;
  }

  .overview-footer-row {
    justify-content: flex-start;
    padding-top: 16px;
    border-top: 1px solid var(--panel-border);
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