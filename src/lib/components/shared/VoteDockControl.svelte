<script lang="ts">
  import { afterUpdate } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import RoundPlusButton from '$lib/components/shared/RoundPlusButton.svelte';
  import VoteChoiceBar from '$lib/components/shared/VoteChoiceBar.svelte';
  import VoteDecisionBody from '$lib/components/shared/VoteDecisionBody.svelte';
  import type { ProjectApprovalVote } from '$lib/types/detail';
  import type { PendingVoteItem } from '$lib/utils/pendingVotes';

  export let items: PendingVoteItem[] = [];
  export let sheetId = 'vote-dock-sheet';
  export let revealKind: string | null = null;
  export let revealId: string | null = null;
  export let buttonTarget = '';
  export let onVote: (
    item: PendingVoteItem,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  export let onAssess: (item: PendingVoteItem) => void | Promise<void> = () => {};
  export let onAction: (item: PendingVoteItem) => void | Promise<void> = () => {};

  let open = false;
  let revealed = '';
  let buttonEl: HTMLDivElement | null = null;
  let index = 0;

  $: revealKey = revealKind && revealId ? `${revealKind}:${revealId}` : '';
  $: if (
    revealKey &&
    revealKey !== revealed &&
    items.some((item) => item.voteKind === revealKind && item.id === revealId)
  ) {
    index = Math.max(
      0,
      items.findIndex((item) => item.voteKind === revealKind && item.id === revealId)
    );
    open = true;
    revealed = revealKey;
  }
  const VOTE_LINK_PARAMS = ['open', 'voteKind', 'voteTarget', 'assess', 'criterionId'];
  let wasOpen = false;

  /** A vote opened from a link drops that link once it closes, so other tabs stop reopening it. */
  function clearVoteLink() {
    if (!browser) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('open') !== 'vote') return;
    for (const key of VOTE_LINK_PARAMS) url.searchParams.delete(key);
    void goto(`${url.pathname}${url.search}${url.hash}`, {
      replaceState: true,
      noScroll: true,
      keepFocus: true
    });
  }

  $: {
    if (wasOpen && !open && revealed) clearVoteLink();
    wasOpen = open;
  }

  $: if (items.length > 0 && index >= items.length) {
    index = 0;
  }
  $: current = items[index] ?? null;
  $: currentIsChoice = Boolean(
    current && current.canVote && !current.actionLabel && !current.planCriterionId
  );

  function placeButton() {
    if (!buttonTarget || !buttonEl) {
      return;
    }
    const target = document.getElementById(buttonTarget);
    if (target && buttonEl.parentElement !== target) {
      target.appendChild(buttonEl);
    }
  }

  afterUpdate(placeButton);

  // Keep showing the chosen next vote even if the list reorders after a vote lands.
  let followKey: string | null = null;
  $: if (followKey) {
    const at = items.findIndex((item) => keyOf(item) === followKey);
    if (at >= 0) index = at;
  }
  $: if (!open) followKey = null;

  // Votes cast since the sheet opened; voting moves on to the next one until all are done.
  let votedThisRound = new Set<string>();
  const keyOf = (item: PendingVoteItem) => `${item.voteKind}:${item.id}`;

  function openVotes() {
    votedThisRound = new Set();
    const firstUnvoted = items.findIndex((item) => !item.voteSummary.activeVote);
    index = firstUnvoted >= 0 ? firstUnvoted : 0;
    open = true;
  }

  function advanceAfterVote(from: PendingVoteItem) {
    votedThisRound = new Set([...votedThisRound, keyOf(from)]);
    const start = items.findIndex((item) => keyOf(item) === keyOf(from));
    for (let step = 1; step <= items.length; step += 1) {
      const candidate = items[(Math.max(start, 0) + step) % items.length];
      if (candidate && !votedThisRound.has(keyOf(candidate))) {
        index = items.indexOf(candidate);
        followKey = keyOf(candidate);
        return;
      }
    }
    open = false;
  }

  function showNext() {
    if (items.length < 2) {
      return;
    }
    index = (index + 1) % items.length;
    followKey = null;
  }

  function cast(item: PendingVoteItem, vote: ProjectApprovalVote) {
    const next = item.voteSummary.activeVote === vote ? null : vote;
    advanceAfterVote(item);
    void onVote(item, next);
  }

  $: remaining = items.filter((item) => !votedThisRound.has(keyOf(item))).length;
</script>

{#if items.length > 0}
  <div class="vote-dock" bind:this={buttonEl}>
    <RoundPlusButton
      standout
      label="Vote"
      ariaLabel="Vote"
      participationAction="cast-vote"
      action={openVotes}
    />
  </div>
{/if}

<OverlaySheet bind:open title={current?.label ?? 'Vote'} labelledById={sheetId}>
  {#if current}
    {@const item = current}
    <div class="vote-list">
      <article class="vote-block">
        <VoteDecisionBody
          {item}
          showLabel
          hideChoices
          onAssess={() => {
            open = false;
            void onAssess(item);
          }}
          onAction={() => {
            open = false;
            void onAction(item);
          }}
        />
      </article>
    </div>
  {/if}
  <svelte:fragment slot="footer">
    {#if current}
      {@const item = current}
      <div class="vote-footer">
        {#if items.length > 1}
          <button class="vote-next" type="button" on:click={showNext}>
            <span>Next</span>
            <span class="vote-progress">· {remaining} left</span>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="M9 6.5 14.5 12 9 17.5"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        {/if}
        {#if currentIsChoice}
          <VoteChoiceBar
            activeVote={item.voteSummary.activeVote}
            onChoose={(vote) => cast(item, vote)}
          />
        {/if}
      </div>
    {/if}
  </svelte:fragment>
</OverlaySheet>

<style>
  .vote-dock {
    display: flex;
    flex: 1 1 0;
    align-items: stretch;
    min-width: 72px;
    min-height: 44px;
  }

  .vote-dock :global(.round-plus-button) {
    flex: 1 1 auto;
    width: 100%;
    min-height: 44px;
    margin: 0;
    justify-content: center;
    border-radius: 0;
  }

  .vote-list {
    display: grid;
    padding: 4px 16px 20px;
  }

  :global(.overlay-footer:has(.vote-footer)) {
    flex-direction: column;
    gap: 0;
  }

  .vote-footer {
    display: grid;
    width: 100%;
  }

  .vote-progress {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
  }

  .vote-next {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    min-height: 48px;
    border: 0;
    border-radius: 0;
    background: #111;
    color: #fff;
    font: inherit;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
  }

  .vote-next svg {
    width: 18px;
    height: 18px;
  }
</style>
