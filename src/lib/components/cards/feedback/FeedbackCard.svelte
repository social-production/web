<script lang="ts">
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import FeedbackVoteStrip from '$lib/components/shared/FeedbackVoteStrip.svelte';
  import type { FeedbackItem } from '$lib/types/feedback';
  import type { VoteDirection } from '$lib/types/feed';

  export let item: FeedbackItem;
  export let pendingVote = false;
  export let onOpen: () => void = () => {};
  export let onVote: (vote: VoteDirection) => void | Promise<void> = () => {};

  $: kindLabel = item.kind === 'bug' ? 'bug' : 'suggestion';
  $: kindIcon = (item.kind === 'bug' ? 'bug' : 'lightbulb') as 'bug' | 'lightbulb';

  function handleCardClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a')) {
      return;
    }
    onOpen();
  }

  function handleCardKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen();
    }
  }
</script>

<FeedSurface compact interactive>
  <div
    aria-label={`Open ${kindLabel}: ${item.title}`}
    class="feedback-card"
    on:click={handleCardClick}
    on:keydown={handleCardKeydown}
    role="button"
    tabindex="0"
  >
    <span class={`kind ${item.kind}`} title={kindLabel} aria-hidden="true">
      <FeedToolbarIcon name={kindIcon} />
    </span>
    <span class="title-wrap">
      <span class="feedback-title">{item.title}</span>
    </span>
    <div class="votes">
      <FeedbackVoteStrip
        activeVote={item.activeVote}
        approvalPercent={item.approvalPercent}
        disabled={pendingVote}
        downvoteCount={item.downvoteCount}
        onvote={onVote}
        upvoteCount={item.upvoteCount}
      />
    </div>
  </div>
</FeedSurface>

<style>
  .feedback-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: clip;
    outline: none;
  }

  .feedback-card:focus-visible {
    border-radius: var(--radius-sm);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand) 30%, transparent);
  }

  .kind {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    padding-top: 2px;
    color: var(--text-soft);
  }

  .kind :global(.toolbar-icon) {
    width: 24px;
    height: 24px;
  }

  .kind.bug {
    color: color-mix(in srgb, var(--accent-warm) 88%, var(--text-main));
  }

  .kind.suggestion {
    color: var(--brand-strong);
  }

  .title-wrap {
    min-width: 0;
    flex: 1 1 0;
  }

  .feedback-title {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    line-clamp: 3;
    -webkit-line-clamp: 3;
    overflow: hidden;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
    color: var(--text-main);
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.3;
  }

  .votes {
    flex: 0 0 auto;
    padding-top: 2px;
  }
</style>
