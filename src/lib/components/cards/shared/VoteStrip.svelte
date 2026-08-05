<script lang="ts">
  import type { SignalToggleResult } from '$lib/types/feed';
  import type { VoteEngagement, SignalEngagement } from '$lib/utils/feedSignals';
  import {
    applyVoteTarget,
    signalEngagementFromItem,
    voteEngagementFromItem
  } from '$lib/utils/feedSignals';
  import { runSignalToggle } from '$lib/utils/signalEngagement';
  import type { VoteDirection } from '$lib/types/feed';
  import { untrack } from 'svelte';

  type VoteHandler = (
    detail: { vote: VoteDirection }
  ) => void | Promise<void | VoteEngagement>;
  type SignalHandler = (
    signal: 'demand' | 'opposition'
  ) => void | Promise<void | SignalToggleResult>;

  let {
    mode = 'votes',
    /** Re-sync locals when entity identity changes. */
    syncKey = '',
    count = 0,
    activeVote = 0,
    supportCount = 0,
    opposeCount = 0,
    favorability = null,
    viewerSignal = null,
    disabled = false,
    onvote,
    onsignal
  }: {
    mode?: 'votes' | 'signals';
    syncKey?: string;
    count?: number;
    activeVote?: VoteDirection;
    supportCount?: number;
    opposeCount?: number;
    favorability?: number | null;
    viewerSignal?: 'demand' | 'opposition' | null;
    disabled?: boolean;
    onvote?: VoteHandler;
    onsignal?: SignalHandler;
  } = $props();

  let localActiveVote = $state(0 as VoteDirection);
  let localCount = $state(0);
  let localSupportCount = $state(0);
  let localOpposeCount = $state(0);
  let localFavorability = $state<number | null>(null);
  let localViewerSignal = $state<'demand' | 'opposition' | null>(null);
  let optimisticLock = $state(false);
  let propsDirtyDuringLock = false;
  /** After a successful vote, keep local engagement until parent props catch up. */
  let holdLocalVoteEngagement = false;
  let heldSyncKey = '';

  function syncFromProps() {
    if (mode === 'signals') {
      applySignalEngagement(
        signalEngagementFromItem({
          supportCount,
          opposeCount,
          favorability,
          viewerSignal
        })
      );
      return;
    }

    applyVoteEngagement(voteEngagementFromItem({ activeVote, voteCount: count }));
  }

  $effect(() => {
    // Re-sync when the entity identity or engagement props change.
    void syncKey;
    void activeVote;
    void count;
    void supportCount;
    void opposeCount;
    void favorability;
    void viewerSignal;

    untrack(() => {
      if (syncKey !== heldSyncKey) {
        holdLocalVoteEngagement = false;
        heldSyncKey = syncKey;
      }

      if (optimisticLock) {
        // Remember that props changed while locked so we can catch up on unlock.
        propsDirtyDuringLock = true;
        return;
      }

      if (holdLocalVoteEngagement && mode === 'votes') {
        // Parent may still have a stale loader snapshot; keep confirmed local state
        // until props agree with it.
        if (activeVote === localActiveVote && count === localCount) {
          holdLocalVoteEngagement = false;
        } else {
          return;
        }
      }

      syncFromProps();
      propsDirtyDuringLock = false;
    });
  });

  const signalFavorabilityPercent = $derived(
    localFavorability === null ? null : `${Math.round(localFavorability * 100)}%`
  );

  const signalTooltip = $derived(
    localFavorability === null
      ? `${localSupportCount} support · ${localOpposeCount} oppose · no signals yet`
      : `${localSupportCount} support · ${localOpposeCount} oppose · ${Math.round(localFavorability * 100)}% support`
  );

  function applyVoteEngagement(engagement: VoteEngagement) {
    localActiveVote = engagement.activeVote;
    localCount = engagement.voteCount;
  }

  function applySignalEngagement(engagement: SignalEngagement) {
    localSupportCount = engagement.supportCount;
    localOpposeCount = engagement.opposeCount;
    localFavorability = engagement.favorability;
    localViewerSignal = engagement.viewerSignal;
  }

  function currentSignalEngagement(): SignalEngagement {
    return signalEngagementFromItem({
      supportCount: localSupportCount,
      opposeCount: localOpposeCount,
      favorability: localFavorability,
      viewerSignal: localViewerSignal
    });
  }

  function releaseOptimisticLock(options?: { keepLocalVote?: boolean }) {
    optimisticLock = false;
    if (options?.keepLocalVote) {
      holdLocalVoteEngagement = true;
      heldSyncKey = syncKey;
      propsDirtyDuringLock = false;
      return;
    }

    if (propsDirtyDuringLock) {
      syncFromProps();
      propsDirtyDuringLock = false;
    }
  }

  async function runVote(targetVote: VoteDirection) {
    const snapshot = voteEngagementFromItem({
      activeVote: localActiveVote,
      voteCount: localCount
    });

    optimisticLock = true;
    propsDirtyDuringLock = false;
    holdLocalVoteEngagement = false;
    applyVoteEngagement(applyVoteTarget(snapshot.activeVote, snapshot.voteCount, targetVote));

    try {
      const confirmed = await onvote?.({ vote: targetVote });
      if (confirmed && 'voteCount' in confirmed) {
        applyVoteEngagement(confirmed);
      }
      releaseOptimisticLock({ keepLocalVote: true });
    } catch {
      applyVoteEngagement(snapshot);
      releaseOptimisticLock();
    }
  }

  async function runSignal(signal: 'demand' | 'opposition') {
    if (!onsignal) {
      return;
    }

    optimisticLock = true;
    propsDirtyDuringLock = false;
    try {
      await runSignalToggle(currentSignalEngagement(), signal, async (nextSignal) => onsignal(nextSignal), {
        onOptimistic: applySignalEngagement,
        onConfirmed: applySignalEngagement,
        onRevert: applySignalEngagement
      });
      releaseOptimisticLock();
    } catch {
      releaseOptimisticLock();
    }
  }

  function handleVoteClick(button: Exclude<VoteDirection, 0>, event: MouseEvent) {
    event.stopPropagation();
    const targetVote: VoteDirection = localActiveVote === button ? 0 : button;
    void runVote(targetVote);
  }

  function handleSignalClick(signal: 'demand' | 'opposition', event: MouseEvent) {
    event.stopPropagation();
    if (disabled) {
      return;
    }

    void runSignal(signal);
  }
