<script lang="ts">
  import { page } from '$app/stores';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import { setEventSignal } from '$lib/services/commands/events';
  import { setProjectSignal } from '$lib/services/commands/projects';
  import type { SignalToggleResult } from '$lib/types/feed';
  import { notifySignalChange } from '$lib/utils/signalEngagement';
  import { favorabilityFromCounts, invalidateEntitySignalCache } from '$lib/utils/feedSignals';
  import { requireViewer } from '$lib/utils/requireViewer';

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

  const favorability = $derived(favorabilityFromCounts(supportCount, opposeCount));

  async function handleSignal(signal: 'demand' | 'opposition') {
    if (signal === 'demand' && !canSignalDemand) {
      throw new Error('signal-gated');
    }
    if (signal === 'opposition' && !canSignalOpposition) {
      throw new Error('signal-gated');
    }
    if (!requireViewer($page.data.bootstrap?.viewer)) {
      throw new Error('auth-required');
    }

    const result =
      entityKind === 'project' ? await setProjectSignal(slug, signal) : await setEventSignal(slug, signal);

    notifySignalChange(signalChange, result);
    void invalidateEntitySignalCache(entityKind, slug);
    return result;
  }
</script>

<VoteStrip
  mode="signals"
  labeled
  {syncKey}
  {supportCount}
  {opposeCount}
  {favorability}
  {viewerSignal}
  canSupport={canSignalDemand}
  canOppose={canSignalOpposition}
  onsignal={handleSignal}
/>
