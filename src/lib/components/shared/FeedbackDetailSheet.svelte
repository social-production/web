<script lang="ts">
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import FeedbackVoteStrip from '$lib/components/shared/FeedbackVoteStrip.svelte';
  import type { FeedbackItem } from '$lib/types/feedback';
  import type { VoteDirection } from '$lib/types/feed';
  import { formatRelativeTimeCompact } from '$lib/utils/time';

  export let open = false;
  export let item: FeedbackItem | null = null;
  export let pendingVote = false;
  export let onVote: (vote: VoteDirection) => void | Promise<void> = () => {};

  $: kindLabel = item?.kind === 'bug' ? 'Bug' : 'Suggestion';
  $: kindIcon = ((item?.kind ?? 'suggestion') === 'bug' ? 'bug' : 'lightbulb') as
    | 'bug'
    | 'lightbulb';
  $: timeLabel = item?.createdAt ? formatRelativeTimeCompact(item.createdAt) : '';
</script>

<OverlaySheet bind:open title="Feedback" labelledById="feedback-detail-sheet" wide>
  <span slot="title" class="sheet-heading">
    {#if item}
      <span class={`kind ${item.kind}`}>
        <FeedToolbarIcon name={kindIcon} />
        <span>{kindLabel}</span>
      </span>
    {/if}
  </span>

  <span slot="subtitle" class="sheet-byline">
    {#if item}
      {#if item.authorUsername}
        <span>by {item.authorUsername}</span>
      {/if}
      {#if timeLabel}
        {#if item.authorUsername}
          <span aria-hidden="true">·</span>
        {/if}
        <span>{timeLabel}</span>
      {/if}
    {/if}
  </span>

  {#if item}
    <div class="detail-stack">
      <h3 class="detail-title">{item.title}</h3>
      <p class="description">{item.description}</p>
    </div>
  {/if}

  <div slot="footer" class="vote-dock">
    {#if item}
      <FeedbackVoteStrip
        activeVote={item.activeVote}
        approvalPercent={item.approvalPercent}
        disabled={pendingVote}
        docked
        downvoteCount={item.downvoteCount}
        onvote={onVote}
        upvoteCount={item.upvoteCount}
      />
    {/if}
  </div>
</OverlaySheet>

<style>
  .sheet-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .kind {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--text-soft);
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .kind :global(.toolbar-icon) {
    width: 20px;
    height: 20px;
  }

  .kind.bug {
    color: color-mix(in srgb, var(--accent-warm) 88%, var(--text-main));
  }

  .kind.suggestion {
    color: var(--brand-strong);
  }

  .sheet-byline {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--text-soft);
    font-size: 13px;
    font-weight: 600;
  }

  .detail-stack {
    display: grid;
    justify-items: start;
    gap: 14px;
    min-width: 0;
    max-width: 100%;
    padding: 16px 16px 20px;
  }

  .detail-title {
    margin: 0;
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
    color: var(--text-main);
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.25;
  }

  .description {
    margin: 0;
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
    color: color-mix(in srgb, var(--text-main) 86%, var(--text-soft));
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  :global(.overlay-footer:has(.vote-dock)) {
    padding: 0;
  }

  .vote-dock {
    display: flex;
    width: 100%;
    height: auto;
    min-height: 56px;
  }

  .vote-dock :global(.signal-strip.docked) {
    flex: 1 1 auto;
  }
</style>