</script>

{#if mode === 'signals'}
  <div class="vote-strip signal-strip" class:disabled title={signalTooltip}>
    <button
      aria-label={`Support · ${localSupportCount}`}
      aria-pressed={localViewerSignal === 'demand'}
      class:active-support={localViewerSignal === 'demand'}
      class="signal-button vote-button"
      disabled={disabled}
      type="button"
      onclick={(event) => handleSignalClick('demand', event)}
    >
      ▲
    </button>
    <span class="signal-percent" aria-label={signalTooltip}>{signalFavorabilityPercent ?? '—'}</span>
    <button
      aria-label={`Oppose · ${localOpposeCount}`}
      aria-pressed={localViewerSignal === 'opposition'}
      class:active-oppose={localViewerSignal === 'opposition'}
      class="signal-button vote-button"
      disabled={disabled}
      type="button"
      onclick={(event) => handleSignalClick('opposition', event)}
    >
      ▼
    </button>
  </div>
{:else}
  <div class="vote-strip">
    <button
      aria-label="Vote up"
      class:active-up={localActiveVote === 1}
      class="vote-button"
      type="button"
      onclick={(event) => handleVoteClick(1, event)}
    >
      ▲
    </button>
    <span
      class:active-up={localActiveVote === 1}
      class:active-down={localActiveVote === -1}
      class="vote-count"
    >
      {localCount}
    </span>
    <button
      aria-label="Vote down"
      class:active-down={localActiveVote === -1}
      class="vote-button"
      type="button"
      onclick={(event) => handleVoteClick(-1, event)}
    >
      ▼
    </button>
  </div>
{/if}

<style>
  .vote-strip {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 32px;
    padding: 4px 6px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    transition: border-color 120ms ease, background-color 120ms ease;
  }

  .vote-strip:hover {
    border-color: var(--brand);
    background: color-mix(in srgb, var(--brand-soft) 78%, var(--panel-strong));
  }

  .vote-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    color: var(--text-soft);
    font-size: 11px;
    line-height: 1;
    border-radius: 999px;
    transition: color 120ms ease, background-color 120ms ease;
  }

  .vote-button:hover:not(:disabled) {
    background: color-mix(in srgb, var(--brand-soft) 88%, transparent);
    color: var(--brand-strong);
  }

  .vote-button:disabled {
    cursor: not-allowed;
  }

  .vote-count {
    min-width: 20px;
    text-align: center;
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
  }

  .active-up {
    color: #22c55e;
  }

  .active-down {
    color: #ef4444;
  }

  .signal-strip {
    gap: 4px;
    padding: 4px 6px;
  }

  .signal-strip.disabled {
    opacity: 0.6;
  }

  .signal-percent {
    min-width: 28px;
    text-align: center;
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
  }

  .active-support {
    color: #22c55e;
  }

  .active-oppose {
    color: #ef4444;
  }

  @media (max-width: 760px) {
    .vote-strip {
      gap: 4px;
      min-height: 24px;
      padding: 2px 4px;
      border-color: color-mix(in srgb, var(--panel-border) 88%, transparent);
    }

    .vote-button {
      width: 20px;
      height: 20px;
      font-size: 10px;
    }

    .vote-count,
    .signal-percent {
      min-width: 22px;
      font-size: 10px;
    }
  }
</style>
