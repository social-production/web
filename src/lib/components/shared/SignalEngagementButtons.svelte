<script lang="ts">
  import { page } from '$app/stores';
  import { setEventSignal } from '$lib/services/commands/events';
  import { setProjectSignal } from '$lib/services/commands/projects';
  import type { SignalToggleResult } from '$lib/types/feed';
  import { notifySignalChange, runSignalToggle } from '$lib/utils/signalEngagement';
  import {
    invalidateEntitySignalCache,
    signalEngagementFromItem,
    type SignalEngagement
  } from '$lib/utils/feedSignals';
  import { requireViewer } from '$lib/utils/requireViewer';
  import { untrack } from 'svelte';

  let {
    entityKind,
    slug,
    syncKey = '',
    supportCount = 0,
    opposeCount = 0,
    viewerSignal = null,
    canSignalDemand = true,
    canSignalOpposition = true,
    signalChange = undefined
  }: {
    entityKind: 'project' | 'event';
    slug: string;
    syncKey?: string;
    supportCount?: number;
    opposeCount?: number;
    viewerSignal?: 'demand' | 'opposition' | null;
    canSignalDemand?: boolean;
    canSignalOpposition?: boolean;
    signalChange?: (result: SignalToggleResult) => void;
  } = $props();

  let engagement = $state<SignalEngagement>(
    signalEngagementFromItem({ supportCount: 0, opposeCount: 0, viewerSignal: null })
  );
  let toggleInFlight = $state(false);
  let lastSyncKey: string | null = null;

  $effect(() => {
    const key = syncKey;
    untrack(() => {
      if (toggleInFlight) {
        return;
      }
      if (key === lastSyncKey) {
        return;
      }
      engagement = signalEngagementFromItem({
        supportCount,
        opposeCount,
        viewerSignal
      });
      lastSyncKey = key;
    });
  });

  const demandActive = $derived(engagement.viewerSignal === 'demand');
  const oppositionActive = $derived(engagement.viewerSignal === 'opposition');

  async function toggleSignal(signal: 'demand' | 'opposition') {
    if (toggleInFlight) {
      return;
    }
    if (signal === 'demand' && !canSignalDemand) {
      return;
    }
    if (signal === 'opposition' && !canSignalOpposition) {
      return;
    }
    if (!requireViewer($page.data.bootstrap?.viewer)) {
      return;
    }

    toggleInFlight = true;

    const { apiResult } = await runSignalToggle(
      engagement,
      signal,
      async (nextSignal) =>
        entityKind === 'project'
          ? await setProjectSignal(slug, nextSignal)
          : await setEventSignal(slug, nextSignal),
      {
        onOptimistic: (next) => {
          engagement = next;
        },
        onConfirmed: (next) => {
          engagement = next;
        },
        onRevert: (snapshot) => {
          engagement = snapshot;
        }
      }
    );

    toggleInFlight = false;

    if (apiResult) {
      notifySignalChange(signalChange, apiResult);
      void invalidateEntitySignalCache(entityKind, slug);
    }
  }

  function handleSignalClick(signal: 'demand' | 'opposition', event: MouseEvent) {
    event.stopPropagation();
    void toggleSignal(signal);
  }
</script>

<div class="meta-button-row">
  <button
    aria-pressed={demandActive}
    class:active-demand={demandActive}
    class="demand-button"
    data-participation-action="signal"
    disabled={!canSignalDemand || toggleInFlight}
    title="Signal interest — this is not a lifecycle vote"
    type="button"
    onclick={(event) => handleSignalClick('demand', event)}
  >
    Support {engagement.supportCount}
  </button>
  <button
    aria-pressed={oppositionActive}
    class:active-opposition={oppositionActive}
    class="demand-button opposition-button"
    disabled={!canSignalOpposition || toggleInFlight}
    title="Signal opposition — this is not a lifecycle vote"
    type="button"
    onclick={(event) => handleSignalClick('opposition', event)}
  >
    Oppose {engagement.opposeCount}
  </button>
</div>

<style>
  .meta-button-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .demand-button {
    justify-self: start;
    min-width: 84px;
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    font-size: 13px;
    font-weight: 700;
    transition: border-color 0.16s ease, background-color 0.16s ease, color 0.16s ease;
  }

  .demand-button:hover:not(:disabled) {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .demand-button.active-demand {
    border-color: var(--brand);
    color: var(--brand-strong);
  }

  .opposition-button.active-opposition {
    border-color: var(--tablet-community-bg);
    color: var(--tablet-community-text);
  }
</style>
